import { Database } from "bun:sqlite";

function parseArgs(args: string[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg?.startsWith("--") && i + 1 < args.length) {
			const key = arg.slice(2);
			const value = args[i + 1];
			if (value && !value.startsWith("--")) {
				result[key] = value;
				i++;
			}
		}
	}
	return result;
}

export async function userCreate(args: string[]) {
	const opts = parseArgs(args);

	if (!opts.email || !opts.name || !opts.password) {
		console.error(
			"Uso: user:create --email <email> --name <nombre> --role <rol> --password <contraseña>",
		);
		console.error("Roles válidos: admin, curator, author, reader");
		process.exit(1);
	}

	const role = opts.role ?? "reader";
	const validRoles = ["admin", "curator", "author", "reader"];
	if (!validRoles.includes(role)) {
		console.error(`Rol inválido: ${role}. Roles válidos: ${validRoles.join(", ")}`);
		process.exit(1);
	}

	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../../local.db`;
	const db = new Database(dbPath);

	const userId = crypto.randomUUID();
	const accountId = crypto.randomUUID();
	const passwordHash = await Bun.password.hash(opts.password, {
		algorithm: "argon2id",
	});

	try {
		db.run(
			`INSERT INTO "user" (id, email, email_verified, name, role, is_active) VALUES (?, ?, 1, ?, ?, 1)`,
			[userId, opts.email, opts.name, role],
		);
		db.run(
			`INSERT INTO "account" (id, user_id, account_id, provider_id, password) VALUES (?, ?, ?, 'credential', ?)`,
			[accountId, userId, userId, passwordHash],
		);

		console.log(`Usuario creado:`);
		console.log(`  ID:    ${userId}`);
		console.log(`  Email: ${opts.email}`);
		console.log(`  Nombre: ${opts.name}`);
		console.log(`  Rol:   ${role}`);
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			console.error(`Error: ya existe un usuario con email ${opts.email}`);
			process.exit(1);
		}
		throw err;
	} finally {
		db.close();
	}
}
