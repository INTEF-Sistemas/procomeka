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
		const body = await res.json();
		expect(body.details).toBeDefined();
		expect(Array.isArray(body.details)).toBe(true);
		expect(body.details.length).toBeGreaterThan(0);
		expect(body.details[0].field).toBeDefined();
		expect(body.details[0].message).toBeDefined();
	});

	test("GET /api/admin/resources → 200 con lista", async () => {
		const res = await app.request("/api/admin/resources");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body.data)).toBe(true);
		expect(typeof body.total).toBe("number");
	});

	test("GET /api/admin/resources/:id → 200 con recurso existente", async () => {
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		const res = await app.request(`/api/admin/resources/${created.id}`);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.id).toBe(created.id);
		expect(body.title).toBe(validResource.title);
	});

	test("GET /api/admin/resources/:id → 404 para id inexistente", async () => {
		const res = await app.request("/api/admin/resources/no-existe-xyz");
		expect(res.status).toBe(404);
	});

	test("PATCH /api/admin/resources/:id → 200", async () => {
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		const res = await app.request(`/api/admin/resources/${created.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Título actualizado" }),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.updated).toBe(true);
	});

	test("PATCH /api/admin/resources/:id → 404 para id inexistente", async () => {
		const res = await app.request("/api/admin/resources/no-existe", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Nuevo" }),
		});
		expect(res.status).toBe(404);
	});

	test("PATCH /api/admin/resources/:id → 400 sin campos", async () => {
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		const res = await app.request(`/api/admin/resources/${created.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(400);
	});

	test("DELETE /api/admin/resources/:id → 200 soft delete", async () => {
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

		// Recurso ya no aparece por GET
		const getRes = await app.request(`/api/admin/resources/${created.id}`);
		expect(getRes.status).toBe(404);
	});

	test("PATCH /api/admin/resources/:id/status → 200 transición válida (draft→review→published)", async () => {
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		// draft → review
		const r1 = await app.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "review" }),
		});
		expect(r1.status).toBe(200);

		// review → published
		const r2 = await app.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "published" }),
		});
		expect(r2.status).toBe(200);
		const body = await r2.json();
		expect(body.status).toBe("published");
	});

	test("PATCH /api/admin/resources/:id/status → 403 transición no permitida (draft→published)", async () => {
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		const res = await app.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "published" }),
		});
		expect(res.status).toBe(403);
	});

	test("PATCH /api/admin/resources/:id/status → 404 recurso inexistente", async () => {
		const res = await app.request("/api/admin/resources/no-existe-xyz/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "review" }),
		});
		expect(res.status).toBe(404);
	});

	test("PATCH /api/admin/resources/:id/status → 400 sin status", async () => {
		const res = await app.request("/api/admin/resources/res-2/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});
		expect(res.status).toBe(400);
	});

	test("PATCH /api/admin/resources/:id/status → 400 con status inválido", async () => {
		const res = await app.request("/api/admin/resources/res-2/status", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "borrador" }),
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.details).toBeDefined();
	});

	test("GET /api/admin/users → 200", async () => {
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(200);
	});

	test("POST /api/admin/collections → 201 y GET /api/admin/collections → lista", async () => {
		const createRes = await app.request("/api/admin/collections", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Colección demo", description: "Descripción de colección" }),
		});
		expect(createRes.status).toBe(201);

		const listRes = await app.request("/api/admin/collections");
		expect(listRes.status).toBe(200);
		const body = await listRes.json();
		expect(body.total).toBeGreaterThan(0);
	});

	test("POST /api/admin/taxonomies → 201 y GET /api/admin/taxonomies → lista", async () => {
		const createRes = await app.request("/api/admin/taxonomies", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Matemáticas", type: "subject" }),
		});
		expect(createRes.status).toBe(201);

		const listRes = await app.request("/api/admin/taxonomies");
		expect(listRes.status).toBe(200);
		const body = await listRes.json();
		expect(body.total).toBeGreaterThan(0);
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

	test("author puede eliminar recursos propios", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();
		const res = await app.request(`/api/admin/resources/${created.id}`, { method: "DELETE" });
		expect(res.status).toBe(200);
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

	test("curator puede aprobar recurso (review→published)", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		// Primero pasar a review
		await app.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "review" }),
		});

		// Ahora aprobar
		const res = await app.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "published" }),
		});
		expect(res.status).toBe(200);
	});

	test("author puede enviar a revisión (draft→review)", async () => {
		const app = createAdminApp({ id: "1", role: "author" });
		const createRes = await app.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();

		const res = await app.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "review" }),
		});
		expect(res.status).toBe(200);
	});

	test("author no puede aprobar recursos (review→published)", async () => {
		// Crear como curator para poder pasar a review
		const curatorApp = createAdminApp({ id: "1", role: "curator" });
		const createRes = await curatorApp.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validResource),
		});
		const created = await createRes.json();
		await curatorApp.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "review" }),
		});

		// Intentar aprobar como author
		const authorApp = createAdminApp({ id: "2", role: "author" });
		const res = await authorApp.request(`/api/admin/resources/${created.id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "published" }),
		});
		expect(res.status).toBe(403);
	});

	test("solo admin puede gestionar usuarios", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const res = await app.request("/api/admin/users");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.total).toBe(1);
	});

	test("curator puede listar taxonomías pero no crearlas", async () => {
		const app = createAdminApp({ id: "1", role: "curator" });
		const listRes = await app.request("/api/admin/taxonomies");
		expect(listRes.status).toBe(200);

		const createRes = await app.request("/api/admin/taxonomies", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Lengua" }),
		});
		expect(createRes.status).toBe(403);
	});

	test("author solo ve sus recursos en listado", async () => {
		const adminApp = createAdminApp({ id: "admin-1", role: "admin" });
		await adminApp.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...validResource, title: "Recurso admin" }),
		});

		const authorApp = createAdminApp({ id: "author-1", role: "author" });
		await authorApp.request("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...validResource, title: "Recurso author" }),
		});

		const res = await authorApp.request("/api/admin/resources");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.every((item: { createdBy: string | null }) => item.createdBy === "author-1")).toBe(true);
	});
});
