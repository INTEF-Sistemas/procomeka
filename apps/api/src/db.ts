/**
 * Instancia Drizzle compartida.
 * PGlite en dev (sin DATABASE_URL), PostgreSQL en prod (con DATABASE_URL).
 * En PGlite, crea las tablas automáticamente si no existen.
 */

// Cargar .env desde la raíz del monorepo (bun --filter ejecuta desde apps/api/)
const rootEnvPath = `${import.meta.dir}/../../../.env`;
const rootEnv = Bun.file(rootEnvPath);
if (await rootEnv.exists()) {
	const text = await rootEnv.text();
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		const key = trimmed.slice(0, eqIdx).trim();
		const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
		if (!process.env[key]) process.env[key] = val;
	}
}

import * as pgSchema from "@procomeka/db/schema";

let _db: ReturnType<typeof createDb> | null = null;
let _initPromise: Promise<void> | null = null;

function createDb() {
	if (process.env.DATABASE_URL) {
		const { drizzle } = require("drizzle-orm/bun-sql");
		return { db: drizzle(process.env.DATABASE_URL, { schema: pgSchema }), provider: "pg" as const };
	}

	const { PGlite } = require("@electric-sql/pglite");
	const { drizzle } = require("drizzle-orm/pglite");
	const dataDir = process.env.PGLITE_DIR ?? `${import.meta.dir}/../../../local-data`;
	const pglite = new PGlite(dataDir);

	_initPromise = (async () => {
		const { createTables } = await import("@procomeka/db/setup");
		await createTables(pglite);
	})();

	return { db: drizzle(pglite, { schema: pgSchema }), provider: "pg" as const };
}

export function getDb() {
	if (!_db) _db = createDb();
	return _db;
}

export async function waitForDb() {
	getDb();
	if (_initPromise) await _initPromise;
}
