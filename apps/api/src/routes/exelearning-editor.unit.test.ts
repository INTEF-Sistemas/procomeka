import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { exelearningEditorRoutes } from "./exelearning-editor.ts";
import { Hono } from "hono";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const app = new Hono();
app.route("/api/v1/exelearning-editor", exelearningEditorRoutes);

const editorDir = path.resolve(import.meta.dir, "../../static/exelearning-editor/static");
const editorAlreadyExists = existsSync(path.join(editorDir, "index.html"));
let createdMockDir = false;

// Create a minimal mock editor if not present (CI environment)
beforeAll(() => {
	if (!editorAlreadyExists) {
		mkdirSync(path.join(editorDir, "app"), { recursive: true });
		writeFileSync(path.join(editorDir, "index.html"), "<html><head></head><body>mock editor</body></html>");
		writeFileSync(path.join(editorDir, "app", "app.bundle.js"), "// mock");
		createdMockDir = true;
	}
});

afterAll(() => {
	if (createdMockDir) {
		rmSync(editorDir, { recursive: true, force: true });
	}
});

describe("GET /api/v1/exelearning-editor/index.html", () => {
	test("inyecta config de embedding", async () => {
		const res = await app.request(
			"/api/v1/exelearning-editor/index.html?elpxUrl=/test.elpx&resourceId=r1",
		);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("__EXE_EMBEDDING_CONFIG__");
		expect(html).toContain("/test.elpx");
		expect(html).toContain("r1");
		expect(html).toContain("<base");
		expect(html).toContain("__PROCOMEKA_CONFIG__");
		expect(res.headers.get("content-type")).toContain("text/html");
		expect(res.headers.get("cache-control")).toBe("no-cache");
	});

	test("inyecta bridge script", async () => {
		const res = await app.request("/api/v1/exelearning-editor/index.html");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("WP_REQUEST_SAVE");
		expect(html).toContain("EXELEARNING_READY");
	});

	test("sin elpxUrl pasa null como initialProjectUrl", async () => {
		const res = await app.request("/api/v1/exelearning-editor/index.html");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("initialProjectUrl: null");
	});
});

describe("GET /api/v1/exelearning-editor/* — static assets", () => {
	test("sirve archivo JS con MIME correcto", async () => {
		const res = await app.request("/api/v1/exelearning-editor/app/app.bundle.js");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("application/javascript");
		expect(res.headers.get("cache-control")).toContain("public");
	});

	test("devuelve 404 para path traversal", async () => {
		const res = await app.request("/api/v1/exelearning-editor/../../../etc/passwd");
		expect(res.status).toBe(404);
	});

	test("devuelve 404 para archivo inexistente", async () => {
		const res = await app.request("/api/v1/exelearning-editor/nonexistent.js");
		expect(res.status).toBe(404);
	});
});
