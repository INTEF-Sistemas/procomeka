/**
 * Prepara la versión estática (GitHub Pages / preview):
 * 1. Extrae fixtures .elpx al directorio public (previsualizaciones)
 * 2. Copia los .elpx raw para que el editor pueda cargarlos
 * 3. Copia el editor estático de eXeLearning a public/
 *
 * Uso: bun run apps/frontend/scripts/prepare-elpx-preview.ts
 */
import path from "node:path";
import { createHash } from "node:crypto";
import { readdir, mkdir, rm, readFile, writeFile, copyFile, cp } from "node:fs/promises";
import { processElpxUpload } from "../../api/src/services/elpx-processor.ts";

const FIXTURES_DIR = path.resolve(import.meta.dir, "../../api/src/test-fixtures/elpx");
const PUBLIC_BASE = path.resolve(import.meta.dir, "../public");
const PUBLIC_ELPX_BASE = path.join(PUBLIC_BASE, "api/v1");
const PUBLIC_ELPX_DIR = path.join(PUBLIC_ELPX_BASE, "elpx");
const PUBLIC_ELPX_RAW_DIR = path.join(PUBLIC_ELPX_BASE, "elpx-raw");
const PUBLIC_EDITOR_DIR = path.join(PUBLIC_BASE, "exelearning-editor");
const EDITOR_SOURCE_DIR = path.resolve(import.meta.dir, "../../api/static/exelearning-editor/static");
const SEED_JSON = path.resolve(import.meta.dir, "../public/preview/seed.json");

const SELECTED_FIXTURES = [
	"really-simple-test-project.elpx",
	"mermaid.elpx",
	"propiedades.elpx",
	"idevice-text.elpx",
];

async function main() {
	console.log("Preparando versión estática con eXeLearning...\n");

	// --- 1. Extraer fixtures .elpx ---
	console.log("1. Extrayendo previsualizaciones .elpx...");
	await rm(PUBLIC_ELPX_DIR, { recursive: true, force: true });
	await rm(PUBLIC_ELPX_RAW_DIR, { recursive: true, force: true });
	await mkdir(PUBLIC_ELPX_BASE, { recursive: true });
	await mkdir(PUBLIC_ELPX_RAW_DIR, { recursive: true });

	const results: { hash: string; filename: string }[] = [];

	for (const fixture of SELECTED_FIXTURES) {
		const fixturePath = path.join(FIXTURES_DIR, fixture);
		try {
			// Deterministic hash from file content so seed.json always matches static dirs
			const fileContent = await readFile(fixturePath);
			const hash = createHash("sha1").update(fileContent).digest("hex");
			const result = await processElpxUpload(fixturePath, PUBLIC_ELPX_BASE, { hash });
			results.push({ hash: result.hash, filename: fixture });

			// Copy raw .elpx for the editor to load
			await copyFile(fixturePath, path.join(PUBLIC_ELPX_RAW_DIR, `${result.hash}.elpx`));

			console.log(`  + ${fixture} → ${result.hash.slice(0, 12)}...`);
		} catch (err) {
			console.error(`  ✗ ${fixture}: ${err}`);
		}
	}

	// --- 2. Copiar editor estático ---
	console.log("\n2. Copiando editor eXeLearning...");
	try {
		await readdir(EDITOR_SOURCE_DIR);
		await rm(PUBLIC_EDITOR_DIR, { recursive: true, force: true });
		await cp(EDITOR_SOURCE_DIR, PUBLIC_EDITOR_DIR, { recursive: true });
		console.log(`  + Editor copiado a ${PUBLIC_EDITOR_DIR}`);
	} catch {
		console.log("  ⚠ Editor no disponible. Ejecuta: make download-exelearning-editor");
	}

	// --- 3. Actualizar seed.json ---
	console.log("\n3. Actualizando seed.json...");
	const seedRaw = await readFile(SEED_JSON, "utf-8");
	const seed = JSON.parse(seedRaw);

	const publishedResources = seed.resources.filter(
		(r: { editorialStatus: string }) => r.editorialStatus === "published",
	);

	seed.elpxProjects = publishedResources.map(
		(r: { id: string }, i: number) => {
			const result = results[i % results.length];
			return {
				id: `elpx-${r.id}`,
				resourceId: r.id,
				hash: result.hash,
				hasPreview: 1,
				originalFilename: result.filename,
				elpxMetadata: null,
			};
		},
	);

	await writeFile(SEED_JSON, JSON.stringify(seed, null, "\t") + "\n");
	console.log(`  + ${seed.elpxProjects.length} proyectos elpx`);
	console.log("\nPreparación completada.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
