import { Hono, type Context } from "hono";
import {
	type AuthEnv,
	requireAuth,
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
	validateTransition,
} from "../resources/validation.ts";
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";

const adminRoutes = new Hono<AuthEnv>();

adminRoutes.use("*", requireAuth);

const ROLE_LEVELS: Record<string, number> = {
	reader: 0,
	author: 1,
	curator: 2,
	admin: 3,
};

function getCurrentUser(c: Context<AuthEnv>) {
	return c.get("user") as { id: string; role?: string; name?: string; email?: string };
}

function hasMinRole(role: string | undefined, minRole: keyof typeof ROLE_LEVELS) {
	return (ROLE_LEVELS[role ?? "reader"] ?? 0) >= ROLE_LEVELS[minRole];
}

function canManageResource(
	user: { id: string; role?: string },
	resource: { createdBy?: string | null; assignedCuratorId?: string | null },
) {
	if (hasMinRole(user.role, "admin")) return true;
	if (hasMinRole(user.role, "curator")) {
		return resource.createdBy === user.id || resource.assignedCuratorId === user.id;
	}
	if (hasMinRole(user.role, "author")) {
		return resource.createdBy === user.id;
	}
	return false;
}

function canManageCollection(
	user: { id: string; role?: string },
	collection: { curatorId?: string | null },
) {
	if (hasMinRole(user.role, "admin")) return true;
	if (hasMinRole(user.role, "author")) {
		return collection.curatorId === user.id;
	}
	return false;
}

function validateCollection(body: Record<string, unknown>) {
	const errors = [];
	if (!String(body.title ?? "").trim()) {
		errors.push({ field: "title", message: "El título es obligatorio" });
	}
	if (!String(body.description ?? "").trim()) {
		errors.push({ field: "description", message: "La descripción es obligatoria" });
	}
	return { valid: errors.length === 0, errors };
}

function validateTaxonomy(body: Record<string, unknown>) {
	const errors = [];
	if (!String(body.name ?? "").trim()) {
		errors.push({ field: "name", message: "El nombre es obligatorio" });
	}
	return { valid: errors.length === 0, errors };
}

adminRoutes.get("/resources", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;
	const status = c.req.query("status") ?? undefined;

	const result = await listResources({
		limit,
		offset,
		search,
		status,
		createdBy: hasMinRole(user.role, "curator") ? undefined : user.id,
		visibleToUserId: hasMinRole(user.role, "curator") && !hasMinRole(user.role, "admin")
			? user.id
			: undefined,
	});
	return c.json(result);
});

adminRoutes.get("/resources/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const resource = await getResourceById(id);
	if (!resource) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	if (!canManageResource(user, resource)) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}
	return c.json(resource);
});

adminRoutes.post("/resources", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const body = await c.req.json();
	const validation = validateCreateResource(body);

	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	await repo.ensureUser(getDb().db, {
		id: user.id,
		email: user.email ?? `${user.id}@local.invalid`,
		name: user.name ?? null,
		role: user.role ?? "reader",
	});
	const result = await createResource({ ...body, createdBy: user.id });
	return c.json(result, 201);
});

adminRoutes.patch("/resources/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const existing = await getResourceById(id);
	if (!existing) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	if (!canManageResource(user, existing)) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const body = await c.req.json();
	const validation = validateUpdateResource(body);

	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	await updateResource(id, body);
	return c.json({ id, updated: true });
});

adminRoutes.delete("/resources/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const existing = await getResourceById(id);
	if (!existing) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	if (!canManageResource(user, existing)) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}
	await deleteResource(id);
	return c.json({ id, deleted: true });
});

adminRoutes.patch("/resources/:id/status", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const body = await c.req.json();

	const validation = validateStatus(body.status);
	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	const existing = await getResourceById(id);
	if (!existing) {
		return c.json({ error: "Recurso no encontrado" }, 404);
	}
	if (!canManageResource(user, existing)) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const userRole = user.role ?? "reader";
	const transitionCheck = validateTransition(existing.editorialStatus, body.status, userRole);
	if (!transitionCheck.valid) {
		return c.json({ error: "Transición no permitida", details: transitionCheck.errors }, 403);
	}

	await updateEditorialStatus(id, body.status, user.id);
	return c.json({ id, status: body.status });
});

adminRoutes.get("/users", async (c) => {
	const user = getCurrentUser(c);
	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;
	const role = c.req.query("role") ?? undefined;

	if (hasMinRole(user.role, "admin")) {
		return c.json(await repo.listUsers(getDb().db, { limit, offset, search, role }));
	}

	const ownUsers = await repo.listUsers(getDb().db, { limit, offset, id: user.id });
	if (ownUsers.total > 0) {
		return c.json(ownUsers);
	}

	return c.json({
		data: [{
			id: user.id,
			email: user.email ?? "",
			name: user.name ?? null,
			role: user.role ?? "reader",
			isActive: true,
		}],
		total: 1,
		limit,
		offset,
	});
});

adminRoutes.get("/users/:id", async (c) => {
	const currentUser = getCurrentUser(c);
	const { id } = c.req.param();
	if (!hasMinRole(currentUser.role, "admin") && currentUser.id !== id) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const found = await repo.getUserById(getDb().db, id);
	if (!found && currentUser.id === id) {
		return c.json({
			id: currentUser.id,
			email: currentUser.email ?? "",
			name: currentUser.name ?? null,
			role: currentUser.role ?? "reader",
			isActive: true,
		});
	}
	if (!found) {
		return c.json({ error: "Usuario no encontrado" }, 404);
	}
	return c.json(found);
});

