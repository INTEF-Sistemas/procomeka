import { Database } from "bun:sqlite";
import { hashPassword } from "better-auth/crypto";

const DEV_USERS = [
	{
		email: "admin@example.com",
		name: "Admin",
		role: "admin",
		password: "password",
	},
	{
		email: "curator@example.com",
		name: "Curator",
		role: "curator",
		password: "password",
	},
	{
		email: "author@example.com",
		name: "Author",
		role: "author",
		password: "password",
	},
	{
		email: "reader@example.com",
		name: "Reader",
		role: "reader",
		password: "password",
	},
];

export async function seed() {
	if (process.env.DATABASE_URL) {
		console.error("Seed solo disponible en modo SQLite (desarrollo local).");
		console.error("No definas DATABASE_URL para usar SQLite.");
		process.exit(1);
	}

	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../../local.db`;
	const db = new Database(dbPath, { create: true });

	// Crear tablas con INTEGER para timestamps (compatible con Drizzle mode:timestamp)
	db.run(`CREATE TABLE IF NOT EXISTS "user" (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		email_verified INTEGER NOT NULL DEFAULT 0,
		name TEXT,
		image TEXT,
		role TEXT NOT NULL DEFAULT 'reader',
		is_active INTEGER NOT NULL DEFAULT 1,
		banned INTEGER DEFAULT 0,
		ban_reason TEXT,
		ban_expires INTEGER,
		created_at INTEGER,
		updated_at INTEGER,
		last_login_at INTEGER
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS "session" (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL,
		token TEXT NOT NULL UNIQUE,
		ip_address TEXT,
		user_agent TEXT,
		created_at INTEGER,
		updated_at INTEGER
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS "account" (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		account_id TEXT NOT NULL,
		provider_id TEXT NOT NULL,
		access_token TEXT,
		refresh_token TEXT,
		access_token_expires_at INTEGER,
		refresh_token_expires_at INTEGER,
		scope TEXT,
		id_token TEXT,
		password TEXT,
		created_at INTEGER,
		updated_at INTEGER
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS "verification" (
		id TEXT PRIMARY KEY,
		identifier TEXT NOT NULL,
		value TEXT NOT NULL,
		expires_at INTEGER NOT NULL,
		created_at INTEGER,
		updated_at INTEGER
	)`);

	console.log("Creando usuarios de desarrollo...\n");

	const now = Math.floor(Date.now() / 1000);
	const insertUser = db.prepare(
		`INSERT OR IGNORE INTO "user" (id, email, email_verified, name, role, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?, 1, ?, ?)`,
	);
	const insertAccount = db.prepare(
		`INSERT OR IGNORE INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES (?, ?, ?, 'credential', ?, ?, ?)`,
	);

	for (const u of DEV_USERS) {
		const userId = crypto.randomUUID();
		const accountId = crypto.randomUUID();
		const passwordHash = await hashPassword(u.password);

		const result = insertUser.run(userId, u.email, u.name, u.role, now, now);
		if (result.changes > 0) {
			insertAccount.run(accountId, userId, userId, passwordHash, now, now);
			console.log(`  + ${u.email} [${u.role}]`);
		} else {
			console.log(`  - ${u.email} ya existe, saltando`);
		}
	}

	db.close();
	console.log(`\nSeed completado. Base de datos: ${dbPath}`);
}
