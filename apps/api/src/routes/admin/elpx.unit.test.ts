import { expect, test, describe } from "bun:test";
import { Hono } from "hono";
import type { AuthEnv } from "../../auth/middleware.ts";
import { elpxAdminRoutes } from "./elpx.ts";
import path from "node:path";
import { readFileSync } from "node:fs";

const FIXTURES_DIR = path.resolve(import.meta.dir, "../../test-fixtures/elpx");

function createElpxApp(mockUser: Record<string, unknown> | null = null) {
	const app = new Hono<AuthEnv>();
	app.use("*", async (c, next) => {
		c.set("user", mockUser as AuthEnv["Variables"]["user"]);
		c.set("session", mockUser ? { id: "s" } as AuthEnv["Variables"]["session"] : null);
		await next();
	});
	app.route("/api/admin/elpx", elpxAdminRoutes);
	return app;
}

describe("POST /api/admin/elpx/analyze", () => {
	const app = createElpxApp({ id: "1", role: "admin" });

	test("analiza un .elpx válido y extrae metadatos", async () => {
		const fixture = path.join(FIXTURES_DIR, "really-simple-test-project.elpx");
		const buf = readFileSync(fixture);
		const file = new File([buf], "really-simple-test-project.elpx", { type: "application/zip" });

		const form = new FormData();
		form.append("file", file);

		const res = await app.request("/api/admin/elpx/analyze", {
			method: "POST",
			body: form,
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
		expect(body.filename).toBe("really-simple-test-project.elpx");
		expect(body.metadata).toBeDefined();
		expect(typeof body.metadata.title).toBe("string");
	});

	test("rechaza si no se envía archivo", async () => {
		const form = new FormData();
		const res = await app.request("/api/admin/elpx/analyze", {
			method: "POST",
			body: form,
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toContain(".elpx");
	});

	test("rechaza extensión no válida", async () => {
		const file = new File(["data"], "test.txt", { type: "text/plain" });
		const form = new FormData();
		form.append("file", file);

		const res = await app.request("/api/admin/elpx/analyze", {
			method: "POST",
			body: form,
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toContain(".elpx");
	});

	test("rechaza archivo ZIP inválido (sin content.xml)", async () => {
		// Create a minimal ZIP with no content.xml
		const file = new File([new Uint8Array(100)], "broken.elpx", { type: "application/zip" });
		const form = new FormData();
		form.append("file", file);

		const res = await app.request("/api/admin/elpx/analyze", {
			method: "POST",
			body: form,
		});
		expect(res.status).toBe(400);
	});
});

describe("POST /api/admin/elpx/analyze — sin auth", () => {
	const app = createElpxApp(null);

	test("requiere autenticación", async () => {
		const form = new FormData();
		form.append("file", new File(["x"], "test.elpx"));

		const res = await app.request("/api/admin/elpx/analyze", {
			method: "POST",
			body: form,
		});
		expect(res.status).toBe(401);
	});
});
