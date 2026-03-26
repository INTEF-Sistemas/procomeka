import { seedRandomResources } from "@procomeka/db/seed-random";
import { getDb } from "../../../api/src/db.ts";

export async function seedResources(args: string[]) {
	let count = 100;
	let clean = false;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--count" && args[i + 1]) {
			count = Number(args[i + 1]);
			i++;
		} else if (args[i] === "--clean") {
			clean = true;
		}
	}

	const allowedCounts = [10, 100, 1000, 10000];
	if (!allowedCounts.includes(count)) {
		console.error(
			`Error: Cantidad ${count} no permitida. Valores: ${allowedCounts.join(", ")}`,
		);
		process.exit(1);
	}

	console.log(
		`Generando ${count} recursos aleatorios... ${clean ? "(Limpiando anteriores)" : ""}`,
	);

	try {
		const { db } = getDb();
		const result = await seedRandomResources(db, count, { clean });

		console.log(`\n¡Éxito!`);
		console.log(`- Recursos creados: ${result.count}`);
		console.log(`- Tiempo: ${result.durationMs}ms`);
	} catch (err: any) {
		console.error("\nError:", err.message);
		process.exit(1);
	}
}
