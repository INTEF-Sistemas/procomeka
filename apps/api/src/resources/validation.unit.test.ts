import { expect, test, describe } from "bun:test";
import {
	validateCreateResource,
	validateUpdateResource,
	validateStatus,
	validateCollection,
	validateTaxonomy,
	validateTransition,
} from "@procomeka/db/validation";

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

	test("title excede 500 caracteres en update falla", () => {
		const r = validateUpdateResource({ title: "x".repeat(501) });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "title")?.message).toContain("500");
	});

	test("description vacía en update falla", () => {
		const r = validateUpdateResource({ description: "" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "description")).toBeTruthy();
	});

	test("description excede 5000 en update falla", () => {
		const r = validateUpdateResource({ description: "x".repeat(5001) });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "description")?.message).toContain("5000");
	});

	test("language inválido en update falla", () => {
		const r = validateUpdateResource({ language: "zz" });
		expect(r.valid).toBe(false);
	});

	test("language vacío en update falla", () => {
		const r = validateUpdateResource({ language: "" });
		expect(r.valid).toBe(false);
	});

	test("license inválida en update falla", () => {
		const r = validateUpdateResource({ license: "mit" });
		expect(r.valid).toBe(false);
	});

	test("license vacía en update falla", () => {
		const r = validateUpdateResource({ license: "" });
		expect(r.valid).toBe(false);
	});

	test("resourceType vacío en update falla", () => {
		const r = validateUpdateResource({ resourceType: "" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "resourceType")).toBeTruthy();
	});

	test("body null falla", () => {
		const r = validateUpdateResource(null);
		expect(r.valid).toBe(false);
	});

	test("update con múltiples campos válidos pasa", () => {
		const r = validateUpdateResource({ title: "T", description: "D", language: "es", license: "cc-by" });
		expect(r.valid).toBe(true);
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

describe("validateCreateResource — campos opcionales", () => {
	test("author no string rechazado", () => {
		const r = validateCreateResource({ ...validPayload, author: 123 });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "author")).toBeTruthy();
	});

	test("author excede 500 caracteres rechazado", () => {
		const r = validateCreateResource({ ...validPayload, author: "x".repeat(501) });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "author")?.message).toContain("500");
	});

	test("keywords no string rechazado", () => {
		const r = validateCreateResource({ ...validPayload, keywords: 42 });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "keywords")).toBeTruthy();
	});

	test("keywords excede 1000 caracteres rechazado", () => {
		const r = validateCreateResource({ ...validPayload, keywords: "x".repeat(1001) });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "keywords")?.message).toContain("1000");
	});

	test("publisher no string rechazado", () => {
		const r = validateCreateResource({ ...validPayload, publisher: true });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "publisher")).toBeTruthy();
	});

	test("levels no array rechazado", () => {
		const r = validateCreateResource({ ...validPayload, levels: "primaria" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "levels")).toBeTruthy();
	});
});

describe("validateCollection", () => {
	test("colección válida pasa", () => {
		const r = validateCollection({ title: "Mi colección", description: "Desc" });
		expect(r.valid).toBe(true);
	});

	test("body null falla", () => {
		const r = validateCollection(null);
		expect(r.valid).toBe(false);
	});

	test("falta título falla", () => {
		const r = validateCollection({ description: "Desc" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "title")).toBeTruthy();
	});

	test("falta descripción falla", () => {
		const r = validateCollection({ title: "Col" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "description")).toBeTruthy();
	});

	test("título vacío falla", () => {
		const r = validateCollection({ title: "", description: "D" });
		expect(r.valid).toBe(false);
	});
});

describe("validateTaxonomy", () => {
	test("taxonomía válida pasa", () => {
		const r = validateTaxonomy({ name: "Matemáticas", type: "subject" });
		expect(r.valid).toBe(true);
	});

	test("body null falla", () => {
		const r = validateTaxonomy(null);
		expect(r.valid).toBe(false);
	});

	test("falta nombre falla", () => {
		const r = validateTaxonomy({ type: "subject" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "name")).toBeTruthy();
	});

	test("tipo inválido falla", () => {
		const r = validateTaxonomy({ name: "Mat", type: "invalid-type" });
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "type")).toBeTruthy();
	});

	test("sin tipo pasa (es opcional)", () => {
		const r = validateTaxonomy({ name: "Mat" });
		expect(r.valid).toBe(true);
	});
});

describe("validateStatusTransition", () => {
	test("draft → review permitida para author", () => {
		const r = validateTransition("draft", "review", "author");
		expect(r.valid).toBe(true);
	});

	test("review → published permitida para curator", () => {
		const r = validateTransition("review", "published", "curator");
		expect(r.valid).toBe(true);
	});

	test("transición inválida falla", () => {
		const r = validateTransition("published", "draft", "author");
		expect(r.valid).toBe(false);
	});

	test("rol insuficiente falla", () => {
		const r = validateTransition("review", "published", "author");
		expect(r.valid).toBe(false);
		expect(r.errors.find((e) => e.field === "status")?.message).toContain("Rol insuficiente");
	});
});
