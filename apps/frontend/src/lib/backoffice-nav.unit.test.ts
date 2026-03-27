import { describe, expect, test } from "bun:test";
import { canAccessSection, getVisibleSections } from "./backoffice-nav.ts";

describe("backoffice navigation", () => {
	test("reader no ve secciones de backoffice", () => {
		expect(getVisibleSections("reader")).toHaveLength(0);
	});

	test("author ve recursos y colecciones", () => {
		const sections = getVisibleSections("author").map((section) => section.id);
		expect(sections).toEqual(["dashboard", "resources", "collections"]);
	});

	test("curator añade categorías", () => {
		expect(canAccessSection("curator", "curator")).toBe(true);
		expect(canAccessSection("author", "curator")).toBe(false);
	});

	test("admin ve todas las secciones", () => {
		expect(getVisibleSections("admin")).toHaveLength(5);
	});
});
