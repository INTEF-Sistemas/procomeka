import { Hono } from "hono";
import type { AuthEnv } from "../../auth/middleware.ts";
import { getCurrentUser, hasMinRole } from "../../auth/roles.ts";
import { parsePagination } from "../../helpers.ts";
import { ROLE_LEVELS } from "@procomeka/db/validation";
import { getDb } from "../../db.ts";
import * as repo from "@procomeka/db/repository";

const userRoutes = new Hono<AuthEnv>();

userRoutes.get("/", async (c) => {
	const user = getCurrentUser(c);
	const { limit, offset, search } = parsePagination(c);
	const role = c.req.query("role") ?? undefined;

	if (hasMinRole(user.role, "admin")) {
		return c.json(await repo.listUsers(getDb().db, { limit, offset, search, role }));
	}

	const ownUsers = await repo.listUsers(getDb().db, { limit, offset, id: user.id });
	if (ownUsers.total > 0) return c.json(ownUsers);

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

userRoutes.get("/:id", async (c) => {
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
	if (!found) return c.json({ error: "Usuario no encontrado" }, 404);
	return c.json(found);
});

userRoutes.patch("/:id", async (c) => {
	const currentUser = getCurrentUser(c);
	const { id } = c.req.param();
	if (!hasMinRole(currentUser.role, "admin") && currentUser.id !== id) {
		return c.json({ error: "Permisos insuficientes" }, 403);
	}

	const existing = await repo.getUserById(getDb().db, id);
	if (!existing) return c.json({ error: "Usuario no encontrado" }, 404);

	const body = await c.req.json();
	const updates: { name?: string | null; role?: string; isActive?: boolean } = {};
	if ("name" in body) updates.name = typeof body.name === "string" ? body.name : null;
	if (hasMinRole(currentUser.role, "admin")) {
		if (typeof body.role === "string" && body.role in ROLE_LEVELS) updates.role = body.role;
		if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
	}

	await repo.updateUser(getDb().db, id, updates);
	return c.json({ id, updated: true });
});

export { userRoutes };
