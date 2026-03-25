import { parseArgs } from "node:util";
import { Database } from "bun:sqlite";
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

	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../../local.db`;
	const db = new Database(dbPath);

	const userId = crypto.randomUUID();
	const accountId = crypto.randomUUID();
	const passwordHash = await hashPassword(values.password);

	try {
		db.run(
			`INSERT INTO "user" (id, email, email_verified, name, role, is_active) VALUES (?, ?, 1, ?, ?, 1)`,
			[userId, values.email, values.name, role],
		);
		db.run(
			`INSERT INTO "account" (id, user_id, account_id, provider_id, password) VALUES (?, ?, ?, 'credential', ?)`,
			[accountId, userId, userId, passwordHash],
		);

		console.log(`Usuario creado:`);
		console.log(`  ID:    ${userId}`);
		console.log(`  Email: ${values.email}`);
		console.log(`  Nombre: ${values.name}`);
		console.log(`  Rol:   ${role}`);
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			console.error(`Error: ya existe un usuario con email ${values.email}`);
			process.exit(1);
		}
		throw err;
	} finally {
		db.close();
	}
}
