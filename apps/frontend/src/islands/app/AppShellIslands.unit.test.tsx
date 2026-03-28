import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LoginIsland } from "../auth/LoginIsland.tsx";
import { DashboardIsland } from "../dashboard/DashboardIsland.tsx";

describe("App shell islands", () => {
	test("LoginIsland renderiza el shell inicial del formulario", () => {
		const html = renderToStaticMarkup(<LoginIsland />);

		expect(html).toContain("Iniciar sesión");
		expect(html).toContain("Correo electrónico");
		expect(html).toContain("Acceder con cuenta institucional");
	});

	test("DashboardIsland renderiza el shell inicial del panel", () => {
		const html = renderToStaticMarkup(<DashboardIsland />);

		expect(html).toContain("Recursos");
		expect(html).toContain("Colecciones");
		expect(html).toContain("Cargando…");
	});
});
