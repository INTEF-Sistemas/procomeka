import { Hono } from "hono";
import { listResources, getResourceBySlug } from "../resources/repository.ts";
import { readUploadContent } from "./uploads.ts";
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";

const publicRoutes = new Hono();

publicRoutes.get("/resources", async (c) => {
	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;
	const resourceType = c.req.query("resourceType") ?? undefined;
	const language = c.req.query("language") ?? undefined;
	const license = c.req.query("license") ?? undefined;

	const result = await listResources({
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
	const resource = await getResourceBySlug(slug);
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

publicRoutes.get("/collections", (c) =>
	c.json({ data: [], total: 0 }),
);

publicRoutes.get("/collections/:slug", (c) => {
	const { slug } = c.req.param();
	return c.json({ slug, message: "Detalle de colección (pendiente)" });
});

export { publicRoutes };
