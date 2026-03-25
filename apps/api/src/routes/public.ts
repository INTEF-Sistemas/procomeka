import { Hono } from "hono";
import { listResources, getResourceBySlug } from "../resources/repository.ts";

const publicRoutes = new Hono();

publicRoutes.get("/resources", async (c) => {
	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;

	const result = await listResources({ limit, offset, search });
	return c.json(result);
});

publicRoutes.get("/resources/:slug", async (c) => {
	const { slug } = c.req.param();
	const resource = await getResourceBySlug(slug);
	if (!resource) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	return c.json(resource);
});

publicRoutes.get("/collections", (c) =>
	c.json({ data: [], total: 0 }),
);

publicRoutes.get("/collections/:slug", (c) => {
	const { slug } = c.req.param();
	return c.json({ slug, message: "Detalle de colección (pendiente)" });
});

export { publicRoutes };
