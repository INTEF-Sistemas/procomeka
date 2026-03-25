/**
 * Instancia Drizzle compartida.
 * SQLite en dev (sin DATABASE_URL), PostgreSQL en prod (con DATABASE_URL).
 * En SQLite, crea las tablas automáticamente si no existen.
 */

let _db: ReturnType<typeof createDb> | null = null;

function createSqliteTables(sqlite: { run: (sql: string) => void }) {
	sqlite.run(`CREATE TABLE IF NOT EXISTS "user" (
		id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0,
		name TEXT, image TEXT, role TEXT NOT NULL DEFAULT 'reader', is_active INTEGER NOT NULL DEFAULT 1,
		banned INTEGER DEFAULT 0, ban_reason TEXT, ban_expires INTEGER,
		created_at INTEGER, updated_at INTEGER, last_login_at INTEGER
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "session" (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT,
		created_at INTEGER, updated_at INTEGER
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "account" (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		account_id TEXT NOT NULL, provider_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT,
		access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, id_token TEXT,
		password TEXT, created_at INTEGER, updated_at INTEGER
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "verification" (
		id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL,
		expires_at INTEGER NOT NULL, created_at INTEGER, updated_at INTEGER
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "resources" (
		id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, external_id TEXT, source_uri TEXT,
		title TEXT NOT NULL, description TEXT NOT NULL, language TEXT NOT NULL,
		license TEXT NOT NULL, resource_type TEXT NOT NULL, keywords TEXT,
		author TEXT, publisher TEXT, duration INTEGER,
		accessibility_features TEXT, accessibility_hazards TEXT, access_mode TEXT,
		editorial_status TEXT NOT NULL DEFAULT 'draft',
		assigned_curator_id TEXT REFERENCES "user"(id),
		curated_at INTEGER, featured_at INTEGER, imported_at INTEGER, import_source TEXT,
		deleted_at INTEGER,
		created_at INTEGER, updated_at INTEGER
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "media_items" (
		id TEXT PRIMARY KEY, resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
		type TEXT NOT NULL, mime_type TEXT, url TEXT NOT NULL,
		file_size INTEGER, filename TEXT, is_primary INTEGER NOT NULL DEFAULT 0
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "resource_subjects" (
		resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE, subject TEXT NOT NULL
	)`);
	sqlite.run(`CREATE TABLE IF NOT EXISTS "resource_levels" (
		resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE, level TEXT NOT NULL
	)`);
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug)`);
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(editorial_status)`);
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type)`);
}

function createDb() {
	if (process.env.DATABASE_URL) {
		const { drizzle } = require("drizzle-orm/bun-sql");
		const pgSchema = require("@procomeka/db/schema");
		return { db: drizzle(process.env.DATABASE_URL, { schema: pgSchema }), provider: "pg" as const };
	}

	const { drizzle } = require("drizzle-orm/bun-sqlite");
	const { Database } = require("bun:sqlite");
	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../local.db`;
	const sqlite = new Database(dbPath, { create: true });
	createSqliteTables(sqlite);
	const sqliteSchema = {
		...require("../../../packages/db/src/schema/auth-sqlite.ts"),
		...require("../../../packages/db/src/schema/resources-sqlite.ts"),
	};
	return { db: drizzle(sqlite, { schema: sqliteSchema }), provider: "sqlite" as const };
}

export function getDb() {
	if (!_db) _db = createDb();
	return _db;
}
