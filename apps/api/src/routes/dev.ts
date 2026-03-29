import { Hono } from "hono";
import path from "node:path";
import { type AuthEnv, requireAuth, requireRole } from "../auth/middleware.ts";
import { getDb } from "../db.ts";
import { seedRandomResources } from "@procomeka/db/seed-random";
import { isDevelopmentMode } from "../env.ts";
import { getUploadConfig } from "../uploads/config.ts";
import { processElpxUpload } from "../services/elpx-processor.ts";

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
		// Gather .elpx fixtures from test-fixtures directory
		const fixturesDir = path.join(import.meta.dir, "../test-fixtures/elpx");
		let elpxFixtures: string[] = [];
		try {
			const { readdir } = await import("node:fs/promises");
			const files = await readdir(fixturesDir);
			elpxFixtures = files
				.filter((f: string) => f.endsWith(".elpx"))
				.map((f: string) => path.join(fixturesDir, f));
		} catch {
			// No fixtures directory — skip elpx seeding
		}

		const config = getUploadConfig();
		const result = await seedRandomResources(getDb().db, count, {
			clean,
			elpx: elpxFixtures.length > 0
				? { fixtures: elpxFixtures, storageDir: config.storageDir, processElpx: processElpxUpload }
				: undefined,
		});
		return c.json(result);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return c.json({ error: message }, 500);
	}
});

export { devRoutes };
