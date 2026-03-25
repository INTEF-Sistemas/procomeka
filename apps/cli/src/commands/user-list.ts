import { Database } from "bun:sqlite";

export function userList() {
	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../../local.db`;
	const db = new Database(dbPath);

	const users = db
		.prepare(`SELECT id, email, name, role, is_active FROM "user"`)
		.all() as Array<{
		id: string;
		email: string;
		name: string;
		role: string;
		is_active: number;
	}>;

	db.close();

	if (users.length === 0) {
		console.log("No hay usuarios registrados.");
		return;
	}

	console.log(`${users.length} usuario(s):\n`);
	for (const u of users) {
		const active = u.is_active ? "activo" : "inactivo";
		console.log(`  ${u.email} — ${u.name} [${u.role}] (${active})`);
	}
}
