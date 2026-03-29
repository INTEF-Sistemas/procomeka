/**
 * Unified service for elpx preview operations in static/preview mode.
 * Centralises IndexedDB + PGlite logic so .astro pages and preview-api-client
 * can share a single implementation.
 *
 * All heavy imports are dynamic to keep the main bundle small.
 */

import type { ElpxMetadata } from "@procomeka/db/elpx-metadata";

/** Resolve a preview URL — checks IndexedDB for user blobs, falls back to static URL */
export async function resolveElpxPreviewUrl(hash: string, filename: string): Promise<string | null> {
	const { getFile } = await import("./preview-file-store.ts");
	const storedBlob = await getFile(`elpx-raw:${hash}`);
	if (storedBlob) {
		const { createPreviewBlobUrl } = await import("./elpx-browser.ts");
		const file = new File([storedBlob], filename || "project.elpx", { type: "application/zip" });
		return createPreviewBlobUrl(file);
	}
	const { getBaseUrl } = await import("./paths.ts");
	return `${getBaseUrl()}api/v1/elpx/${hash}/`;
}

/** Save an elpx blob in preview mode (IndexedDB + PGlite). Single-pass extraction. */
export async function saveElpxInPreview(opts: {
	resourceId: string;
	blob: Blob;
	filename: string;
	existingHash?: string;
}): Promise<{ hash: string; previewUrl: string | null; metadata: ElpxMetadata }> {
	const { storeFile } = await import("./preview-file-store.ts");
	const { parseAndPreview, generateElpxId } = await import("./elpx-browser.ts");
	const { deleteElpxProject, createElpxProject, getElpxProjectByResourceId } = await import("@procomeka/db/repository");
	const { PreviewApiClient } = await import("./preview-api-client.ts");

	const hash = opts.existingHash || generateElpxId();
	const file = new File([opts.blob], opts.filename, { type: "application/zip" });

	// Single pass: parse metadata + generate preview from the same buffer read
	const [{ metadata, previewUrl }] = await Promise.all([
		parseAndPreview(file),
		storeFile(`elpx-raw:${hash}`, opts.blob),
	]);

	const db = PreviewApiClient.getPreviewDb();
	if (db) {
		const existing = await getElpxProjectByResourceId(db, opts.resourceId);
		if (existing) await deleteElpxProject(db, existing.id);
		await createElpxProject(db, {
			resourceId: opts.resourceId,
			hash,
			extractPath: "",
			originalFilename: opts.filename,
			hasPreview: previewUrl ? 1 : 0,
			elpxMetadata: JSON.stringify(metadata),
		});
	}

	return { hash, previewUrl, metadata };
}

/** Load elpx blob for the editor — from IndexedDB or static URL */
export async function loadElpxBlob(hash: string, staticFileUrl?: string | null): Promise<Blob | null> {
	const { getFile } = await import("./preview-file-store.ts");
	const blob = await getFile(`elpx-raw:${hash}`);
	if (blob) return blob;
	if (staticFileUrl) {
		try {
			const res = await fetch(staticFileUrl);
			if (res.ok) return res.blob();
		} catch { /* file may not exist as static asset */ }
	}
	return null;
}
