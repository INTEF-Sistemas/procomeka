import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import type { ApiClient, MediaItemRecord, UploadSessionRecord } from "./api-client.ts";
import { escapeHtml, formatBytes } from "./resource-display.ts";

export { escapeHtml, formatBytes };

export function extractUploadId(uploadUrl?: string | null) {
	if (!uploadUrl) return null;
	return uploadUrl.split("/").pop() ?? null;
}

export function renderPersistedUploadItem(upload: UploadSessionRecord) {
	const cancellable = !["completed", "cancelled"].includes(upload.status);
	return `<li>
		<strong>${escapeHtml(upload.originalFilename)}</strong>
		<span>${formatBytes(upload.receivedBytes)} / ${formatBytes(upload.declaredSize ?? null)}</span>
		<span class="upload-status upload-status-${escapeHtml(upload.status)}">${escapeHtml(upload.status)}</span>
		${upload.errorMessage ? `<span class="upload-error">${escapeHtml(upload.errorMessage)}</span>` : ""}
		${cancellable ? `<button type="button" data-cancel-upload="${escapeHtml(upload.id)}">Cancelar</button>` : ""}
	</li>`;
}

export function renderMediaItem(item: MediaItemRecord) {
	return `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.filename ?? item.id)}</a> <span>${formatBytes(item.fileSize ?? null)}</span></li>`;
}

export function renderQueueItem(file: {
	id: string;
	name?: string | null;
	size?: number | null;
	error?: string | null;
	progress?: { percentage?: number | null };
	response?: { uploadURL?: string | null } | null;
}) {
	const progress = Math.round(file.progress?.percentage ?? 0);
	const uploadId = extractUploadId(file.response?.uploadURL ?? undefined);
	return `<li>
		<strong>${escapeHtml(file.name ?? "Archivo")}</strong>
		<span>${formatBytes(file.size ?? null)}</span>
		<progress max="100" value="${progress}"></progress>
		<span>${progress}%</span>
		${file.error ? `<span class="upload-error">${escapeHtml(file.error)}</span>` : ""}
		<button type="button" data-remove-local="${escapeHtml(file.id)}" data-upload-id="${escapeHtml(uploadId ?? "")}">
			${progress >= 100 ? "Quitar" : "Cancelar"}
		</button>
	</li>`;
}

