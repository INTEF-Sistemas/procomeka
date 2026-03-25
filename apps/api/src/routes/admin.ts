import { Hono } from "hono";
import {
	type AuthEnv,
	requireAuth,
	requireRole,
} from "../auth/middleware.ts";
import {
	createResource,
	updateResource,
	deleteResource,
	updateEditorialStatus,
} from "../resources/repository.ts";

const adminRoutes = new Hono<AuthEnv>();

adminRoutes.use("*", requireAuth);

adminRoutes.post("/resources", requireRole("author"), async (c) => {
	const body = await c.req.json();

	if (!body.title || !body.description || !body.language || !body.license || !body.resourceType) {
		return c.json({ error: "Campos obligatorios: title, description, language, license, resourceType" }, 400);
	}

	const result = await createResource(body);
	return c.json(result, 201);
});

adminRoutes.put("/resources/:id", requireRole("author"), async (c) => {
	const { id } = c.req.param();
	const body = await c.req.json();
	await updateResource(id, body);
	return c.json({ id, updated: true });
});

adminRoutes.delete("/resources/:id", requireRole("admin"), async (c) => {
	const { id } = c.req.param();
	await deleteResource(id);
	return c.json({ id, deleted: true });
});

adminRoutes.patch("/resources/:id/status", requireRole("curator"), async (c) => {
	const { id } = c.req.param();
	const body = await c.req.json();

	if (!body.status) {
		return c.json({ error: "Campo obligatorio: status" }, 400);
	}

	const user = c.get("user");
	const userId = (user as { id: string }).id;
	await updateEditorialStatus(id, body.status, userId);
	return c.json({ id, status: body.status });
});

adminRoutes.get("/users", requireRole("admin"), (c) =>
	c.json({ data: [], total: 0, message: "Listado de usuarios (pendiente)" }),
);

adminRoutes.patch("/users/:id", requireRole("admin"), (c) => {
	const { id } = c.req.param();
	return c.json({ id, message: "Actualizar usuario (pendiente)" });
});

export { adminRoutes };
