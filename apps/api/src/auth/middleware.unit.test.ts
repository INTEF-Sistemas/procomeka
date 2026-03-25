import { expect, test, describe } from "bun:test";
import { Hono } from "hono";
import { type AuthEnv, requireAuth, requireRole, sessionMiddleware } from "./middleware.ts";

/** Helper: crea una app Hono con un usuario mock inyectado en el contexto. */
function createTestApp(mockUser: Record<string, unknown> | null = null) {
	const app = new Hono<AuthEnv>();

	// Inyecta usuario mock en vez de llamar a Better Auth
	app.use("*", async (c, next) => {
		c.set("user", mockUser as AuthEnv["Variables"]["user"]);
		c.set("session", mockUser ? { id: "test-session" } as AuthEnv["Variables"]["session"] : null);
		await next();
	});

	return app;
}

describe("requireAuth", () => {
	test("devuelve 401 sin usuario", async () => {
		const app = createTestApp(null);
		app.get("/test", requireAuth, (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(401);
	});

	test("permite acceso con usuario", async () => {
		const app = createTestApp({ id: "1", role: "reader" });
		app.get("/test", requireAuth, (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
	});
});

describe("requireRole", () => {
	test("admin accede a ruta de admin", async () => {
		const app = createTestApp({ id: "1", role: "admin" });
		app.get("/test", requireRole("admin"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
	});

	test("reader no accede a ruta de admin", async () => {
		const app = createTestApp({ id: "1", role: "reader" });
		app.get("/test", requireRole("admin"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(403);
	});

	test("curator accede a ruta de author", async () => {
		const app = createTestApp({ id: "1", role: "curator" });
		app.get("/test", requireRole("author"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
	});

	test("author no accede a ruta de curator", async () => {
		const app = createTestApp({ id: "1", role: "author" });
		app.get("/test", requireRole("curator"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(403);
	});

	test("devuelve 401 sin usuario", async () => {
		const app = createTestApp(null);
		app.get("/test", requireRole("reader"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(401);
	});

	test("lanza error con rol inválido al construir", () => {
		expect(() => requireRole("inexistente")).toThrow("rol desconocido");
	});

	test("usuario sin rol explícito se trata como reader", async () => {
		const app = createTestApp({ id: "1" }); // sin campo role
		app.get("/test", requireRole("reader"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
	});

	test("usuario sin rol no accede a author", async () => {
		const app = createTestApp({ id: "1" }); // sin campo role → reader
		app.get("/test", requireRole("author"), (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(403);
	});
});
