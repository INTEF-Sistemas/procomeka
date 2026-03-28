import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export type UploadUser = {
	id: string;
	role?: string | null;
	email?: string | null;
	name?: string | null;
};

export type UploadTargetResource = {
	id?: string;
	createdBy?: string | null;
	assignedCuratorId?: string | null;
};

const DEFAULT_ALLOWED_EXTENSIONS = [
	".pdf",
	".doc",
	".docx",
	".ppt",
	".pptx",
	".zip",
	".scorm",
	".elp",
	".elpx",
	".mp4",
	".mp3",
	".wav",
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".csv",
	".json",
];

const DEFAULT_ALLOWED_MIME_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/octet-stream",
	"application/zip",
	"application/x-zip-compressed",
	"application/json",
	"text/csv",
	"video/mp4",
	"audio/mpeg",
	"audio/wav",
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
];

function parseNumberEnv(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCsvEnv(value: string | undefined, fallback: string[]) {
	const items = value?.split(",").map((entry) => entry.trim()).filter(Boolean);
	return items?.length ? items : fallback;
}

export function getUploadConfig(env: Record<string, string | undefined> = process.env) {
	return {
		maxFileSizeBytes: parseNumberEnv(env.UPLOAD_MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024 * 1024),
		maxFilesPerBatch: parseNumberEnv(env.UPLOAD_MAX_FILES_PER_BATCH, 20),
		maxConcurrentPerUser: parseNumberEnv(env.UPLOAD_MAX_CONCURRENT_PER_USER, 3),
		chunkSizeBytes: parseNumberEnv(env.UPLOAD_CHUNK_SIZE_BYTES, 5 * 1024 * 1024),
		sessionTtlMs: parseNumberEnv(env.UPLOAD_SESSION_TTL_MS, 24 * 60 * 60 * 1000),
		allowedMimeTypes: parseCsvEnv(env.UPLOAD_ALLOWED_MIME_TYPES, DEFAULT_ALLOWED_MIME_TYPES),
		allowedExtensions: parseCsvEnv(env.UPLOAD_ALLOWED_EXTENSIONS, DEFAULT_ALLOWED_EXTENSIONS),
		storageDir: env.UPLOAD_STORAGE_DIR ?? path.join(process.cwd(), "local-data", "uploads"),
	};
}

export function sanitizeFilename(filename: string) {
	return filename
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 180) || "archivo";
}

export function extractFileExtension(filename: string) {
	return path.extname(filename).toLowerCase();
}

export function canManageResourceUpload(user: UploadUser, resource: UploadTargetResource) {
	const role = user.role ?? "reader";
	if (role === "admin") return true;
	if (role === "curator") {
		return resource.createdBy === user.id || resource.assignedCuratorId === user.id;
	}
	if (role === "author") {
		return resource.createdBy === user.id;
	}
	return false;
}

export function validateUploadCandidate(
	config: ReturnType<typeof getUploadConfig>,
	data: { filename: string; mimeType?: string | null; fileSize?: number | null },
) {
	if (!data.filename.trim()) {
		return { ok: false, error: "El nombre del archivo es obligatorio" };
	}

	const extension = extractFileExtension(data.filename);
	if (!extension) {
		return { ok: false, error: "El archivo debe incluir una extensión permitida" };
	}
	if (!config.allowedExtensions.includes(extension)) {
		return { ok: false, error: `Extensión no permitida: ${extension}` };
	}

	if (!data.mimeType?.trim()) {
		return { ok: false, error: "El tipo MIME es obligatorio" };
	}
	if (!config.allowedMimeTypes.includes(data.mimeType)) {
		return { ok: false, error: `Tipo MIME no permitido: ${data.mimeType}` };
	}

	if (data.fileSize && data.fileSize > config.maxFileSizeBytes) {
		return { ok: false, error: "El archivo supera el límite configurado" };
	}

	return { ok: true, error: null };
}

export function buildUploadStorageKey(resourceId: string, uploadId: string, filename: string) {
	return path.posix.join("resource", resourceId, uploadId, sanitizeFilename(filename));
}

export function buildUploadPublicUrl(uploadId: string) {
	return `/api/v1/uploads/${uploadId}/content`;
}

export function resolveStoredFilePath(config: ReturnType<typeof getUploadConfig>, uploadId: string) {
	return path.join(config.storageDir, uploadId);
}

export async function ensureUploadStorageDir(config: ReturnType<typeof getUploadConfig>) {
	await mkdir(config.storageDir, { recursive: true });
}

export async function computeFileSha256(filePath: string) {
	return new Promise<string>((resolve, reject) => {
		const hash = createHash("sha256");
		const stream = createReadStream(filePath);
		stream.on("data", (chunk) => hash.update(chunk));
		stream.on("end", () => resolve(hash.digest("hex")));
		stream.on("error", reject);
	});
}
