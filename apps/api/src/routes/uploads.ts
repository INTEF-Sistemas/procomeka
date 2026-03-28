import { readFile } from "node:fs/promises";
import { FileStore } from "@tus/file-store";
import { EVENTS, Server } from "@tus/server";
import { Hono, type Context } from "hono";
import type { AuthEnv } from "../auth/middleware.ts";
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";
import {
	buildUploadPublicUrl,
	buildUploadStorageKey,
	canManageResourceUpload,
	computeFileSha256,
	ensureUploadStorageDir,
	getUploadConfig,
	resolveStoredFilePath,
	type UploadUser,
	validateUploadCandidate,
} from "../uploads/config.ts";

const USER_HEADER = "x-procomeka-upload-user";

let tusServerPromise: Promise<Server> | null = null;

function encodeUser(user: UploadUser | null) {
	return user ? Buffer.from(JSON.stringify(user)).toString("base64url") : "";
}

function decodeUser(req: Request): UploadUser | null {
	const raw = req.headers.get(USER_HEADER);
	if (!raw) return null;
	try {
		return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as UploadUser;
	} catch {
		return null;
	}
}

function withUserHeader(request: Request, user: UploadUser | null) {
	const headers = new Headers(request.headers);
	if (user) headers.set(USER_HEADER, encodeUser(user));
	const init: RequestInit & { duplex?: "half" } = {
		method: request.method,
		headers,
	};
	if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
		init.body = request.body;
		init.duplex = "half";
	}
	return new Request(request.url, init);
}

async function getTusServer() {
	if (tusServerPromise) return tusServerPromise;

	tusServerPromise = (async () => {
		const config = getUploadConfig();
		await ensureUploadStorageDir(config);

		const server = new Server({
			path: "/api/uploads",
			datastore: new FileStore({ directory: config.storageDir, expirationPeriodInMilliseconds: config.sessionTtlMs }),
			maxSize: config.maxFileSizeBytes,
			relativeLocation: true,
			allowedCredentials: true,
			allowedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:4321"],
			disableTerminationForFinishedUploads: true,
			async onIncomingRequest(req, uploadId) {
				if (req.method === "OPTIONS") return;

				const user = decodeUser(req);
				if (!user) {
					throw { status_code: 401, body: "No autenticado" };
				}

				if (req.method === "POST") return;

				const session = await repo.getUploadSessionById(getDb().db, uploadId);
				if (!session) {
					throw { status_code: 404, body: "Upload no encontrado" };
				}

				const resource = await repo.getResourceById(getDb().db, session.resourceId);
				if (!resource || !canManageResourceUpload(user, resource)) {
					throw { status_code: 403, body: "Permisos insuficientes" };
				}
			},
			async onUploadCreate(req, upload) {
				const user = decodeUser(req);
				if (!user) {
					throw { status_code: 401, body: "No autenticado" };
				}

				const resourceId = upload.metadata.resourceId;
				const originalFilename = upload.metadata.filename;
				const mimeType = upload.metadata.mimeType || "application/octet-stream";
				const checksumAlgorithm = upload.metadata.checksumAlgorithm ?? null;
				const finalChecksum = upload.metadata.finalChecksum ?? null;

				if (!resourceId || !originalFilename) {
					throw { status_code: 400, body: "Upload-Metadata incompleta" };
				}

				const resource = await repo.getResourceById(getDb().db, resourceId);
				if (!resource) {
					throw { status_code: 404, body: "Recurso no encontrado" };
				}
				if (!canManageResourceUpload(user, resource)) {
					throw { status_code: 403, body: "Permisos insuficientes" };
				}

				const validation = validateUploadCandidate(config, {
					filename: originalFilename,
					mimeType,
					fileSize: upload.size ?? null,
				});
				if (!validation.ok) {
					throw { status_code: 400, body: validation.error ?? "Upload inválido" };
				}

				await repo.ensureUser(getDb().db, {
					id: user.id,
					email: user.email ?? `${user.id}@local.invalid`,
					name: user.name ?? null,
					role: user.role ?? "reader",
				});

				await repo.createUploadSession(getDb().db, {
					id: upload.id,
					resourceId,
					ownerId: user.id,
					originalFilename,
					mimeType,
					storageKey: buildUploadStorageKey(resourceId, upload.id, originalFilename),
					checksumAlgorithm,
					finalChecksum,
					declaredSize: upload.size ?? null,
					expiresAt: new Date(Date.now() + config.sessionTtlMs),
				});

				return {
					metadata: {
						...upload.metadata,
						ownerId: user.id,
						publicUrl: buildUploadPublicUrl(upload.id),
					},
				};
			},
			async onUploadFinish(_req, upload) {
				const session = await repo.getUploadSessionById(getDb().db, upload.id);
				if (!session) {
					throw { status_code: 404, body: "Upload no encontrado" };
				}

				if (session.mediaItemId) {
					return {};
				}

				const finalPath = resolveStoredFilePath(config, upload.id);
				const finalChecksum = await computeFileSha256(finalPath);
				if (session.finalChecksum && finalChecksum !== session.finalChecksum) {
					await repo.failUploadSession(getDb().db, upload.id, {
						code: "checksum_mismatch",
						message: "Checksum final inválido",
					});
					throw { status_code: 400, body: "Checksum final inválido" };
				}

				const media = await repo.createMediaItem(getDb().db, {
					resourceId: session.resourceId,
					type: "file",
					mimeType: session.mimeType,
					url: buildUploadPublicUrl(upload.id),
					fileSize: upload.size ?? session.declaredSize ?? null,
					filename: session.originalFilename,
					isPrimary: 0,
				});

				await repo.completeUploadSession(getDb().db, upload.id, {
					receivedBytes: upload.size ?? session.receivedBytes ?? 0,
					publicUrl: buildUploadPublicUrl(upload.id),
					mediaItemId: media.id,
					finalChecksum,
				});

				return {
					headers: {
						"Upload-Checksum-Sha256": finalChecksum,
					},
				};
			},
		});

		server.on(EVENTS.POST_RECEIVE, async (_req, upload) => {
			await repo.updateUploadSessionProgress(getDb().db, upload.id, {
				receivedBytes: Number(upload.offset ?? 0),
				status: "uploading",
			});
		});

		server.on(EVENTS.POST_TERMINATE, async (_req, _res, uploadId) => {
			await repo.cancelUploadSession(getDb().db, uploadId);
		});

		return server;
	})();

	return tusServerPromise;
}

export async function terminateUpload(uploadId: string, user: UploadUser | null) {
	const request = new Request(`http://localhost/api/uploads/${uploadId}`, {
		method: "DELETE",
		headers: {
			"Tus-Resumable": "1.0.0",
			[USER_HEADER]: encodeUser(user),
		},
	});
	const server = await getTusServer();
	return server.handleWeb(request);
}

export async function readUploadContent(uploadId: string) {
	const config = getUploadConfig();
	const filePath = resolveStoredFilePath(config, uploadId);
	return readFile(filePath);
}

export const uploadRoutes = new Hono<AuthEnv>();

async function handleTusProxy(c: Context<AuthEnv>) {
	const user = c.get("user");
	if (!user && c.req.method !== "OPTIONS") {
		return c.text("No autenticado", 401);
	}

	const server = await getTusServer();
	const response = await server.handleWeb(withUserHeader(c.req.raw, user));
	return new Response(response.body, {
		status: response.status,
		headers: response.headers,
	});
}

uploadRoutes.all("/", handleTusProxy);
uploadRoutes.all("/*", handleTusProxy);
