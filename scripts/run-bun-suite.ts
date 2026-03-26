import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export type SuiteName = "integration" | "unit";

type SuiteDefinition = {
	allowEmpty: boolean;
	label: string;
	suffix: string;
};

export const SEARCH_ROOTS = ["apps", "packages", "scripts"] as const;

export const SUITE_DEFINITIONS: Record<SuiteName, SuiteDefinition> = {
	unit: {
		allowEmpty: false,
		label: "unit",
		suffix: ".unit.test.ts",
	},
	integration: {
		allowEmpty: true,
		label: "integration",
		suffix: ".integration.test.ts",
	},
};

async function walkDirectory(rootDir: string, currentDir: string): Promise<string[]> {
	const entries = await readdir(currentDir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const absolutePath = join(currentDir, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await walkDirectory(rootDir, absolutePath)));
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		files.push(toRepoRelativePath(rootDir, absolutePath));
	}

	return files;
}

function toRepoRelativePath(rootDir: string, absolutePath: string): string {
	return relative(rootDir, absolutePath).replaceAll("\\", "/");
}

export async function findSuiteFiles(
	suite: SuiteName,
	rootDir = process.cwd(),
	searchRoots: readonly string[] = SEARCH_ROOTS,
): Promise<string[]> {
	const definition = SUITE_DEFINITIONS[suite];
	const files = new Set<string>();

	for (const searchRoot of searchRoots) {
		const absoluteSearchRoot = join(rootDir, searchRoot);

		try {
			const nestedFiles = await walkDirectory(rootDir, absoluteSearchRoot);

			for (const file of nestedFiles) {
				if (file.endsWith(definition.suffix)) {
					files.add(file);
				}
			}
		} catch (error) {
			if (
				!(error instanceof Error) ||
				!("code" in error) ||
				error.code !== "ENOENT"
			) {
				throw error;
			}
		}
	}

	return [...files].sort();
}

export async function findStandardTestFiles(rootDir = process.cwd()): Promise<string[]> {
	const files = await Promise.all([
		findSuiteFiles("unit", rootDir),
		findSuiteFiles("integration", rootDir),
	]);

	return [...new Set(files.flat())].sort();
}

export function buildBunTestArgs(
	files: string[],
	options: { coverage?: boolean } = {},
): string[] {
	return ["test", ...(options.coverage ? ["--coverage"] : []), ...files];
}

export function getNoTestsMessage(suite: SuiteName): string {
	const definition = SUITE_DEFINITIONS[suite];

	return `No ${definition.label} tests found under ${SEARCH_ROOTS.join(", ")}; skipping.`;
}

export function getMissingRequiredSuiteMessage(suite: SuiteName): string {
	const definition = SUITE_DEFINITIONS[suite];

	return `No ${definition.label} tests found under ${SEARCH_ROOTS.join(", ")}.`;
}

export function isSuiteName(value: string | undefined): value is SuiteName {
	return value === "unit" || value === "integration";
}

async function main() {
	const suiteArg = process.argv[2];
	const coverage = process.argv.includes("--coverage");

	if (!isSuiteName(suiteArg)) {
		console.error("Usage: bun run scripts/run-bun-suite.ts <unit|integration> [--coverage]");
		process.exit(1);
	}

	const definition = SUITE_DEFINITIONS[suiteArg];
	const files = await findSuiteFiles(suiteArg);

	if (files.length === 0) {
		if (definition.allowEmpty) {
			console.log(getNoTestsMessage(suiteArg));
			return;
		}

		console.error(getMissingRequiredSuiteMessage(suiteArg));
		process.exit(1);
	}

	console.log(`Running ${definition.label} tests in ${files.length} file(s)...`);

	const result = Bun.spawnSync({
		cmd: ["bun", ...buildBunTestArgs(files, { coverage })],
		stdout: "inherit",
		stderr: "inherit",
		stdin: "inherit",
		env: process.env,
	});

	process.exit(result.exitCode);
}

if (import.meta.main) {
	await main();
}
