import { expect, test, describe } from "bun:test";
import { ac, reader, author, curator, admin } from "./permissions.ts";

describe("Modelo de permisos RBAC", () => {
	describe("reader", () => {
		test("puede leer recursos", () => {
			expect(reader.authorize({ resource: ["read"] }).success).toBe(true);
		});

		test("puede leer colecciones", () => {
			expect(reader.authorize({ collection: ["read"] }).success).toBe(true);
		});

		test("no puede crear recursos", () => {
			expect(reader.authorize({ resource: ["create"] }).success).toBe(false);
		});

		test("no puede gestionar usuarios", () => {
			expect(reader.authorize({ collection: ["delete"] }).success).toBe(false);
		});
	});

	describe("author", () => {
		test("puede crear recursos", () => {
			expect(author.authorize({ resource: ["create"] }).success).toBe(true);
		});

		test("puede actualizar recursos", () => {
			expect(author.authorize({ resource: ["update"] }).success).toBe(true);
		});

		test("no puede curar recursos", () => {
			expect(author.authorize({ resource: ["curate"] }).success).toBe(false);
		});

		test("no puede borrar recursos", () => {
			expect(author.authorize({ resource: ["delete"] }).success).toBe(false);
		});

		test("puede crear colecciones", () => {
			expect(author.authorize({ collection: ["create"] }).success).toBe(true);
		});

		test("no puede borrar colecciones", () => {
			expect(author.authorize({ collection: ["delete"] }).success).toBe(false);
		});
	});

	describe("curator", () => {
		test("puede curar recursos", () => {
			expect(curator.authorize({ resource: ["curate"] }).success).toBe(true);
		});

		test("puede borrar colecciones", () => {
			expect(curator.authorize({ collection: ["delete"] }).success).toBe(true);
		});

		test("no puede moderar recursos", () => {
			expect(curator.authorize({ resource: ["moderate"] }).success).toBe(false);
		});

		test("no puede borrar recursos", () => {
			expect(curator.authorize({ resource: ["delete"] }).success).toBe(false);
		});
	});

	describe("admin", () => {
		test("puede moderar recursos", () => {
			expect(admin.authorize({ resource: ["moderate"] }).success).toBe(true);
		});

		test("puede borrar recursos", () => {
			expect(admin.authorize({ resource: ["delete"] }).success).toBe(true);
		});

		test("puede gestionar usuarios", () => {
			expect(admin.authorize({ user: ["create", "delete", "ban"] }).success).toBe(true);
		});

		test("tiene todos los permisos de recurso", () => {
			expect(admin.authorize({ resource: ["create", "read", "update", "delete", "curate", "moderate"] }).success).toBe(true);
		});
	});

	test("access control define las entidades correctas", () => {
		expect(ac.statements).toHaveProperty("resource");
		expect(ac.statements).toHaveProperty("collection");
		expect(ac.statements).toHaveProperty("user");
	});
});
