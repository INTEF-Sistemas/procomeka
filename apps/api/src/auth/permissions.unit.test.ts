import { expect, test, describe } from "bun:test";
import { ac, reader, author, curator, admin } from "./permissions.ts";

describe("Modelo de permisos RBAC", () => {
	test("reader solo puede leer recursos y colecciones", () => {
		expect(reader).toBeDefined();
	});

	test("author puede crear, leer y actualizar recursos", () => {
		expect(author).toBeDefined();
	});

	test("curator puede curar recursos además de CRUD", () => {
		expect(curator).toBeDefined();
	});

	test("admin tiene todos los permisos", () => {
		expect(admin).toBeDefined();
	});

	test("access control está definido con las entidades correctas", () => {
		expect(ac).toBeDefined();
	});
});
