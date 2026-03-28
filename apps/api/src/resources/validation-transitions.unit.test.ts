import { expect, test, describe } from "bun:test";
import { validateTransition, TRANSITION_RULES, ROLE_LEVELS } from "@procomeka/db/validation";

describe("validateTransition", () => {
	describe("author puede enviar a revisión", () => {
		test("draft → review con author es válido", () => {
			const r = validateTransition("draft", "review", "author");
			expect(r.valid).toBe(true);
		});

		test("draft → review con curator es válido", () => {
			const r = validateTransition("draft", "review", "curator");
			expect(r.valid).toBe(true);
		});

		test("draft → review con admin es válido", () => {
			const r = validateTransition("draft", "review", "admin");
			expect(r.valid).toBe(true);
		});
	});

	describe("author no puede saltar pasos ni aprobar", () => {
		test("draft → published con author es inválido", () => {
			const r = validateTransition("draft", "published", "author");
			expect(r.valid).toBe(false);
			expect(r.errors[0].field).toBe("status");
		});

		test("review → published con author es inválido (rol insuficiente)", () => {
			const r = validateTransition("review", "published", "author");
			expect(r.valid).toBe(false);
			expect(r.errors[0].message).toContain("Rol insuficiente");
		});

		test("review → draft con author es inválido (rol insuficiente)", () => {
			const r = validateTransition("review", "draft", "author");
			expect(r.valid).toBe(false);
		});
	});

	describe("curator puede gestionar flujo completo", () => {
		test("review → published con curator es válido", () => {
			const r = validateTransition("review", "published", "curator");
			expect(r.valid).toBe(true);
		});

		test("review → draft con curator es válido (rechazo)", () => {
			const r = validateTransition("review", "draft", "curator");
			expect(r.valid).toBe(true);
		});

		test("published → archived con curator es válido", () => {
			const r = validateTransition("published", "archived", "curator");
			expect(r.valid).toBe(true);
		});

		test("archived → draft con curator es válido (restaurar)", () => {
			const r = validateTransition("archived", "draft", "curator");
			expect(r.valid).toBe(true);
		});
	});

	describe("admin hereda permisos de curator", () => {
		test("review → published con admin es válido", () => {
			const r = validateTransition("review", "published", "admin");
			expect(r.valid).toBe(true);
		});

		test("published → archived con admin es válido", () => {
			const r = validateTransition("published", "archived", "admin");
			expect(r.valid).toBe(true);
		});
	});

	describe("reader no puede hacer transiciones", () => {
		test("draft → review con reader es inválido", () => {
			const r = validateTransition("draft", "review", "reader");
			expect(r.valid).toBe(false);
			expect(r.errors[0].message).toContain("Rol insuficiente");
		});
	});

	describe("transiciones inválidas", () => {
		test("published → review no está permitida", () => {
			const r = validateTransition("published", "review", "admin");
			expect(r.valid).toBe(false);
			expect(r.errors[0].message).toContain("Transición no permitida");
		});

		test("draft → archived no está permitida", () => {
			const r = validateTransition("draft", "archived", "admin");
			expect(r.valid).toBe(false);
		});

		test("estado actual desconocido retorna error", () => {
			const r = validateTransition("unknown", "draft", "admin");
			expect(r.valid).toBe(false);
			expect(r.errors[0].message).toContain("Estado actual no válido");
		});
	});
});

describe("TRANSITION_RULES", () => {
	test("cubre todos los estados válidos excepto terminales sin salida", () => {
		expect(Object.keys(TRANSITION_RULES)).toContain("draft");
		expect(Object.keys(TRANSITION_RULES)).toContain("review");
		expect(Object.keys(TRANSITION_RULES)).toContain("published");
		expect(Object.keys(TRANSITION_RULES)).toContain("archived");
	});
});

describe("ROLE_LEVELS", () => {
	test("jerarquía de roles es correcta", () => {
		expect(ROLE_LEVELS.reader).toBeLessThan(ROLE_LEVELS.author);
		expect(ROLE_LEVELS.author).toBeLessThan(ROLE_LEVELS.curator);
		expect(ROLE_LEVELS.curator).toBeLessThan(ROLE_LEVELS.admin);
	});
});
