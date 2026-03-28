import { Hono } from "hono";
import { type AuthEnv, requireAuth, requireRole } from "../auth/middleware.ts";
import { getDb } from "../db.ts";
import { seedRandomResources } from "@procomeka/db/seed-random";
import { isDevelopmentMode } from "../env.ts";

const devRoutes = new Hono<AuthEnv>();

// Solo habilitar en ejecuciones de desarrollo reales del API.
devRoutes.use("*", async (c, next) => {
	if (!isDevelopmentMode()) {
		return c.json({ error: "Solo disponible en modo desarrollo" }, 403);
	}
	await next();
});

devRoutes.use("*", requireAuth);
devRoutes.use("*", requireRole("admin"));

devRoutes.post("/seed-resources", async (c) => {
	const body = await c.req.json();
	const count = Number(body.count ?? 10);
	const clean = body.clean === true;

	const allowedCounts = [10, 100, 1000, 10000];
	if (!allowedCounts.includes(count)) {
		return c.json(
			{
				error: `Cantidad no permitida. Valores permitidos: ${allowedCounts.join(", ")}`,
			},
			400,
		);
	}

	try {
		const result = await seedRandomResources(getDb().db, count, { clean });
		return c.json(result);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return c.json({ error: message }, 500);
	}
});

export { devRoutes };
