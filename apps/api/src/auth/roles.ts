import type { Context } from "hono";
import type { AuthEnv } from "./middleware.ts";
import { ROLE_LEVELS } from "@procomeka/db/validation";

export function getCurrentUser(c: Context<AuthEnv>) {
	return c.get("user") as { id: string; role?: string; name?: string; email?: string };
}

export function hasMinRole(role: string | undefined, minRole: keyof typeof ROLE_LEVELS) {
	return (ROLE_LEVELS[role ?? "reader"] ?? 0) >= ROLE_LEVELS[minRole];
}

export function canManageResource(
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

export function canManageCollection(
	user: { id: string; role?: string },
	collection: { curatorId?: string | null },
) {
	if (hasMinRole(user.role, "admin")) return true;
	if (hasMinRole(user.role, "author")) {
		return collection.curatorId === user.id;
	}
	return false;
}
