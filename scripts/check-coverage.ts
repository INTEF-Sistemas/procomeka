import { spawn } from "node:child_process";

import { buildBunTestArgs, findStandardTestFiles } from "./run-bun-suite.ts";

const THRESHOLD = 90;

async function runCoverage() {
	const files = await findStandardTestFiles();

	if (files.length === 0) {
		console.error("❌ No se encontraron tests estándar para calcular coverage");
		process.exit(1);
	}

	const env = { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" };
	const proc = spawn("bun", buildBunTestArgs(files, { coverage: true }), { env });

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

await runCoverage();