export async function initResourceUploader(args: {
	resourceId: string;
	root: HTMLElement;
	api: ApiClient;
}) {
	const { resourceId, root, api } = args;
	const config = await api.getUploadConfig();
	const picker = root.querySelector<HTMLInputElement>("[data-upload-input]");
	const dropzone = root.querySelector<HTMLElement>("[data-upload-dropzone]");
	const queue = root.querySelector<HTMLElement>("[data-upload-queue]");
	const mediaList = root.querySelector<HTMLElement>("[data-media-list]");
	const persistedList = root.querySelector<HTMLElement>("[data-persisted-uploads]");
	const globalProgress = root.querySelector<HTMLProgressElement>("[data-global-progress]");
	const globalLabel = root.querySelector<HTMLElement>("[data-global-progress-label]");
	const feedback = root.querySelector<HTMLElement>("[data-upload-feedback]");

	if (!picker || !dropzone || !queue || !mediaList || !persistedList || !globalProgress || !globalLabel || !feedback) {
		return null;
	}

	const isPreview = (window as Record<string, unknown>).__PREVIEW_MODE__ === true;

	const uppy = new Uppy({
		autoProceed: true,
		restrictions: {
			maxFileSize: config.maxFileSizeBytes,
			maxNumberOfFiles: config.maxFilesPerBatch,
			allowedFileTypes: [...config.allowedExtensions, ...config.allowedMimeTypes],
		},
	});

	if (isPreview) {
		const { storeFile, deleteFile } = await import("./preview-file-store.ts");
		const { createUploadSession, completeUploadSession, createMediaItem } = await import("@procomeka/db/repository");
		const { PreviewApiClient } = await import("./preview-api-client.ts");
		const session = await args.api.getSession().catch(() => null);
		const ownerId = session?.user?.id ?? "demo-admin";

		uppy.addUploader(async (fileIDs) => {
			const db = PreviewApiClient.getPreviewDb();
			if (!db) return;

			for (const fileID of fileIDs) {
				const file = uppy.getFile(fileID);
				if (!file?.data) continue;

				const uploadId = crypto.randomUUID();
				const blob = file.data instanceof Blob ? file.data : new Blob([file.data]);

				try {
					await storeFile(uploadId, blob);
					await createUploadSession(db, {
						id: uploadId,
						resourceId,
						ownerId,
						originalFilename: file.name ?? "file",
						mimeType: file.type ?? "application/octet-stream",
						storageKey: `preview/${uploadId}`,
						declaredSize: file.size ?? 0,
					});
					const mediaResult = await createMediaItem(db, {
						resourceId,
						type: "file",
						mimeType: file.type ?? "application/octet-stream",
						url: `/preview-files/${uploadId}`,
						fileSize: file.size ?? 0,
						filename: file.name ?? "file",
					});
					await completeUploadSession(db, uploadId, {
						receivedBytes: file.size ?? 0,
						publicUrl: `/preview-files/${uploadId}`,
						mediaItemId: mediaResult.id,
					});

					uppy.emit("upload-progress", uppy.getFile(fileID), { bytesUploaded: file.size ?? 0, bytesTotal: file.size ?? 0 });
					uppy.emit("upload-success", uppy.getFile(fileID), { uploadURL: `/preview-files/${uploadId}` });
				} catch (err) {
					await deleteFile(uploadId).catch(() => {});
					uppy.emit("upload-error", uppy.getFile(fileID), err instanceof Error ? err : new Error(String(err)));
				}
			}
		});
	} else {
		uppy.use(Tus, {
			endpoint: "/api/uploads",
			withCredentials: true,
			chunkSize: config.chunkSizeBytes,
			retryDelays: [0, 1000, 3000, 5000],
			allowedMetaFields: ["resourceId", "filename", "mimeType"],
		});
	}

	async function refreshPersisted() {
		const [uploads, mediaItems] = await Promise.all([
			api.listResourceUploads(resourceId),
			api.listResourceMediaItems(resourceId),
		]);

		persistedList.innerHTML = uploads.length
			? uploads
				.map((upload) => renderPersistedUploadItem(upload))
				.join("")
			: "<li>No hay uploads recientes.</li>";

		mediaList.innerHTML = mediaItems.length
			? mediaItems
				.map((item) => renderMediaItem(item))
				.join("")
			: "<li>No hay archivos adjuntos todavía.</li>";
	}

	function renderLocalQueue() {
		const files = uppy.getFiles();
		queue.innerHTML = files.length
			? files
				.map((file) => renderQueueItem(file))
				.join("")
			: "<li>No hay archivos en cola.</li>";

		const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
		const uploadedBytes = files.reduce((sum, file) => {
			const percentage = (file.progress?.percentage ?? 0) / 100;
			return sum + Math.round((file.size ?? 0) * percentage);
		}, 0);
		const globalPercentage = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
		globalProgress.value = globalPercentage;
		globalLabel.textContent = totalBytes > 0
			? `${globalPercentage}% subido (${formatBytes(uploadedBytes)} / ${formatBytes(totalBytes)})`
			: "Sin subidas activas";
	}

	async function addFiles(files: FileList | File[]) {
		const entries = Array.from(files);
		if (entries.length > config.maxFilesPerBatch) {
			feedback.textContent = `Solo se permiten ${config.maxFilesPerBatch} archivos por lote.`;
			feedback.className = "upload-feedback error";
			return;
		}

		for (const file of entries) {
			try {
				uppy.addFile({
					name: file.name,
					type: file.type,
					data: file,
					meta: {
						resourceId,
						filename: file.name,
						mimeType: file.type,
					},
				});
			} catch (error) {
				feedback.textContent = error instanceof Error ? error.message : "No se pudo añadir el archivo";
				feedback.className = "upload-feedback error";
			}
		}
		renderLocalQueue();
	}

	picker.addEventListener("change", async () => {
		if (picker.files?.length) {
			await addFiles(picker.files);
			picker.value = "";
		}
	});

	dropzone.addEventListener("dragover", (event) => {
		event.preventDefault();
		dropzone.classList.add("is-dragover");
	});
	dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
	dropzone.addEventListener("drop", async (event) => {
		event.preventDefault();
		dropzone.classList.remove("is-dragover");
		if (event.dataTransfer?.files?.length) {
			await addFiles(event.dataTransfer.files);
		}
	});

	queue.addEventListener("click", async (event) => {
		const target = event.target as HTMLElement | null;
		const fileId = target?.getAttribute("data-remove-local");
		if (!fileId) return;
		const uploadId = target.getAttribute("data-upload-id");
		uppy.removeFile(fileId);
		if (uploadId) {
			await api.cancelUpload(uploadId).catch(() => {});
			await refreshPersisted();
		}
		renderLocalQueue();
	});

	persistedList.addEventListener("click", async (event) => {
		const target = event.target as HTMLElement | null;
		const uploadId = target?.getAttribute("data-cancel-upload");
		if (!uploadId) return;
		await api.cancelUpload(uploadId);
		await refreshPersisted();
	});

	uppy.on("file-added", renderLocalQueue);
	uppy.on("upload-progress", renderLocalQueue);
	uppy.on("upload-success", async () => {
		feedback.textContent = "Archivo subido correctamente.";
		feedback.className = "upload-feedback success";
		renderLocalQueue();
		await refreshPersisted();
	});
	uppy.on("upload-error", (_file, error) => {
		feedback.textContent = error?.message ?? "Error durante la subida";
		feedback.className = "upload-feedback error";
		renderLocalQueue();
	});
	uppy.on("file-removed", renderLocalQueue);

	window.addEventListener("beforeunload", (event) => {
		const hasActiveUploads = uppy.getFiles().some((file) => (file.progress?.uploadComplete ?? false) === false);
		if (!hasActiveUploads) return;
		event.preventDefault();
		event.returnValue = "";
	});

	await refreshPersisted();
	renderLocalQueue();

	return {
		destroy() {
			uppy.destroy();
		},
	};
}
