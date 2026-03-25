import { Database } from "bun:sqlite";

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

	// Crear tablas si no existen (estructura compatible con Better Auth)
	db.run(`CREATE TABLE IF NOT EXISTS "user" (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		email_verified INTEGER NOT NULL DEFAULT 0,
		name TEXT NOT NULL,
		image TEXT,
		role TEXT NOT NULL DEFAULT 'reader',
		is_active INTEGER NOT NULL DEFAULT 1,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now')),
		last_login_at TEXT
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS "session" (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		expires_at TEXT NOT NULL,
		token TEXT NOT NULL UNIQUE,
		ip_address TEXT,
		user_agent TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS "account" (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		account_id TEXT NOT NULL,
		provider_id TEXT NOT NULL,
		access_token TEXT,
		refresh_token TEXT,
		access_token_expires_at TEXT,
		refresh_token_expires_at TEXT,
		scope TEXT,
		password TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`);

	db.run(`CREATE TABLE IF NOT EXISTS "verification" (
		id TEXT PRIMARY KEY,
		identifier TEXT NOT NULL,
		value TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`);

	console.log("Creando usuarios de desarrollo...\n");

	const insertUser = db.prepare(
		`INSERT OR IGNORE INTO "user" (id, email, email_verified, name, role, is_active) VALUES (?, ?, 1, ?, ?, 1)`,
	);
	const insertAccount = db.prepare(
		`INSERT OR IGNORE INTO "account" (id, user_id, account_id, provider_id, password) VALUES (?, ?, ?, 'credential', ?)`,
	);

	for (const u of DEV_USERS) {
		const userId = crypto.randomUUID();
		const accountId = crypto.randomUUID();
		const passwordHash = await Bun.password.hash(u.password, {
			algorithm: "argon2id",
		});

		const result = insertUser.run(userId, u.email, u.name, u.role);
		if (result.changes > 0) {
			insertAccount.run(accountId, userId, userId, passwordHash);
			console.log(`  + ${u.email} [${u.role}] — contraseña: ${u.password}`);
		} else {
			console.log(`  - ${u.email} ya existe, saltando`);
		}
	}

	db.close();
	console.log(`\nSeed completado. Base de datos: ${dbPath}`);
}
