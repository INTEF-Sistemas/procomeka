import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";

import {
	buildBunTestArgs,
	findStandardTestFiles,
	findSuiteFiles,
	getMissingRequiredSuiteMessage,
	getNoTestsMessage,
} from "./run-bun-suite.ts";

describe("run-bun-suite helpers", () => {
	test("buildBunTestArgs places coverage before file paths", () => {
		expect(buildBunTestArgs(["apps/api/src/index.unit.test.ts"], { coverage: true })).toEqual([
			"test",
			"--coverage",
			"apps/api/src/index.unit.test.ts",
		]);
	});

	test("findSuiteFiles returns sorted matches from configured roots", async () => {
		const rootDir = await mkdtemp(join(tmpdir(), "procomeka-suite-"));

		await mkdir(join(rootDir, "apps", "api", "src"), { recursive: true });
		await mkdir(join(rootDir, "packages", "db", "src"), { recursive: true });
		await mkdir(join(rootDir, "scripts"), { recursive: true });

		await writeFile(join(rootDir, "apps", "api", "src", "zeta.unit.test.ts"), "");
		await writeFile(join(rootDir, "scripts", "alpha.unit.test.ts"), "");
		await writeFile(join(rootDir, "packages", "db", "src", "resource.integration.test.ts"), "");
		await writeFile(join(rootDir, "apps", "api", "src", "ignore.spec.ts"), "");

		expect(await findSuiteFiles("unit", rootDir)).toEqual([
			"apps/api/src/zeta.unit.test.ts",
			"scripts/alpha.unit.test.ts",
		]);
		expect(await findSuiteFiles("integration", rootDir)).toEqual([
			"packages/db/src/resource.integration.test.ts",
		]);
	});

	test("findStandardTestFiles combines unit and integration suites without duplicates", async () => {
		const rootDir = await mkdtemp(join(tmpdir(), "procomeka-standard-"));

		await mkdir(join(rootDir, "apps", "api", "src"), { recursive: true });
		await mkdir(join(rootDir, "scripts"), { recursive: true });

		await writeFile(join(rootDir, "apps", "api", "src", "resource.unit.test.ts"), "");
		await writeFile(join(rootDir, "scripts", "suite.integration.test.ts"), "");

		expect(await findStandardTestFiles(rootDir)).toEqual([
			"apps/api/src/resource.unit.test.ts",
			"scripts/suite.integration.test.ts",
		]);
	});

	test("messages distinguish skipped optional suites from missing required suites", () => {
		expect(getNoTestsMessage("integration")).toContain("skipping");
		expect(getMissingRequiredSuiteMessage("unit")).not.toContain("skipping");
	});
});
