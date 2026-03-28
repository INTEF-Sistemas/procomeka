import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { UsersCrudIsland } from "./UsersCrudIsland.tsx";

describe("UsersCrudIsland", () => {
	test("renderiza el shell inicial de usuarios", () => {
		const html = renderToStaticMarkup(<UsersCrudIsland />);

		expect(html).toContain("Cargando usuarios...");
		expect(html).toContain("Nombre o email");
		expect(html).toContain("Acciones");
		expect(html).toContain("Pagina 1 de 1");
		expect(html).toContain("No hay usuarios para los filtros actuales.");
	});
});
