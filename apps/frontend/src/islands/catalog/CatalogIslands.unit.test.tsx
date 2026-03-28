import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogIsland } from "./CatalogIsland.tsx";
import { CatalogSearchIsland } from "./CatalogSearchIsland.tsx";
import { ResourceDetailIsland } from "./ResourceDetailIsland.tsx";

describe("Catalog islands", () => {
	test("CatalogSearchIsland renderiza el buscador de cabecera", () => {
		const html = renderToStaticMarkup(<CatalogSearchIsland initialQuery="matematicas" />);

		expect(html).toContain("Buscar recursos...");
		expect(html).toContain("matematicas");
	});

	test("CatalogIsland renderiza el shell inicial del catalogo", () => {
		const html = renderToStaticMarkup(<CatalogIsland />);

		expect(html).toContain("Filtros");
		expect(html).toContain("Cargando recursos...");
		expect(html).toContain("Limpiar filtros");
		expect(html).toContain("Siguiente");
	});

	test("ResourceDetailIsland renderiza el estado de carga inicial", () => {
		const html = renderToStaticMarkup(<ResourceDetailIsland />);

		expect(html).toContain("Cargando recurso...");
	});
});
