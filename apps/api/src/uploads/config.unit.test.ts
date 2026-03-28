import { describe, expect, test } from "bun:test";
import {
	buildUploadPublicUrl,
	buildUploadStorageKey,
	canManageResourceUpload,
	extractFileExtension,
	getUploadConfig,
	sanitizeFilename,
	validateUploadCandidate,
} from "./config.ts";

describe("upload config helpers", () => {
	test("usa defaults conservadores cuando no hay env", () => {
		const config = getUploadConfig({});
		expect(config.maxFileSizeBytes).toBe(10 * 1024 * 1024 * 1024);
		expect(config.maxFilesPerBatch).toBe(20);
		expect(config.maxConcurrentPerUser).toBe(3);
		expect(config.allowedExtensions.includes(".pdf")).toBe(true);
	});

	test("sanitiza nombres de archivo para storage", () => {
		expect(sanitizeFilename("Vídeo final 2026!!.mp4")).toBe("Video-final-2026-.mp4");
		expect(extractFileExtension("paquete.SCORM")).toBe(".scorm");
	});

	test("valida extensión, mime y tamaño", () => {
		const config = getUploadConfig({});
		expect(validateUploadCandidate(config, { filename: "video.mp4", mimeType: "video/mp4", fileSize: 1024 }).ok).toBe(true);
		expect(validateUploadCandidate(config, { filename: "malware.exe", mimeType: "application/octet-stream", fileSize: 1024 }).ok).toBe(false);
		expect(validateUploadCandidate(config, { filename: "sin-extension", mimeType: "video/mp4", fileSize: 1024 }).ok).toBe(false);
		expect(validateUploadCandidate(config, { filename: "video.mp4", mimeType: "", fileSize: 1024 }).ok).toBe(false);
		expect(validateUploadCandidate(config, { filename: "video.mp4", fileSize: 1024 }).ok).toBe(false);
		expect(validateUploadCandidate(config, { filename: "dataset.csv", mimeType: "text/csv", fileSize: config.maxFileSizeBytes + 1 }).ok).toBe(false);
	});

	test("aplica permisos de upload por rol", () => {
		const resource = { createdBy: "author-1", assignedCuratorId: "curator-1" };
		expect(canManageResourceUpload({ id: "admin-1", role: "admin" }, resource)).toBe(true);
		expect(canManageResourceUpload({ id: "curator-1", role: "curator" }, resource)).toBe(true);
		expect(canManageResourceUpload({ id: "author-1", role: "author" }, resource)).toBe(true);
		expect(canManageResourceUpload({ id: "reader-1", role: "reader" }, resource)).toBe(false);
	});

	test("genera claves de storage y urls públicas estables", () => {
		expect(buildUploadStorageKey("res-1", "upload-1", "Vídeo final.mp4")).toBe("resource/res-1/upload-1/Video-final.mp4");
		expect(buildUploadPublicUrl("upload-1")).toBe("/api/v1/uploads/upload-1/content");
	});
});
