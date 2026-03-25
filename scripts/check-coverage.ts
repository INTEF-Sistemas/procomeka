import { spawn } from "node:child_process";

const THRESHOLD = 90;

function runCoverage() {
	const env = { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" };
	const proc = spawn("bun", ["test", "--coverage", "apps/api/src/"], { env });

	let output = "";

	proc.stdout.on("data", (data) => {
		output += data.toString();
		process.stdout.write(data);
	});

	proc.stderr.on("data", (data) => {
		output += data.toString();
		process.stderr.write(data);
	});

	proc.on("close", (_code) => {
		// Buscamos "All files"
		const allFilesRegex = /All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/;

		// biome-ignore lint/suspicious/noControlCharactersInRegex: Necesitamos parsear códigos ANSI y limpiar los logs de bun
		const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
		const match = cleanOutput.match(allFilesRegex);

		if (match?.[2]) {
			const coverage = Number.parseFloat(match[2]);
			console.log(`\nCoverage de líneas: ${coverage}%`);

			if (coverage < THRESHOLD) {
				console.error(
					`❌ El coverage (${coverage}%) está por debajo del límite mínimo (${THRESHOLD}%)`,
				);
				process.exit(1);
			} else {
				console.log(`✅ Coverage suficiente (>= ${THRESHOLD}%)`);
				process.exit(0);
			}
		} else {
			console.error(
				"❌ No se pudo determinar el coverage de la salida de bun test --coverage",
			);
			process.exit(1);
		}
	});
}

runCoverage();
