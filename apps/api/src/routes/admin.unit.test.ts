import { expect, test, describe } from "bun:test";
import { Hono } from "hono";
import type { AuthEnv } from "../auth/middleware.ts";
import { adminRoutes } from "./admin.ts";

/** Crea app con rutas admin y un usuario mock inyectado. */
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

describe("Rutas admin — con sesión de admin", () => {
	const app = createAdminApp({ id: "1", role: "admin" });

	test("POST /api/admin/resources → 201", async () => {
		const res = await app.request("/api/admin/resources", { method: "POST" });
		expect(res.status).toBe(201);
	});

	test("PUT /api/admin/resources/:id → 200", async () => {
		const res = await app.request("/api/admin/resources/abc", { method: "PUT" });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.id).toBe("abc");
	});

	test("DELETE /api/admin/resources/:id → 200", async () => {
		const res = await app.request("/api/admin/resources/abc", { method: "DELETE" });
		expect(res.status).toBe(200);
	});

	test("PATCH /api/admin/resources/:id/status → 200", async () => {
		const res = await app.request("/api/admin/resources/abc/status", { method: "PATCH" });
		expect(res.status).toBe(200);
	});

	test("GET /api/admin/users → 200", async () => {
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(200);
	});

	test("PATCH /api/admin/users/:id → 200", async () => {
		const res = await app.request("/api/admin/users/u1", { method: "PATCH" });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.id).toBe("u1");
	});
});

describe("Rutas admin — RBAC por rol", () => {
	test("author puede crear recursos", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const res = await app.request("/api/admin/resources", { method: "POST" });
		expect(res.status).toBe(201);
	});

	test("author no puede eliminar recursos", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const res = await app.request("/api/admin/resources/abc", { method: "DELETE" });
		expect(res.status).toBe(403);
	});

	test("reader no puede crear recursos", async () => {
		const app = createAdminApp({ id: "1", role: "reader" });
		const res = await app.request("/api/admin/resources", { method: "POST" });
		expect(res.status).toBe(403);
	});

	test("curator puede cambiar estado editorial", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const res = await app.request("/api/admin/resources/abc/status", { method: "PATCH" });
		expect(res.status).toBe(200);
	});

	test("author no puede cambiar estado editorial", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const res = await app.request("/api/admin/resources/abc/status", { method: "PATCH" });
		expect(res.status).toBe(403);
	});

	test("solo admin puede gestionar usuarios", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(403);
	});
});
