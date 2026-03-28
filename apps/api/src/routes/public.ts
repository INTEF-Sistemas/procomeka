import { Hono } from "hono";
import { readUploadContent } from "./uploads.ts";
import { parsePagination } from "../helpers.ts";
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";

const publicRoutes = new Hono();

publicRoutes.get("/resources", async (c) => {
	const { limit, offset, search } = parsePagination(c);
	const resourceType = c.req.query("resourceType") ?? undefined;
	const language = c.req.query("language") ?? undefined;
	const license = c.req.query("license") ?? undefined;

	const result = await repo.listResources(getDb().db, {
		limit,
		offset,
		search,
		status: "published",
		resourceType,
		language,
		license,
	});
	return c.json(result);
});

publicRoutes.get("/resources/:slug", async (c) => {
	const { slug } = c.req.param();
	const resource = await repo.getResourceBySlug(getDb().db, slug);
	if (!resource || resource.editorialStatus !== "published") {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	return c.json(resource);
});

publicRoutes.get("/uploads/:id/content", async (c) => {
	const { id } = c.req.param();
	const session = await repo.getUploadSessionById(getDb().db, id);
	if (!session || session.status !== "completed" || !session.mediaItemId) {
		return c.json({ error: "Archivo no encontrado" }, 404);
	}

	const resource = await repo.getResourceById(getDb().db, session.resourceId);
	if (!resource || resource.editorialStatus !== "published") {
		return c.json({ error: "Archivo no encontrado" }, 404);
	}

	const body = await readUploadContent(id).catch(() => null);
	if (!body) {
		return c.json({ error: "Archivo no encontrado" }, 404);
	}

	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": session.mimeType ?? "application/octet-stream",
			"Content-Disposition": `attachment; filename="${session.originalFilename}"`,
		},
	});
});

publicRoutes.get("/taxonomies/:type", async (c) => {
	const { type } = c.req.param();
	const result = await repo.listTaxonomies(getDb().db, { type, limit: 100 });
	return c.json(result.data);
});

publicRoutes.get("/collections", (c) =>
	c.json({ data: [], total: 0 }),
);

publicRoutes.get("/collections/:slug", (c) => {
	const { slug } = c.req.param();
	return c.json({ slug, message: "Detalle de colección (pendiente)" });
});

export { publicRoutes };
