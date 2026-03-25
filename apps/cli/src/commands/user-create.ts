import { parseArgs } from "node:util";
import { hashPassword } from "better-auth/crypto";

const VALID_ROLES = ["admin", "curator", "author", "reader"];

export async function userCreate(args: string[]) {
	const { values } = parseArgs({
		args,
		options: {
			email: { type: "string" },
			name: { type: "string" },
			password: { type: "string" },
			role: { type: "string", default: "reader" },
		},
		strict: true,
	});

	if (!values.email || !values.name || !values.password) {
		console.error(
			"Uso: user:create --email <email> --name <nombre> --role <rol> --password <contraseña>",
		);
		console.error(`Roles válidos: ${VALID_ROLES.join(", ")}`);
		process.exit(1);
	}

	const role = values.role ?? "reader";
	if (!VALID_ROLES.includes(role)) {
		console.error(`Rol inválido: ${role}. Roles válidos: ${VALID_ROLES.join(", ")}`);
		process.exit(1);
	}

	const { PGlite } = await import("@electric-sql/pglite");
	const { createTables } = await import("@procomeka/db/setup");

	const dataDir = process.env.PGLITE_DIR ?? `${import.meta.dir}/../../../../local-data`;
	const pglite = new PGlite(dataDir);
	await createTables(pglite);

	const userId = crypto.randomUUID();
	const accountId = crypto.randomUUID();
	const passwordHash = await hashPassword(values.password);
	const now = new Date().toISOString();

	try {
		await pglite.query(
			`INSERT INTO "user" (id, email, email_verified, name, role, is_active, created_at, updated_at) VALUES ($1, $2, true, $3, $4, true, $5, $6)`,
			[userId, values.email, values.name, role, now, now],
		);
		await pglite.query(
			`INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES ($1, $2, $3, 'credential', $4, $5, $6)`,
			[accountId, userId, userId, passwordHash, now, now],
		);

		console.log(`Usuario creado:`);
		console.log(`  ID:    ${userId}`);
		console.log(`  Email: ${values.email}`);
		console.log(`  Nombre: ${values.name}`);
		console.log(`  Rol:   ${role}`);
	} catch (err) {
		if (err instanceof Error && err.message.includes("unique")) {
			console.error(`Error: ya existe un usuario con email ${values.email}`);
			process.exit(1);
		}
		throw err;
	} finally {
		await pglite.close();
	}
}
