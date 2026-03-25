import { drizzle } from "drizzle-orm/bun-sql";
import { user, account } from "@procomeka/db/schema";

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

	const dbUrl =
		process.env.DATABASE_URL ?? "postgres://localhost:5432/procomeka";
	const db = drizzle(dbUrl);

	const userId = crypto.randomUUID();
	const accountId = crypto.randomUUID();

	// Hash de contraseña con Bun nativo
	const passwordHash = await Bun.password.hash(opts.password, {
		algorithm: "argon2id",
	});

	try {
		await db.insert(user).values({
			id: userId,
			email: opts.email,
			name: opts.name,
			role,
			isActive: 1,
			emailVerified: 0,
		});

		await db.insert(account).values({
			id: accountId,
			userId,
			accountId: userId,
			providerId: "credential",
			password: passwordHash,
		});

		console.log(`Usuario creado:`);
		console.log(`  ID:    ${userId}`);
		console.log(`  Email: ${opts.email}`);
		console.log(`  Nombre: ${opts.name}`);
		console.log(`  Rol:   ${role}`);
	} catch (err) {
		if (
			err instanceof Error &&
			err.message.includes("unique")
		) {
			console.error(`Error: ya existe un usuario con email ${opts.email}`);
			process.exit(1);
		}
		throw err;
	}
}
