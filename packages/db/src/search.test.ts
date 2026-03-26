import { expect, test, describe, beforeAll } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema/resources.ts";
import { createTables } from "./setup.ts";
import { listResources, createResource } from "./repository.ts";

describe("Search Case and Accent Insensitivity", () => {
	let db: any;

	beforeAll(async () => {
		const pglite = new PGlite();
		await createTables(pglite);
		db = drizzle(pglite, { schema });

		// Seed some data
		await createResource(db, {
			title: "Matemáticas",
			description: "Ciencia de los números",
			language: "es",
			license: "cc-by",
			resourceType: "documento",
			author: "García",
			keywords: "educación, mates"
		});

        await createResource(db, {
			title: "Educación Física",
			description: "Deporte en la escuela",
			language: "es",
			license: "cc-by",
			resourceType: "documento",
			author: "Pérez",
			keywords: "deporte"
		});
	});

	test("Search 'matematicas' should find 'Matemáticas'", async () => {
		const result = await listResources(db, { search: "matematicas" });
		expect(result.data.some(r => r.title === "Matemáticas")).toBe(true);
	});

	test("Search 'MATEMATICAS' should find 'Matemáticas'", async () => {
		const result = await listResources(db, { search: "MATEMATICAS" });
		expect(result.data.some(r => r.title === "Matemáticas")).toBe(true);
	});

	test("Search 'educacion' should find 'Educación Física'", async () => {
		const result = await listResources(db, { search: "educacion" });
		expect(result.data.some(r => r.title === "Educación Física")).toBe(true);
	});

    test("Search 'GARCIA' should find resource by 'García'", async () => {
		const result = await listResources(db, { search: "GARCIA" });
		expect(result.data.some(r => r.author === "García")).toBe(true);
	});

    test("Search 'escuela' should find resource by description", async () => {
		const result = await listResources(db, { search: "escuela" });
		expect(result.data.some(r => r.title === "Educación Física")).toBe(true);
	});
});
