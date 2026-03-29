import { Hono } from "hono";
import { type AuthEnv, requireRole } from "../../auth/middleware.ts";
import { getCurrentUser } from "../../auth/roles.ts";
import { parseElpxMetadata, processElpxUpload, removeElpxExtraction } from "../../services/elpx-processor.ts";
import { getUploadConfig, computeFileSha256, buildUploadPublicUrl } from "../../uploads/config.ts";
import { getDb } from "../../db.ts";
import * as repo from "@procomeka/db/repository";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

function isElpxFile(name: string): boolean {
	const ext = path.extname(name).toLowerCase();
	return ext === ".elpx" || ext === ".elp";
}

export const elpxAdminRoutes = new Hono<AuthEnv>();

elpxAdminRoutes.post("/analyze", requireRole("author"), async (c) => {
	const body = await c.req.parseBody();
	const file = body.file;

	if (!file || !(file instanceof File)) {
		return c.json({ error: "Se requiere un archivo .elpx" }, 400);
	}

	if (!isElpxFile(file.name)) {
		return c.json({ error: "El archivo debe ser .elpx" }, 400);
	}

	const tempPath = path.join(tmpdir(), `procomeka-elpx-${Date.now()}-${file.name}`);
	try {
		const buffer = await file.arrayBuffer();
		await writeFile(tempPath, Buffer.from(buffer));

		const metadata = await parseElpxMetadata(tempPath);
		return c.json({ ok: true, metadata, filename: file.name });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Error al analizar el archivo";
		return c.json({ error: message }, 400);
	} finally {
		await unlink(tempPath).catch(() => {});
	}
});

/**
 * Upload an .elpx file directly to a resource (single-request, no tus).
 * Used by the creation flow to attach the .elpx right after creating the resource.
 */
elpxAdminRoutes.post("/upload/:resourceId", requireRole("author"), async (c) => {
	const user = getCurrentUser(c);
	const { resourceId } = c.req.param();

	const resource = await repo.getResourceById(getDb().db, resourceId);
	if (!resource) return c.json({ error: "Recurso no encontrado" }, 404);

	const body = await c.req.parseBody();
	const file = body.file;
	if (!file || !(file instanceof File)) {
		return c.json({ error: "Se requiere un archivo .elpx" }, 400);
	}

	if (!isElpxFile(file.name)) {
		return c.json({ error: "El archivo debe ser .elpx" }, 400);
	}

	const config = getUploadConfig();
	const uploadId = crypto.randomUUID();

	// Save the raw file to tus storage (so the existing download endpoints work)
	const storagePath = path.join(config.storageDir, uploadId);
	await mkdir(path.dirname(storagePath), { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(storagePath, buffer);

	const checksum = await computeFileSha256(storagePath);

	// Create upload session + media item
	await repo.createUploadSession(getDb().db, {
		id: uploadId,
		resourceId,
		ownerId: user.id,
		originalFilename: file.name,
		mimeType: "application/zip",
		storageKey: `resource/${resourceId}/${uploadId}/${file.name}`,
		declaredSize: file.size,
		expiresAt: null,
	});

	const media = await repo.createMediaItem(getDb().db, {
		resourceId,
		type: "file",
		mimeType: "application/zip",
		url: buildUploadPublicUrl(uploadId),
		fileSize: file.size,
		filename: file.name,
		isPrimary: 1,
	});

	await repo.completeUploadSession(getDb().db, uploadId, {
		receivedBytes: file.size,
		publicUrl: buildUploadPublicUrl(uploadId),
		mediaItemId: media.id,
		finalChecksum: checksum,
	});

	// Process the .elpx (extract + metadata)
	const result = await processElpxUpload(storagePath, config.storageDir);
	await repo.createElpxProject(getDb().db, {
		resourceId,
		hash: result.hash,
		extractPath: result.extractPath,
		originalFilename: file.name,
		uploadSessionId: uploadId,
		version: 3,
		hasPreview: result.hasPreview ? 1 : 0,
		elpxMetadata: JSON.stringify(result.metadata),
	});

	return c.json({
		ok: true,
		uploadId,
		mediaItemId: media.id,
		elpxHash: result.hash,
		hasPreview: result.hasPreview,
		previewUrl: result.hasPreview ? `/api/v1/elpx/${result.hash}/` : null,
	});
});

/**
 * Save an edited .elpx file back to a resource (from the eXeLearning editor).
 * Replaces the existing elpx project, upload session, and media item.
 * Same flow as wp-exelearning's save endpoint.
 */
elpxAdminRoutes.post("/save/:resourceId", requireRole("author"), async (c) => {
	const user = getCurrentUser(c);
	const { resourceId } = c.req.param();

	const resource = await repo.getResourceById(getDb().db, resourceId);
	if (!resource) return c.json({ error: "Recurso no encontrado" }, 404);

	const body = await c.req.parseBody();
	const file = body.file;
	if (!file || !(file instanceof File)) {
		return c.json({ error: "Se requiere un archivo .elpx" }, 400);
	}

	const config = getUploadConfig();
	const filename = file.name || "project.elpx";

	// Find and remove existing elpx project
	const existingElpx = await repo.getElpxProjectByResourceId(getDb().db, resourceId);
	if (existingElpx) {
		await removeElpxExtraction(existingElpx.extractPath).catch(() => {});
		await repo.deleteElpxProject(getDb().db, existingElpx.id);
	}

	// Save new .elpx file to storage
	const uploadId = crypto.randomUUID();
	const storagePath = path.join(config.storageDir, uploadId);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(storagePath, buffer);

	const checksum = await computeFileSha256(storagePath);

	// Create media item + completed upload session (so download works)
	const media = await repo.createMediaItem(getDb().db, {
		resourceId,
		type: "file",
		mimeType: "application/zip",
		url: buildUploadPublicUrl(uploadId),
		fileSize: buffer.byteLength,
		filename,
		isPrimary: 1,
	});

	await repo.createUploadSession(getDb().db, {
		id: uploadId,
		resourceId,
		ownerId: user.id,
		originalFilename: filename,
		mimeType: "application/zip",
		storageKey: `resource/${resourceId}/${uploadId}/${filename}`,
		declaredSize: buffer.byteLength,
		expiresAt: null,
	});

	await repo.completeUploadSession(getDb().db, uploadId, {
		receivedBytes: buffer.byteLength,
		publicUrl: buildUploadPublicUrl(uploadId),
		mediaItemId: media.id,
		finalChecksum: checksum,
	});

	// Process the new .elpx (extract + metadata)
	const result = await processElpxUpload(storagePath, config.storageDir);

	// Create new elpx project record
	await repo.createElpxProject(getDb().db, {
		resourceId,
		hash: result.hash,
		extractPath: result.extractPath,
		originalFilename: filename,
		uploadSessionId: uploadId,
		version: 3,
		hasPreview: result.hasPreview ? 1 : 0,
		elpxMetadata: JSON.stringify(result.metadata),
	});

	return c.json({
		ok: true,
		hash: result.hash,
		hasPreview: result.hasPreview,
		previewUrl: result.hasPreview ? `/api/v1/elpx/${result.hash}/` : null,
		elpxFileUrl: `/api/admin/uploads/${uploadId}/content`,
	});
});