adminRoutes.patch("/users/:id", async (c) => {
	const currentUser = getCurrentUser(c);
	const { id } = c.req.param();
	if (!hasMinRole(currentUser.role, "admin") && currentUser.id !== id) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const existing = await repo.getUserById(getDb().db, id);
	if (!existing) {
		return c.json({ error: "Usuario no encontrado" }, 404);
	}

	const body = await c.req.json();
	const updates: { name?: string | null; role?: string; isActive?: boolean } = {};
	if ("name" in body) updates.name = typeof body.name === "string" ? body.name : null;
	if (hasMinRole(currentUser.role, "admin")) {
		if (typeof body.role === "string") updates.role = body.role;
		if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
	}

	await repo.updateUser(getDb().db, id, updates);
	return c.json({ id, updated: true });
});

adminRoutes.get("/collections", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;

	return c.json(
		await repo.listCollections(getDb().db, {
			limit,
			offset,
			search,
			curatorId: hasMinRole(user.role, "admin") ? undefined : user.id,
		}),
	);
});

adminRoutes.get("/collections/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const collection = await repo.getCollectionById(getDb().db, id);
	if (!collection) return c.json({ error: "Colección no encontrada" }, 404);
	if (!canManageCollection(user, collection)) return c.json({ error: "Permisos insuficientes" }, 403);
	return c.json(collection);
});

adminRoutes.post("/collections", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const body = await c.req.json();
	const validation = validateCollection(body);
	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	await repo.ensureUser(getDb().db, {
		id: user.id,
		email: user.email ?? `${user.id}@local.invalid`,
		name: user.name ?? null,
		role: user.role ?? "reader",
	});
	const result = await repo.createCollection(getDb().db, {
		title: body.title,
		description: body.description,
		curatorId: user.id,
		editorialStatus: typeof body.editorialStatus === "string" ? body.editorialStatus : undefined,
		isOrdered: body.isOrdered ? 1 : 0,
	});
	return c.json(result, 201);
});

adminRoutes.patch("/collections/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const existing = await repo.getCollectionById(getDb().db, id);
	if (!existing) return c.json({ error: "Colección no encontrada" }, 404);
	if (!canManageCollection(user, existing)) return c.json({ error: "Permisos insuficientes" }, 403);

	const body = await c.req.json();
	const validation = validateCollection({ ...existing, ...body });
	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	await repo.updateCollection(getDb().db, id, {
		title: body.title,
		description: body.description,
		editorialStatus: body.editorialStatus,
		isOrdered: typeof body.isOrdered === "boolean" ? (body.isOrdered ? 1 : 0) : undefined,
	});
	return c.json({ id, updated: true });
});

adminRoutes.delete("/collections/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "author")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const existing = await repo.getCollectionById(getDb().db, id);
	if (!existing) return c.json({ error: "Colección no encontrada" }, 404);
	if (!canManageCollection(user, existing)) return c.json({ error: "Permisos insuficientes" }, 403);

	await repo.deleteCollection(getDb().db, id);
	return c.json({ id, deleted: true });
});

adminRoutes.get("/taxonomies", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "curator")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const limit = Number(c.req.query("limit") ?? "20");
	const offset = Number(c.req.query("offset") ?? "0");
	const search = c.req.query("q") ?? undefined;
	const type = c.req.query("type") ?? undefined;

	return c.json(await repo.listTaxonomies(getDb().db, { limit, offset, search, type }));
});

adminRoutes.get("/taxonomies/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "curator")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const found = await repo.getTaxonomyById(getDb().db, id);
	if (!found) return c.json({ error: "Categoría no encontrada" }, 404);
	return c.json(found);
});

adminRoutes.post("/taxonomies", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "admin")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const body = await c.req.json();
	const validation = validateTaxonomy(body);
	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	const result = await repo.createTaxonomy(getDb().db, {
		name: body.name,
		slug: body.slug,
		type: body.type,
		parentId: body.parentId,
	});
	return c.json(result, 201);
});

adminRoutes.patch("/taxonomies/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "admin")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const existing = await repo.getTaxonomyById(getDb().db, id);
	if (!existing) return c.json({ error: "Categoría no encontrada" }, 404);

	const body = await c.req.json();
	const validation = validateTaxonomy({ ...existing, ...body });
	if (!validation.valid) {
		return c.json({ error: "Validación fallida", details: validation.errors }, 400);
	}

	await repo.updateTaxonomy(getDb().db, id, {
		name: body.name,
		slug: body.slug,
		type: body.type,
		parentId: body.parentId,
	});
	return c.json({ id, updated: true });
});

adminRoutes.delete("/taxonomies/:id", async (c) => {
	const user = getCurrentUser(c);
	if (!hasMinRole(user.role, "admin")) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const { id } = c.req.param();
	const existing = await repo.getTaxonomyById(getDb().db, id);
	if (!existing) return c.json({ error: "Categoría no encontrada" }, 404);

	await repo.deleteTaxonomy(getDb().db, id);
	return c.json({ id, deleted: true });
});

export { adminRoutes };
