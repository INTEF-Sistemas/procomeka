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

describe("Rutas públicas /api/v1", () => {
	test("GET /api/v1/resources devuelve lista vacía", async () => {
		const res = await app.request("/api/v1/resources");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([]);
	});

	test("GET /api/v1/resources/:slug devuelve slug", async () => {
		const res = await app.request("/api/v1/resources/test-slug");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.slug).toBe("test-slug");
	});

	test("GET /api/v1/collections devuelve lista vacía", async () => {
		const res = await app.request("/api/v1/collections");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([]);
	});

	test("GET /api/v1/collections/:slug devuelve slug", async () => {
		const res = await app.request("/api/v1/collections/mi-coleccion");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.slug).toBe("mi-coleccion");
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

describe("Rutas admin /api/admin — sin autenticación", () => {
	test("POST /api/admin/resources devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/resources", {
			method: "POST",
		});
		expect(res.status).toBe(401);
	});

	test("GET /api/admin/users devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(401);
	});

	test("DELETE /api/admin/resources/123 devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/resources/123", {
			method: "DELETE",
		});
		expect(res.status).toBe(401);
	});

	test("PATCH /api/admin/resources/123/status devuelve 401 sin sesión", async () => {
		const res = await app.request("/api/admin/resources/123/status", {
			method: "PATCH",
		});
		expect(res.status).toBe(401);
	});
});
