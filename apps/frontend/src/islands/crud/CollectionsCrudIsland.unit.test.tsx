import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CollectionsCrudIsland } from "./CollectionsCrudIsland.tsx";

describe("CollectionsCrudIsland", () => {
	test("renderiza el shell inicial de colecciones", () => {
		const html = renderToStaticMarkup(<CollectionsCrudIsland />);

		expect(html).toContain("Nueva coleccion");
		expect(html).toContain("Cargando colecciones...");
		expect(html).toContain("Titulo o descripcion");
		expect(html).toContain("Crear coleccion");
		expect(html).toContain("No hay colecciones para los filtros actuales.");
	});
});
