import { hashPassword } from "better-auth/crypto";
import { DEV_USERS, DEV_RESOURCES } from "@procomeka/db/seed-data";

type SeedLog = Pick<typeof console, "log">;
type SeedQueryResult = { rows?: unknown[] } | unknown[];
type SeedClient = {
	query: (statement: string, params?: unknown[]) => Promise<SeedQueryResult>;
	close: () => Promise<void>;
};

export function resolveSeedMode(env: Record<string, string | undefined> = process.env) {
	return env.DATABASE_URL ? "postgres" : "pglite";
}

function getResultLength(result: SeedQueryResult) {
	return Array.isArray(result) ? result.length : result.rows?.length ?? 0;
}

export function formatPostgresSeedTarget(databaseUrl: string) {
	const url = new URL(databaseUrl);
	const databaseName = url.pathname.replace(/^\//, "") || "(default)";
	return `Base PostgreSQL: ${url.hostname}:${url.port || "5432"}/${databaseName}`;
}

export async function seedWithClient(
	client: SeedClient,
	options: { now?: string; log?: SeedLog; successTarget: string },
) {
	const now = options.now ?? new Date().toISOString();
	const log = options.log ?? console;

	try {
		log.log("Usuarios de desarrollo:\n");
		for (const u of DEV_USERS) {
			const userId = crypto.randomUUID();
			const accountId = crypto.randomUUID();
			const passwordHash = await hashPassword(u.password);

			const existing = await client.query(`SELECT id FROM "user" WHERE email = $1`, [u.email]);
			if (getResultLength(existing) > 0) {
				log.log(`  - ${u.email} ya existe`);
				continue;
			}

			await client.query(
				`INSERT INTO "user" (id, email, email_verified, name, role, is_active, created_at, updated_at) VALUES ($1, $2, true, $3, $4, true, $5, $6)`,
				[userId, u.email, u.name, u.role, now, now],
			);
			await client.query(
				`INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES ($1, $2, $3, 'credential', $4, $5, $6)`,
				[accountId, userId, userId, passwordHash, now, now],
			);
			log.log(`  + ${u.email} [${u.role}]`);
		}

		log.log("\nRecursos de ejemplo:\n");
		for (const r of DEV_RESOURCES) {
			const existing = await client.query(`SELECT id FROM "resources" WHERE id = $1`, [r.id]);
			if (getResultLength(existing) > 0) {
				log.log(`  - ${r.slug} ya existe`);
				continue;
			}

			await client.query(
				`INSERT INTO "resources" (id, slug, title, description, language, license, resource_type, keywords, author, publisher, editorial_status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
				[r.id, r.slug, r.title, r.description, r.language, r.license, r.resourceType, r.keywords ?? null, r.author ?? null, r.publisher ?? null, r.editorialStatus, now, now],
			);

			for (const s of r.subjects) {
				await client.query(`INSERT INTO "resource_subjects" (resource_id, subject) VALUES ($1, $2)`, [r.id, s]);
			}
			for (const l of r.levels) {
				await client.query(`INSERT INTO "resource_levels" (resource_id, level) VALUES ($1, $2)`, [r.id, l]);
			}

			log.log(`  + ${r.slug} [${r.editorialStatus}]`);
		}
	} finally {
		await client.close();
	}

	log.log(`\nSeed completado. ${options.successTarget}`);
}

export async function seed() {
	if (resolveSeedMode() === "postgres") {
		await seedPostgres(process.env.DATABASE_URL!);
		return;
	}

	const { PGlite } = await import("@electric-sql/pglite");
	const { createTables } = await import("@procomeka/db/setup");

	const dataDir = process.env.PGLITE_DIR ?? `${import.meta.dir}/../../../../local-data`;
	const pglite = new PGlite(dataDir);
	await createTables(pglite);

	await seedWithClient(
		{
			query: (statement, params) => pglite.query(statement, params),
			close: () => pglite.close(),
		},
		{ successTarget: `Directorio PGlite: ${dataDir}` },
	);
}

async function seedPostgres(databaseUrl: string) {
	const postgres = (await import("postgres")).default;
	const { SCHEMA_STATEMENTS } = await import("@procomeka/db/setup");
	const sql = postgres(databaseUrl);
	const now = new Date().toISOString();

	for (const statement of SCHEMA_STATEMENTS) {
		await sql.unsafe(statement);
	}

	await seedWithClient(
		{
			query: (statement, params) => sql.unsafe(statement, params),
			close: () => sql.end(),
		},
		{ now, successTarget: formatPostgresSeedTarget(databaseUrl) },
	);
}
