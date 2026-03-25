import { Database } from "bun:sqlite";
import { hashPassword } from "better-auth/crypto";

const DEV_USERS = [
	{ email: "admin@example.com", name: "Admin", role: "admin", password: "password" },
	{ email: "curator@example.com", name: "Curator", role: "curator", password: "password" },
	{ email: "author@example.com", name: "Author", role: "author", password: "password" },
	{ email: "reader@example.com", name: "Reader", role: "reader", password: "password" },
];

const DEV_RESOURCES = [
	{
		id: "res-1",
		slug: "introduccion-programacion-scratch",
		title: "Introducción a la programación con Scratch",
		description: "Guía didáctica para iniciar al alumnado de primaria en el pensamiento computacional mediante Scratch.",
		language: "es",
		license: "cc-by-sa",
		resourceType: "secuencia-didactica",
		keywords: "scratch,programación,pensamiento computacional",
		author: "María García López",
		editorialStatus: "validado",
		subjects: ["informatica", "matematicas"],
		levels: ["educacion-primaria"],
	},
	{
		id: "res-2",
		slug: "cambio-climatico-secundaria",
		title: "El cambio climático: causas y consecuencias",
		description: "Unidad didáctica sobre cambio climático para ESO con actividades interactivas y evaluación.",
		language: "es",
		license: "cc-by",
		resourceType: "actividad-interactiva",
		keywords: "cambio climático,medio ambiente,sostenibilidad",
		author: "Carlos Ruiz Martín",
		editorialStatus: "destacado",
		subjects: ["ciencias-naturales", "geografia"],
		levels: ["educacion-secundaria-obligatoria"],
	},
	{
		id: "res-3",
		slug: "fracciones-visuales",
		title: "Fracciones visuales: aprende jugando",
		description: "Colección de ejercicios interactivos para comprender fracciones de forma visual.",
		language: "es",
		license: "cc-by-nc-sa",
		resourceType: "ejercicio",
		keywords: "fracciones,matemáticas,visual",
		author: "Ana Fernández Díaz",
		editorialStatus: "validado",
		subjects: ["matematicas"],
		levels: ["educacion-primaria", "educacion-secundaria-obligatoria"],
	},
	{
		id: "res-4",
		slug: "shakespeare-teatro-aula",
		title: "Shakespeare en el aula: teatro y literatura",
		description: "Propuesta didáctica para trabajar obras de Shakespeare mediante representación teatral.",
		language: "es",
		license: "cc-by-sa",
		resourceType: "proyecto",
		keywords: "shakespeare,teatro,literatura,inglés",
		author: "Pedro Sánchez Vega",
		editorialStatus: "borrador",
		subjects: ["lengua-extranjera", "literatura"],
		levels: ["bachillerato"],
	},
	{
		id: "res-5",
		slug: "seguridad-internet-menores",
		title: "Seguridad en internet para menores",
		description: "Vídeo educativo sobre navegación segura, privacidad y ciberacoso dirigido a familias y docentes.",
		language: "es",
		license: "cc-by",
		resourceType: "video",
		keywords: "seguridad,internet,ciberacoso,privacidad",
		author: "Instituto Nacional de Ciberseguridad",
		publisher: "INCIBE",
		editorialStatus: "destacado",
		subjects: ["informatica", "educacion-civica"],
		levels: ["educacion-primaria", "educacion-secundaria-obligatoria"],
	},
];

function createAuthTables(db: Database) {
	db.run(`CREATE TABLE IF NOT EXISTS "user" (
		id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0,
		name TEXT, image TEXT, role TEXT NOT NULL DEFAULT 'reader', is_active INTEGER NOT NULL DEFAULT 1,
		banned INTEGER DEFAULT 0, ban_reason TEXT, ban_expires INTEGER,
		created_at INTEGER, updated_at INTEGER, last_login_at INTEGER
	)`);
	db.run(`CREATE TABLE IF NOT EXISTS "session" (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT,
		created_at INTEGER, updated_at INTEGER
	)`);
	db.run(`CREATE TABLE IF NOT EXISTS "account" (
		id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
		account_id TEXT NOT NULL, provider_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT,
		access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, id_token TEXT,
		password TEXT, created_at INTEGER, updated_at INTEGER
	)`);
	db.run(`CREATE TABLE IF NOT EXISTS "verification" (
		id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL,
		expires_at INTEGER NOT NULL, created_at INTEGER, updated_at INTEGER
	)`);
}

function createResourceTables(db: Database) {
	db.run(`CREATE TABLE IF NOT EXISTS "resources" (
		id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, external_id TEXT, source_uri TEXT,
		title TEXT NOT NULL, description TEXT NOT NULL, language TEXT NOT NULL,
		license TEXT NOT NULL, resource_type TEXT NOT NULL, keywords TEXT,
		author TEXT, publisher TEXT, duration INTEGER,
		accessibility_features TEXT, accessibility_hazards TEXT, access_mode TEXT,
		editorial_status TEXT NOT NULL DEFAULT 'borrador',
		assigned_curator_id TEXT REFERENCES "user"(id),
		curated_at INTEGER, featured_at INTEGER,
		imported_at INTEGER, import_source TEXT,
		created_at INTEGER, updated_at INTEGER
	)`);
	db.run(`CREATE TABLE IF NOT EXISTS "media_items" (
		id TEXT PRIMARY KEY, resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
		type TEXT NOT NULL, mime_type TEXT, url TEXT NOT NULL,
		file_size INTEGER, filename TEXT, is_primary INTEGER NOT NULL DEFAULT 0
	)`);
	db.run(`CREATE TABLE IF NOT EXISTS "resource_subjects" (
		resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
		subject TEXT NOT NULL
	)`);
	db.run(`CREATE TABLE IF NOT EXISTS "resource_levels" (
		resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
		level TEXT NOT NULL
	)`);
}

export async function seed() {
	if (process.env.DATABASE_URL) {
		console.error("Seed solo disponible en modo SQLite (desarrollo local).");
		process.exit(1);
	}

	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../../local.db`;
	const db = new Database(dbPath, { create: true });

	createAuthTables(db);
	createResourceTables(db);

	const now = Math.floor(Date.now() / 1000);

	// --- Usuarios ---
	console.log("Usuarios de desarrollo:\n");
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
			console.log(`  - ${u.email} ya existe`);
		}
	}

	// --- Recursos ---
	console.log("\nRecursos de ejemplo:\n");
	const insertResource = db.prepare(
		`INSERT OR IGNORE INTO "resources" (id, slug, title, description, language, license, resource_type, keywords, author, publisher, editorial_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	);
	const insertSubject = db.prepare(
		`INSERT OR IGNORE INTO "resource_subjects" (resource_id, subject) VALUES (?, ?)`,
	);
	const insertLevel = db.prepare(
		`INSERT OR IGNORE INTO "resource_levels" (resource_id, level) VALUES (?, ?)`,
	);

	for (const r of DEV_RESOURCES) {
		const result = insertResource.run(
			r.id, r.slug, r.title, r.description, r.language, r.license,
			r.resourceType, r.keywords ?? null, r.author ?? null, r.publisher ?? null,
			r.editorialStatus, now, now,
		);
		if (result.changes > 0) {
			for (const s of r.subjects) insertSubject.run(r.id, s);
			for (const l of r.levels) insertLevel.run(r.id, l);
			console.log(`  + ${r.slug} [${r.editorialStatus}]`);
		} else {
			console.log(`  - ${r.slug} ya existe`);
		}
	}

	db.close();
	console.log(`\nSeed completado. Base de datos: ${dbPath}`);
}
