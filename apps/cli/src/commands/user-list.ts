export async function userList() {
	const { PGlite } = await import("@electric-sql/pglite");
	const { createTables } = await import("@procomeka/db/setup");

	const dataDir = process.env.PGLITE_DIR ?? `${import.meta.dir}/../../../../local-data`;
	const pglite = new PGlite(dataDir);
	await createTables(pglite);

	const result = await pglite.query<{
		id: string;
		email: string;
		name: string;
		role: string;
		is_active: number;
	}>(`SELECT id, email, name, role, is_active FROM "user"`);

	await pglite.close();

	const users = result.rows;
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
