import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ResourceFormIsland } from "./ResourceFormIsland.tsx";
import { ResourceEditorIsland } from "./ResourceEditorIsland.tsx";

describe("Resource form islands", () => {
	test("ResourceFormIsland renderiza el shell inicial de alta", () => {
		const html = renderToStaticMarkup(<ResourceFormIsland mode="create" />);

		expect(html).toContain("Título *");
		expect(html).toContain("Crear recurso");
		expect(html).toContain("Palabras clave");
	});

	test("ResourceEditorIsland renderiza el estado de carga inicial", () => {
		const html = renderToStaticMarkup(<ResourceEditorIsland />);

		expect(html).toContain("Cargando recurso...");
	});
});
