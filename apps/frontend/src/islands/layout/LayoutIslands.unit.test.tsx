import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminNavIsland } from "./AdminNavIsland.tsx";
import { BaseNavIsland } from "./BaseNavIsland.tsx";
import { PreviewBannerIsland } from "./PreviewBannerIsland.tsx";

describe("Layout islands", () => {
	test("BaseNavIsland renderiza el shell de navegación pública", () => {
		const html = renderToStaticMarkup(<BaseNavIsland />);

		expect(html).toContain("Crear recurso");
		expect(html).toContain("Iniciar sesion");
	});

	test("AdminNavIsland renderiza el shell de navegación del backoffice", () => {
		const html = renderToStaticMarkup(<AdminNavIsland activeSection="dashboard" />);

		expect(html).toContain("Menu");
		expect(html).toContain("Backoffice");
	});

	test("PreviewBannerIsland renderiza el shell de preview", () => {
		const html = renderToStaticMarkup(<PreviewBannerIsland />);

		expect(html).toContain("Vista previa");
		expect(html).toContain("Reiniciar datos");
	});
});
