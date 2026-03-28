/**
 * Preload para tests: fuerza PGlite en memoria para no contaminar
 * la base de datos de desarrollo (local-data/).
 */
process.env.PGLITE_DIR = "memory://";

import { waitForDb, getDb } from "./db.ts";

await waitForDb();

// Crear usuarios de test que los tests referencian como mock users
const { db } = getDb();
const { user } = await import("@procomeka/db/schema");

const testUsers = [
	{ id: "1", email: "test-admin@test.com", name: "Test Admin", role: "admin" },
	{ id: "system", email: "system@test.com", name: "System", role: "admin" },
];

for (const u of testUsers) {
	try {
		await db.insert(user).values({
			id: u.id,
			email: u.email,
			emailVerified: true,
			name: u.name,
			role: u.role,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	} catch {
		// Already exists — ignore
	}
}
