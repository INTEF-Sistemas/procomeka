import { describe, expect, test } from "bun:test";
import { DEV_RESOURCES, DEV_USERS } from "@procomeka/db/seed-data";
import { formatPostgresSeedTarget, resolveSeedMode, seedWithClient } from "./seed.ts";

describe("resolveSeedMode", () => {
	test("usa postgres si DATABASE_URL está definida", () => {
		expect(resolveSeedMode({ DATABASE_URL: "postgres://localhost/db" })).toBe("postgres");
	});

	test("usa pglite si DATABASE_URL no está definida", () => {
		expect(resolveSeedMode({})).toBe("pglite");
	});
});

describe("formatPostgresSeedTarget", () => {
	test("redacta credenciales y conserva host, puerto y base de datos", () => {
		expect(formatPostgresSeedTarget("postgres://user:secret@db.example.com:6543/procomeka")).toBe(
			"Base PostgreSQL: db.example.com:6543/procomeka",
		);
	});
});

describe("seedWithClient", { timeout: 60_000 }, () => {
	test("inserta usuarios y recursos cuando no existen", { timeout: 30_000 }, async () => {
		const calls: Array<{ statement: string; params?: unknown[] }> = [];
		const logs: string[] = [];
		let closed = false;

		await seedWithClient(
			{
				async query(statement, params) {
					calls.push({ statement, params });
					if (statement.includes('SELECT id FROM "user"') || statement.includes('SELECT id FROM "resources"')) {
						return { rows: [] };
					}
					return { rows: [] };
				},
				async close() {
					closed = true;
				},
			},
			{
				now: "2026-03-27T10:00:00.000Z",
				log: { log: (message: string) => logs.push(message) },
				successTarget: "Directorio PGlite: /tmp/procomeka",
			},
		);

		expect(closed).toBe(true);
		expect(calls.filter((call) => call.statement.includes('INSERT INTO "user"')).length).toBe(DEV_USERS.length);
		expect(calls.filter((call) => call.statement.includes('INSERT INTO "account"')).length).toBe(DEV_USERS.length);
		expect(calls.filter((call) => call.statement.includes('INSERT INTO "resources"')).length).toBe(DEV_RESOURCES.length);
		expect(calls.some((call) => call.statement.includes('INSERT INTO "resource_subjects"'))).toBe(true);
		expect(calls.some((call) => call.statement.includes('INSERT INTO "resource_levels"'))).toBe(true);
		expect(logs.at(-1)).toBe("\nSeed completado. Directorio PGlite: /tmp/procomeka");
	});

	test("omite entidades ya existentes y soporta resultados estilo postgres", async () => {
		const logs: string[] = [];
		let resourceSelects = 0;

		await seedWithClient(
			{
				async query(statement) {
					if (statement.includes('SELECT id FROM "user"')) {
						return [{ id: "existing-user" }];
					}
					if (statement.includes('SELECT id FROM "resources"')) {
						resourceSelects += 1;
						return resourceSelects === 1 ? [{ id: "existing-resource" }] : [];
					}
					return [];
				},
				async close() {},
			},
			{
				now: "2026-03-27T10:00:00.000Z",
				log: { log: (message: string) => logs.push(message) },
				successTarget: "Base PostgreSQL: postgres://localhost/procomeka",
			},
		);

		expect(logs.some((message) => message.includes(`${DEV_USERS[0]?.email} ya existe`))).toBe(true);
		expect(logs.some((message) => message.includes(`${DEV_RESOURCES[0]?.slug} ya existe`))).toBe(true);
		expect(logs.some((message) => message.includes(`  + ${DEV_RESOURCES[1]?.slug}`))).toBe(true);
	});

	test("cierra el cliente aunque falle una consulta", async () => {
		let closed = false;

		await expect(
			seedWithClient(
				{
					async query(statement) {
						if (statement.includes('INSERT INTO "account"')) {
							throw new Error("account insert failed");
						}
						return { rows: [] };
					},
					async close() {
						closed = true;
					},
				},
				{ successTarget: "Directorio PGlite: /tmp/procomeka" },
			),
		).rejects.toThrow("account insert failed");

		expect(closed).toBe(true);
	});
});
