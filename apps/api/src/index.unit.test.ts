import { expect, test, describe, beforeAll } from "bun:test";
import { app } from "./index.ts";
import { createResource, updateEditorialStatus } from "./resources/repository.ts";

let publishedSlug: string;
let draftSlug: string;
let videoSlug: string;
let englishSlug: string;

beforeAll(async () => {
	const draft = await createResource({
		title: "Recurso borrador test",
		description: "Este recurso está en borrador",
		language: "es",
		license: "cc-by",
		resourceType: "documento",
	});
	draftSlug = draft.slug;

	const pub = await createResource({
		title: "Recurso publicado test",
		description: "Este recurso está publicado",
		language: "es",
		license: "cc-by",
		resourceType: "documento",
	});
	publishedSlug = pub.slug;
	await updateEditorialStatus(pub.id, "published", "system");

	const video = await createResource({
		title: "Video publicado test",
		description: "Recurso de video publicado",
		language: "es",
		license: "cc-by-sa",
		resourceType: "video",
	});
	videoSlug = video.slug;
	await updateEditorialStatus(video.id, "published", "system");

	const english = await createResource({
		title: "English lesson resource",
		description: "Published english resource",
		language: "en",
		license: "cc0",
		resourceType: "documento",
	});
	englishSlug = english.slug;
	await updateEditorialStatus(english.id, "published", "system");
});

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

	test("GET /api/v1/resources solo devuelve recursos publicados", async () => {
		const res = await app.request("/api/v1/resources");
		const body = await res.json();
		const slugs = body.data.map((r: { slug: string }) => r.slug);
		expect(slugs).toContain(publishedSlug);
		expect(slugs).not.toContain(draftSlug);
	});

	test("GET /api/v1/resources/:slug devuelve 404 para slug inexistente", async () => {
		const res = await app.request("/api/v1/resources/no-existe-xyz");
		expect(res.status).toBe(404);
	});

	test("GET /api/v1/resources/:slug devuelve 404 para recurso no publicado", async () => {
		const res = await app.request(`/api/v1/resources/${draftSlug}`);
		expect(res.status).toBe(404);
	});

	test("GET /api/v1/resources/:slug devuelve recurso publicado", async () => {
		const res = await app.request(`/api/v1/resources/${publishedSlug}`);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.slug).toBe(publishedSlug);
		expect(body.subjects).toBeDefined();
		expect(body.levels).toBeDefined();
	});

	test("GET /api/v1/resources?q= filtra por búsqueda", async () => {
		const res = await app.request("/api/v1/resources?q=publicado");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body.data)).toBe(true);
	});

	test("GET /api/v1/resources?resourceType= filtra por tipo", async () => {
		const res = await app.request("/api/v1/resources?resourceType=video");
		expect(res.status).toBe(200);
		const body = await res.json();
		const slugs = body.data.map((r: { slug: string }) => r.slug);
		expect(slugs).toContain(videoSlug);
		expect(slugs).not.toContain(publishedSlug);
	});

	test("GET /api/v1/resources?language= filtra por idioma", async () => {
		const res = await app.request("/api/v1/resources?language=en");
		expect(res.status).toBe(200);
		const body = await res.json();
		const slugs = body.data.map((r: { slug: string }) => r.slug);
		expect(slugs).toContain(englishSlug);
		expect(slugs).not.toContain(publishedSlug);
	});

	test("GET /api/v1/resources?license= filtra por licencia", async () => {
		const res = await app.request("/api/v1/resources?license=cc0");
		expect(res.status).toBe(200);
		const body = await res.json();
		const slugs = body.data.map((r: { slug: string }) => r.slug);
		expect(slugs).toContain(englishSlug);
		expect(slugs).not.toContain(videoSlug);
	});

	test("GET /api/v1/resources combina texto y filtros", async () => {
		const res = await app.request("/api/v1/resources?q=English&language=en&license=cc0");
		expect(res.status).toBe(200);
		const body = await res.json();
		const slugs = body.data.map((r: { slug: string }) => r.slug);
		expect(slugs).toContain(englishSlug);
		expect(body.data.every((r: { language: string; license: string }) => r.language === "en" && r.license === "cc0")).toBe(true);
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
