import { Hono } from "hono";
import { type AuthEnv, requireRole } from "../../auth/middleware.ts";
import { getCurrentUser, hasMinRole, canManageResource } from "../../auth/roles.ts";
import { ensureCurrentUser } from "../../helpers.ts";
import { buildCrudRoutes } from "../crud-builder.ts";
import {
	validateCreateResource,
	validateUpdateResource,
	validateStatus,
	validateTransition,
} from "@procomeka/db/validation";
import { getDb } from "../../db.ts";
import * as repo from "@procomeka/db/repository";
import { getUploadConfig } from "../../uploads/config.ts";
import { readUploadContent, terminateUpload } from "../uploads.ts";

const db = () => getDb().db;

// --- Upload routes (montadas en /uploads por admin/index.ts) ---

const adminUploadRoutes = new Hono<AuthEnv>();

adminUploadRoutes.get("/config", async (c) => c.json(getUploadConfig()));

adminUploadRoutes.use("/:id/*", requireRole("author"));

adminUploadRoutes.delete("/:id", requireRole("author"), async (c) => {
	const user = getCurrentUser(c);
	const { id } = c.req.param();
	const session = await repo.getUploadSessionById(db(), id);
	if (!session) return c.json({ error: "Upload no encontrado" }, 404);

	const resource = await repo.getResourceById(db(), session.resourceId);
	if (!resource) return c.json({ error: "Recurso no encontrado" }, 404);
	if (!canManageResource(user, resource)) return c.json({ error: "Permisos insuficientes" }, 403);

	await terminateUpload(id, user);
	return c.json({ id, cancelled: true });
});

adminUploadRoutes.get("/:id/content", async (c) => {
	const user = getCurrentUser(c);
	const { id } = c.req.param();
	const session = await repo.getUploadSessionById(db(), id);
	if (!session) return c.json({ error: "Upload no encontrado" }, 404);

	const resource = await repo.getResourceById(db(), session.resourceId);
	if (!resource) return c.json({ error: "Recurso no encontrado" }, 404);
	if (!canManageResource(user, resource)) return c.json({ error: "Permisos insuficientes" }, 403);

	const body = await readUploadContent(id);
	return c.body(body, 200, {
		"Content-Type": session.mimeType ?? "application/octet-stream",
		"Content-Disposition": `inline; filename="${session.originalFilename}"`,
	});
});

// --- Resource CRUD (montadas en /resources por admin/index.ts) ---

const resourceRoutes = buildCrudRoutes({
	baseRole: "author",
	list: (db, opts) => repo.listResources(db, opts as Parameters<typeof repo.listResources>[1]),
	getById: repo.getResourceById,
	create: (db, data) => repo.createResource(db, data as Parameters<typeof repo.createResource>[1]),
	update: (db, id, data) => repo.updateResource(db, id, data as Parameters<typeof repo.updateResource>[2]),
	remove: repo.deleteResource,
	validateCreate: validateCreateResource,
	validateUpdate: validateUpdateResource,
	canManage: canManageResource,
	listFilters: (user, params) => {
		const isCurator = hasMinRole(user.role, "curator");
		const isAdmin = hasMinRole(user.role, "admin");
		return {
			status: params.status,
			createdBy: isCurator ? undefined : user.id,
			visibleToUserId: isCurator && !isAdmin ? user.id : undefined,
		};
	},
	prepareCreate: async (body, user) => {
		await ensureCurrentUser(user);
		return { ...body, createdBy: user.id };
	},
	notFoundMessage: "Recurso no encontrado",
});

// --- Sub-resource routes (custom, appended to resourceRoutes) ---

resourceRoutes.get("/:id/media", async (c) => {
	const user = getCurrentUser(c);
	const { id } = c.req.param();
	const resource = await repo.getResourceById(db(), id);
	if (!resource) return c.json({ error: "Recurso no encontrado" }, 404);
	if (!canManageResource(user, resource)) return c.json({ error: "Permisos insuficientes" }, 403);
	return c.json(await repo.listMediaItemsForResource(db(), id));
});

resourceRoutes.get("/:id/uploads", async (c) => {
	const user = getCurrentUser(c);
	const { id } = c.req.param();
	const resource = await repo.getResourceById(db(), id);
	if (!resource) return c.json({ error: "Recurso no encontrado" }, 404);
	if (!canManageResource(user, resource)) return c.json({ error: "Permisos insuficientes" }, 403);
	return c.json(await repo.listUploadSessionsForResource(db(), id));
});

resourceRoutes.patch("/:id/status", async (c) => {
	const user = getCurrentUser(c);
	const { id } = c.req.param();
	const body = await c.req.json();

	const validation = validateStatus(body.status);
	if (!validation.valid) return c.json({ error: "Validación fallida", details: validation.errors }, 400);

	const existing = await repo.getResourceById(db(), id);
	if (!existing) return c.json({ error: "Recurso no encontrado" }, 404);
	if (!canManageResource(user, existing)) return c.json({ error: "Permisos insuficientes" }, 403);

	const userRole = user.role ?? "reader";
	const transitionCheck = validateTransition(existing.editorialStatus, body.status, userRole);
	if (!transitionCheck.valid) return c.json({ error: "Transición no permitida", details: transitionCheck.errors }, 403);

	await repo.updateEditorialStatus(db(), id, body.status, user.id);
	return c.json({ id, status: body.status });
});

export { resourceRoutes, adminUploadRoutes };
