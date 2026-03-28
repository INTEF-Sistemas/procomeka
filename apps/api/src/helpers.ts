import type { Context } from "hono";
import { getDb } from "./db.ts";
import * as repo from "@procomeka/db/repository";

export function parsePagination(c: Context) {
	const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "20") || 20, 1), 100);
	const offset = Math.max(Number(c.req.query("offset") ?? "0") || 0, 0);
	const search = c.req.query("q") ?? undefined;
	return { limit, offset, search };
}

export async function ensureCurrentUser(user: { id: string; role?: string; name?: string; email?: string }) {
	await repo.ensureUser(getDb().db, {
		id: user.id,
		email: user.email ?? `${user.id}@local.invalid`,
		name: user.name ?? null,
		role: user.role ?? "reader",
	});
}
