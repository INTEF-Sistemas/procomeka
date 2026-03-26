import { userCreate } from "./commands/user-create.ts";
import { userList } from "./commands/user-list.ts";
import { seed } from "./commands/seed.ts";
import { seedResources } from "./commands/seed-resources.ts";

const [command, ...args] = process.argv.slice(2);

const commands: Record<string, (args: string[]) => Promise<void>> = {
	"user:create": userCreate,
	"user:list": userList,
	seed: async () => seed(),
	"seed:resources": seedResources,
};

async function main() {
	if (!command || command === "--help" || command === "-h") {
		console.log("Procomeka CLI\n");
		console.log("Comandos disponibles:");
		console.log("  user:create  --email <email> --name <nombre> --role <rol> --password <pass>");
		console.log("  user:list");
		console.log("  seed              Crear usuarios de desarrollo (admin, curator, author, reader)");
		console.log("  seed:resources    Generar recursos aleatorios (--count 10, 100, 1000, 10000 --clean)");
		process.exit(0);
	}

	const handler = commands[command];
	if (!handler) {
		console.error(`Comando desconocido: ${command}`);
		console.error(`Comandos disponibles: ${Object.keys(commands).join(", ")}`);
		process.exit(1);
	}

	await handler(args);
}

main().catch((err) => {
	console.error("Error:", err.message ?? err);
	process.exit(1);
});
