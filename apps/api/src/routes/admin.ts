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
	listResources,
	getResourceById,
} from "../resources/repository.ts";
import {
	validateCreateResource,
	validateUpdateResource,
	validateStatus,
} from "../resources/validation.ts";

const adminRoutes = new Hono<AuthEnv>();

adminRoutes.use("*", requireAuth);

adminRoutes.get("/resources", requireRole("author"), async (c) => {
	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;
	const status = c.req.query("status") ?? undefined;

	const result = await listResources({ limit, offset, search, status });
	return c.json(result);
});

adminRoutes.get("/resources/:id", requireRole("author"), async (c) => {
	const { id } = c.req.param();
	const resource = await getResourceById(id);
	if (!resource) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	return c.json(resource);
});

adminRoutes.post("/resources", requireRole("author"), async (c) => {
	const body = await c.req.json();
	const validation = validateCreateResource(body);

	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	const result = await createResource(body);
	return c.json(result, 201);
});

adminRoutes.patch("/resources/:id", requireRole("author"), async (c) => {
	const { id } = c.req.param();
	const existing = await getResourceById(id);
	if (!existing) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}

	const body = await c.req.json();
	const validation = validateUpdateResource(body);

	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

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

	const validation = validateStatus(body.status);
	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
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
