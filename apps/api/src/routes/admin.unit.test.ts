import { expect, test, describe } from "bun:test";
import { Hono } from "hono";
import type { AuthEnv } from "../auth/middleware.ts";
import { adminRoutes } from "./admin.ts";

function createAdminApp(mockUser: Record<string, unknown> | null = null) {
	const app = new Hono<AuthEnv>();
	app.use("*", async (c, next) => {
		c.set("user", mockUser as AuthEnv["Variables"]["user"]);
		c.set("session", mockUser ? { id: "s" } as AuthEnv["Variables"]["session"] : null);
		await next();
	});
	app.route("/api/admin", adminRoutes);
	return app;
}

const validResource = {
	title: "Test Resource",
	description: "Test description for resource",
	language: "es",
	license: "cc-by",
	resourceType: "documento",
};

describe("Rutas admin — con sesión de admin", () => {
	const app = createAdminApp({ id: "1", role: "admin" });

	test("POST /api/admin/resources → 201 con body válido", async () => {
		const res = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.id).toBeDefined();
		expect(body.slug).toBeDefined();
	});

	test("POST /api/admin/resources → 400 sin campos obligatorios", async () => {
		const res = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Solo título" }),
		});
		expect(res.status).toBe(400);
	});

	test("PUT /api/admin/resources/:id → 200", async () => {
		const res = await app.request("/api/admin/resources/res-1", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Título actualizado" }),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.updated).toBe(true);
	});

	test("DELETE /api/admin/resources/:id → 200", async () => {
		// Crear uno para borrar
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...validResource, title: "Para borrar" }),
		});
		const created = await createRes.json();

		const res = await app.request(`/api/admin/resources/${created.id}`, { method: "DELETE" });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.deleted).toBe(true);
	});

	test("PATCH /api/admin/resources/:id/status → 200", async () => {
		const res = await app.request("/api/admin/resources/res-2/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "validado" }),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe("validado");
	});

	test("PATCH /api/admin/resources/:id/status → 400 sin status", async () => {
		const res = await app.request("/api/admin/resources/res-2/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(400);
	});

	test("GET /api/admin/users → 200", async () => {
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(200);
	});
});

describe("Rutas admin — RBAC por rol", () => {
	test("author puede crear recursos", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const res = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		expect(res.status).toBe(201);
	});

	test("author no puede eliminar recursos", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const res = await app.request("/api/admin/resources/res-1", { method: "DELETE" });
		expect(res.status).toBe(403);
	});

	test("reader no puede crear recursos", async () => {
		const app = createAdminApp({ id: "1", role: "reader" });
		const res = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		expect(res.status).toBe(403);
	});

	test("curator puede cambiar estado editorial", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const res = await app.request("/api/admin/resources/res-3/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "destacado" }),
		});
		expect(res.status).toBe(200);
	});

	test("author no puede cambiar estado editorial", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const res = await app.request("/api/admin/resources/res-3/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "validado" }),
		});
		expect(res.status).toBe(403);
	});

	test("solo admin puede gestionar usuarios", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(403);
	});
});
