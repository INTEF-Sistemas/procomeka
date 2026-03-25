import { drizzle } from "drizzle-orm/bun-sql";
import { user } from "@procomeka/db/schema";

export async function userList() {
	const dbUrl =
		process.env.DATABASE_URL ?? "postgres://localhost:5432/procomeka";
	const db = drizzle(dbUrl);

	const users = await db.select({
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		isActive: user.isActive,
		createdAt: user.createdAt,
	}).from(user);

	if (users.length === 0) {
		console.log("No hay usuarios registrados.");
		return;
	}

	console.log(`${users.length} usuario(s):\n`);
	for (const u of users) {
		const active = u.isActive ? "activo" : "inactivo";
		console.log(`  ${u.email} — ${u.name} [${u.role}] (${active})`);
	}
}
