import { beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { Hono } from "hono";
import { adminRoutes } from "./admin.ts";
import { uploadRoutes } from "./uploads.ts";
import type { AuthEnv } from "../auth/middleware.ts";
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";

function createUploadApp(mockUser: Record<string, unknown> | null = null) {
	const app = new Hono<AuthEnv>();
	app.use("*", async (c, next) => {
		c.set("user", mockUser as AuthEnv["Variables"]["user"]);
		c.set("session", mockUser ? ({ id: "s" } as AuthEnv["Variables"]["session"]) : null);
		await next();
	});
	app.route("/api/uploads", uploadRoutes);
	app.route("/api/admin", adminRoutes);
	return app;
}

function encodeMetadata(entries: Record<string, string>) {
	return Object.entries(entries)
		.map(([key, value]) => `${key} ${Buffer.from(value).toString("base64")}`)
		.join(",");
}

describe("Rutas uploads — tus resumable", () => {
	beforeAll(async () => {
		process.env.UPLOAD_STORAGE_DIR = await mkdtemp(path.join(tmpdir(), "procomeka-uploads-"));
	});

	test("POST + PATCH crean sesión de upload y media item final", async () => {
		const app = createUploadApp({ id: "upload-author", role: "author", email: "author@example.com", name: "Author" });
		const db = getDb().db;

		await repo.ensureUser(db, {
			id: "upload-author",
			email: "author@example.com",
			name: "Author",
			role: "author",
		});
		const resource = await repo.createResource(db, {
			title: `Recurso upload ${crypto.randomUUID()}`,
			description: "desc",
			language: "es",
			license: "cc-by",
			resourceType: "video",
			createdBy: "upload-author",
		});

		const createRes = await app.request("/api/uploads", {
			method: "POST",
			headers: {
				"Tus-Resumable": "1.0.0",
				"Upload-Length": "11",
				"Upload-Metadata": encodeMetadata({
					resourceId: resource.id,
					filename: "video-demo.mp4",
					mimeType: "video/mp4",
				}),
			},
		});
		expect(createRes.status).toBe(201);
		const location = createRes.headers.get("location");
		expect(location).toBeTruthy();

		const patchRes = await app.request(location!, {
			method: "PATCH",
			headers: {
				"Tus-Resumable": "1.0.0",
				"Upload-Offset": "0",
				"Content-Type": "application/offset+octet-stream",
			},
			body: "hola mundo!",
		});
		expect(patchRes.status).toBe(204);

		const uploadsRes = await app.request(`/api/admin/resources/${resource.id}/uploads`);
		expect(uploadsRes.status).toBe(200);
		const uploads = await uploadsRes.json();
		expect(uploads.length).toBe(1);
		expect(uploads[0].status).toBe("completed");

		const mediaRes = await app.request(`/api/admin/resources/${resource.id}/media`);
		expect(mediaRes.status).toBe(200);
		const media = await mediaRes.json();
		expect(media.length).toBe(1);
		expect(media[0].filename).toBe("video-demo.mp4");
	});

	test("DELETE cancela una subida incompleta", async () => {
		const app = createUploadApp({ id: "upload-curator", role: "curator", email: "curator@example.com", name: "Curator" });
		const db = getDb().db;

		await repo.ensureUser(db, {
			id: "upload-curator",
			email: "curator@example.com",
			name: "Curator",
			role: "curator",
		});
		const resource = await repo.createResource(db, {
			title: `Recurso cancel ${crypto.randomUUID()}`,
			description: "desc",
			language: "es",
			license: "cc-by",
			resourceType: "documento",
			createdBy: "upload-curator",
		});

		const createRes = await app.request("/api/uploads", {
			method: "POST",
			headers: {
				"Tus-Resumable": "1.0.0",
				"Upload-Length": "5",
				"Upload-Metadata": encodeMetadata({
					resourceId: resource.id,
					filename: "dataset.csv",
					mimeType: "text/csv",
				}),
			},
		});
		const location = createRes.headers.get("location");
		expect(location).toBeTruthy();

		const deleteRes = await app.request(location!, {
			method: "DELETE",
			headers: {
				"Tus-Resumable": "1.0.0",
			},
		});
		expect(deleteRes.status).toBe(204);

		const uploads = await repo.listUploadSessionsForResource(db, resource.id);
		expect(uploads[0]?.status).toBe("cancelled");
	});
});
