import { Hono } from "hono";
import type { Context } from "hono";
import { type AuthEnv, requireRole } from "../auth/middleware.ts";
import { getCurrentUser } from "../auth/roles.ts";
import { parsePagination } from "../helpers.ts";
import { getDb } from "../db.ts";
import type { ValidationResult } from "@procomeka/db/validation";

type DbFn = ReturnType<typeof getDb>["db"];
type User = { id: string; role?: string; name?: string; email?: string };

export interface CrudRouteConfig<TEntity> {
	baseRole: string;

	list: (db: DbFn, opts: Record<string, unknown>) => Promise<unknown>;
	getById: (db: DbFn, id: string) => Promise<TEntity | null>;
	create?: (db: DbFn, data: Record<string, unknown>) => Promise<unknown>;
	update?: (db: DbFn, id: string, data: Record<string, unknown>) => Promise<void>;
	remove?: (db: DbFn, id: string) => Promise<void>;

	validateCreate?: (body: unknown) => ValidationResult;
	validateUpdate?: (body: unknown) => ValidationResult;
	mergeOnUpdate?: boolean;

	canManage?: (user: User, entity: TEntity) => boolean;

	listFilters?: (user: User, params: Record<string, string | undefined>) => Record<string, unknown>;
	prepareCreate?: (body: Record<string, unknown>, user: User) => Record<string, unknown> | Promise<Record<string, unknown>>;

	roles?: { create?: string; update?: string; remove?: string };
	notFoundMessage?: string;
}

export function buildCrudRoutes<TEntity>(config: CrudRouteConfig<TEntity>): Hono<AuthEnv> {
	const routes = new Hono<AuthEnv>();
	const db = () => getDb().db;
	const notFound = config.notFoundMessage ?? "No encontrado";

	routes.use("*", requireRole(config.baseRole));

	// GET / — list
	routes.get("/", async (c) => {
		const user = getCurrentUser(c);
		const { limit, offset, search } = parsePagination(c);
		const params: Record<string, string | undefined> = {};
		for (const [k, v] of new URL(c.req.url).searchParams) {
			params[k] = v;
		}
		const filters = config.listFilters?.(user, params) ?? {};
		return c.json(await config.list(db(), { limit, offset, search, ...filters }));
	});

	// GET /:id — detail
	routes.get("/:id", async (c) => {
		const user = getCurrentUser(c);
		const { id } = c.req.param();
		const entity = await config.getById(db(), id);
		if (!entity) return c.json({ error: notFound }, 404);
		if (config.canManage && !config.canManage(user, entity)) {
			return c.json({ error: "Permisos insuficientes" }, 403);
		}
		return c.json(entity);
	});

	// POST / — create
	if (config.create) {
		const handler = async (c: Context<AuthEnv>) => {
			const user = getCurrentUser(c);
			const body = await c.req.json();
			if (config.validateCreate) {
				const v = config.validateCreate(body);
				if (!v.valid) return c.json({ error: "Validación fallida", details: v.errors }, 400);
			}
			const data = config.prepareCreate ? await config.prepareCreate(body, user) : body;
			const result = await config.create!(db(), data);
			return c.json(result, 201);
		};
		if (config.roles?.create) {
			routes.post("/", requireRole(config.roles.create), handler);
		} else {
			routes.post("/", handler);
		}
	}

	// PATCH /:id — update
	if (config.update) {
		const handler = async (c: Context<AuthEnv>) => {
			const user = getCurrentUser(c);
			const { id } = c.req.param();
			const entity = await config.getById(db(), id);
			if (!entity) return c.json({ error: notFound }, 404);
			if (config.canManage && !config.canManage(user, entity)) {
				return c.json({ error: "Permisos insuficientes" }, 403);
			}
			const body = await c.req.json();
			if (config.validateUpdate) {
				const toValidate = config.mergeOnUpdate ? { ...(entity as Record<string, unknown>), ...body } : body;
				const v = config.validateUpdate(toValidate);
				if (!v.valid) return c.json({ error: "Validación fallida", details: v.errors }, 400);
			}
			await config.update!(db(), id, body);
			return c.json({ id, updated: true });
		};
		if (config.roles?.update) {
			routes.patch("/:id", requireRole(config.roles.update), handler);
		} else {
			routes.patch("/:id", handler);
		}
	}

	// DELETE /:id — remove
	if (config.remove) {
		const handler = async (c: Context<AuthEnv>) => {
			const user = getCurrentUser(c);
			const { id } = c.req.param();
			const entity = await config.getById(db(), id);
			if (!entity) return c.json({ error: notFound }, 404);
			if (config.canManage && !config.canManage(user, entity)) {
				return c.json({ error: "Permisos insuficientes" }, 403);
			}
			await config.remove!(db(), id);
			return c.json({ id, deleted: true });
		};
		if (config.roles?.remove) {
			routes.delete("/:id", requireRole(config.roles.remove), handler);
		} else {
			routes.delete("/:id", handler);
		}
	}

	return routes;
}
