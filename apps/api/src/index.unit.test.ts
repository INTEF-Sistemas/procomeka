import { expect, test, describe } from "bun:test";
import { app } from "./index.ts";

describe("Endpoints básicos", () => {
	test("GET /health devuelve status ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ status: "ok" });
	});

	test("GET / devuelve info de la API", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.name).toBe("Procomeka API");
	});
});

describe("Config /api/v1/config", () => {
	test("GET /api/v1/config devuelve oidcEnabled y oidcEndSessionUrl", async () => {
		const res = await app.request("/api/v1/config");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(typeof body.oidcEnabled).toBe("boolean");
		expect("oidcEndSessionUrl" in body).toBe(true);
	});
});

describe("Rutas públicas /api/v1", () => {
	test("GET /api/v1/resources devuelve data y total", async () => {
		const res = await app.request("/api/v1/resources");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body.data)).toBe(true);
		expect(typeof body.total).toBe("number");
	});

	test("GET /api/v1/resources/:slug devuelve 404 para slug inexistente", async () => {
		const res = await app.request("/api/v1/resources/no-existe-xyz");
		expect(res.status).toBe(404);
	});

	test("GET /api/v1/resources/:slug devuelve recurso si existe", async () => {
		// Primero obtenemos un slug real del listado
		const listRes = await app.request("/api/v1/resources?limit=1");
		const list = await listRes.json();
		if (list.data.length > 0) {
			const slug = list.data[0].slug;
			const res = await app.request(`/api/v1/resources/${slug}`);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.slug).toBe(slug);
			expect(body.subjects).toBeDefined();
			expect(body.levels).toBeDefined();
		}
	});

	test("GET /api/v1/resources?q= filtra por búsqueda", async () => {
		const res = await app.request("/api/v1/resources?q=scratch");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body.data)).toBe(true);
	});

	test("GET /api/v1/collections devuelve lista", async () => {
		const res = await app.request("/api/v1/collections");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body.data)).toBe(true);
	});
});

describe("Rutas admin /api/admin — sin autenticación", () => {
	test("POST /api/admin/resources devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/resources", { method: "POST" });
		expect(res.status).toBe(401);
	});

	test("GET /api/admin/users devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(401);
	});

	test("DELETE /api/admin/resources/123 devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/resources/123", { method: "DELETE" });
		expect(res.status).toBe(401);
	});
});
