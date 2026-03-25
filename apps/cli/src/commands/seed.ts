import { hashPassword } from "better-auth/crypto";
import { DEV_USERS, DEV_RESOURCES } from "@procomeka/db/seed-data";

export async function seed() {
	const { PGlite } = await import("@electric-sql/pglite");
	const { createTables } = await import("@procomeka/db/setup");

	const dataDir = process.env.PGLITE_DIR ?? `${import.meta.dir}/../../../../local-data`;
	const pglite = new PGlite(dataDir);
	await createTables(pglite);

	const now = new Date().toISOString();

	// --- Usuarios ---
	console.log("Usuarios de desarrollo:\n");
	for (const u of DEV_USERS) {
		const userId = crypto.randomUUID();
		const accountId = crypto.randomUUID();
		const passwordHash = await hashPassword(u.password);

		const existing = await pglite.query(`SELECT id FROM "user" WHERE email = $1`, [u.email]);
		if (existing.rows.length > 0) {
			console.log(`  - ${u.email} ya existe`);
			continue;
		}

		await pglite.query(
			`INSERT INTO "user" (id, email, email_verified, name, role, is_active, created_at, updated_at) VALUES ($1, $2, true, $3, $4, true, $5, $6)`,
			[userId, u.email, u.name, u.role, now, now],
		);
		await pglite.query(
			`INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES ($1, $2, $3, 'credential', $4, $5, $6)`,
			[accountId, userId, userId, passwordHash, now, now],
		);
		console.log(`  + ${u.email} [${u.role}]`);
	}

	// --- Recursos ---
	console.log("\nRecursos de ejemplo:\n");
	for (const r of DEV_RESOURCES) {
		const existing = await pglite.query(`SELECT id FROM "resources" WHERE id = $1`, [r.id]);
		if (existing.rows.length > 0) {
			console.log(`  - ${r.slug} ya existe`);
			continue;
		}

		await pglite.query(
			`INSERT INTO "resources" (id, slug, title, description, language, license, resource_type, keywords, author, publisher, editorial_status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
			[r.id, r.slug, r.title, r.description, r.language, r.license, r.resourceType, r.keywords ?? null, r.author ?? null, r.publisher ?? null, r.editorialStatus, now, now],
		);

		for (const s of r.subjects) {
			await pglite.query(`INSERT INTO "resource_subjects" (resource_id, subject) VALUES ($1, $2)`, [r.id, s]);
		}
		for (const l of r.levels) {
			await pglite.query(`INSERT INTO "resource_levels" (resource_id, level) VALUES ($1, $2)`, [r.id, l]);
		}

		console.log(`  + ${r.slug} [${r.editorialStatus}]`);
	}

	await pglite.close();
	console.log(`\nSeed completado. Directorio PGlite: ${dataDir}`);
}
