import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ResourcesTableIsland } from "./ResourcesTableIsland.tsx";

describe("ResourcesTableIsland", () => {
	test("renderiza el shell inicial de recursos", () => {
		const html = renderToStaticMarkup(<ResourcesTableIsland />);

		expect(html).toContain("Cargando recursos...");
		expect(html).toContain("Titulo, descripcion o autor");
		expect(html).toContain("Acciones");
		expect(html).toContain("No hay recursos para los filtros actuales.");
	});
});
