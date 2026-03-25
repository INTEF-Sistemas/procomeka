import { userCreate } from "./commands/user-create.ts";
import { userList } from "./commands/user-list.ts";

const [command, ...args] = process.argv.slice(2);

const commands: Record<string, (args: string[]) => Promise<void>> = {
	"user:create": userCreate,
	"user:list": userList,
};

async function main() {
	if (!command || command === "--help" || command === "-h") {
		console.log("Procomeka CLI\n");
		console.log("Comandos disponibles:");
		console.log("  user:create  --email <email> --name <nombre> --role <rol> --password <pass>");
		console.log("  user:list");
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
