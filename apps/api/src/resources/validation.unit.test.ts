import { expect, test, describe } from "bun:test";
import {
	validateCreateResource,
	validateUpdateResource,
	validateStatus,
} from "./validation.ts";

const validPayload = {
	title: "Recurso de ejemplo",
	description: "Descripción del recurso educativo",
	language: "es",
	license: "cc-by",
	resourceType: "documento",
};

describe("validateCreateResource", () => {
	test("payload válido pasa", () => {
		const r = validateCreateResource(validPayload);
		expect(r.valid).toBe(true);
		expect(r.errors).toHaveLength(0);
	});

	test("payload con campos opcionales pasa", () => {
		const r = validateCreateResource({
			...validPayload,
			author: "Autor",
			keywords: "math, science",
			publisher: "Editorial",
			subjects: ["Matemáticas"],
			levels: ["Primaria"],
		});
		expect(r.valid).toBe(true);
	});

	test("falta title da error específico", () => {
		const { title, ...rest } = validPayload;
		const r = validateCreateResource(rest);
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "title")).toBeTruthy();
	});

	test("falta description da error", () => {
		const { description, ...rest } = validPayload;
		const r = validateCreateResource(rest);
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "description")).toBeTruthy();
	});

	test("falta language da error", () => {
		const { language, ...rest } = validPayload;
		const r = validateCreateResource(rest);
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "language")).toBeTruthy();
	});

	test("falta license da error", () => {
		const { license, ...rest } = validPayload;
		const r = validateCreateResource(rest);
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "license")).toBeTruthy();
	});

	test("falta resourceType da error", () => {
		const { resourceType, ...rest } = validPayload;
		const r = validateCreateResource(rest);
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "resourceType")).toBeTruthy();
	});

	test("title excede 500 caracteres", () => {
		const r = validateCreateResource({ ...validPayload, title: "x".repeat(501) });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "title")?.message).toContain("500");
	});

	test("description excede 5000 caracteres", () => {
		const r = validateCreateResource({ ...validPayload, description: "x".repeat(5001) });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "description")?.message).toContain("5000");
	});

	test("language inválido rechazado", () => {
		const r = validateCreateResource({ ...validPayload, language: "zz" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "language")).toBeTruthy();
	});

	test("license inválida rechazada", () => {
		const r = validateCreateResource({ ...validPayload, license: "mit" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "license")).toBeTruthy();
	});

	test("body null rechazado", () => {
		const r = validateCreateResource(null);
		expect(r.valid).toBe(false);
	});

	test("subjects no array rechazado", () => {
		const r = validateCreateResource({ ...validPayload, subjects: "no-array" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "subjects")).toBeTruthy();
	});

	test("múltiples errores acumulados", () => {
		const r = validateCreateResource({});
		expect(r.valid).toBe(false);
		expect(r.errors.length).toBeGreaterThanOrEqual(5);
	});
});

describe("validateUpdateResource", () => {
	test("update parcial válido pasa", () => {
		const r = validateUpdateResource({ title: "Nuevo título" });
		expect(r.valid).toBe(true);
	});

	test("update vacío falla", () => {
		const r = validateUpdateResource({});
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "body")).toBeTruthy();
	});

	test("title vacío en update falla", () => {
		const r = validateUpdateResource({ title: "" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "title")).toBeTruthy();
	});

	test("language inválido en update falla", () => {
		const r = validateUpdateResource({ language: "zz" });
		expect(r.valid).toBe(false);
	});

	test("body null falla", () => {
		const r = validateUpdateResource(null);
		expect(r.valid).toBe(false);
	});
});

describe("validateStatus", () => {
	test("draft es válido", () => {
		expect(validateStatus("draft").valid).toBe(true);
	});

	test("review es válido", () => {
		expect(validateStatus("review").valid).toBe(true);
	});

	test("published es válido", () => {
		expect(validateStatus("published").valid).toBe(true);
	});

	test("archived es válido", () => {
		expect(validateStatus("archived").valid).toBe(true);
	});

	test("borrador rechazado (valor legacy)", () => {
		expect(validateStatus("borrador").valid).toBe(false);
	});

	test("vacío rechazado", () => {
		expect(validateStatus("").valid).toBe(false);
	});

	test("null rechazado", () => {
		expect(validateStatus(null).valid).toBe(false);
	});
});
