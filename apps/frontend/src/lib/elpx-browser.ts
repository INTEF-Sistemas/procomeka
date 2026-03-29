/**
 * Client-side .elpx parser for preview/static mode.
 * Extracts content.xml from the ZIP and parses eXeLearning metadata.
 * Uses the ZIP central directory for robust parsing (handles data descriptors, etc.).
 */

import { parseContentXml } from "@procomeka/db/elpx-metadata";
import type { ElpxMetadata } from "@procomeka/db/elpx-metadata";

export type { ElpxMetadata };

/** Find End of Central Directory record by scanning backwards */
function findEOCD(buf: Uint8Array): number {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	// Scan backwards for EOCD signature 0x06054b50
	for (let i = buf.length - 22; i >= 0 && i >= buf.length - 65536; i--) {
		if (view.getUint32(i, true) === 0x06054b50) return i;
	}
	return -1;
}

interface CentralDirEntry {
	name: string;
	method: number;
	compressedSize: number;
	uncompressedSize: number;
	localHeaderOffset: number;
}

const utf8 = new TextDecoder();

/** Parse central directory entries */
function parseCentralDirectory(buf: Uint8Array, eocdOffset: number): CentralDirEntry[] {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	const cdOffset = view.getUint32(eocdOffset + 16, true);
	const cdCount = view.getUint16(eocdOffset + 10, true);
	const entries: CentralDirEntry[] = [];
	let pos = cdOffset;

	for (let i = 0; i < cdCount; i++) {
		if (view.getUint32(pos, true) !== 0x02014b50) break;
		const method = view.getUint16(pos + 10, true);
		const compressedSize = view.getUint32(pos + 20, true);
		const uncompressedSize = view.getUint32(pos + 24, true);
		const nameLen = view.getUint16(pos + 28, true);
		const extraLen = view.getUint16(pos + 30, true);
		const commentLen = view.getUint16(pos + 32, true);
		const localHeaderOffset = view.getUint32(pos + 42, true);
		const name = utf8.decode(buf.slice(pos + 46, pos + 46 + nameLen));
		entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset });
		pos += 46 + nameLen + extraLen + commentLen;
	}
	return entries;
}

/** Extract raw file data from a local file header */
function extractLocalFileData(buf: Uint8Array, entry: CentralDirEntry): Uint8Array {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	const nameLen = view.getUint16(entry.localHeaderOffset + 26, true);
	const extraLen = view.getUint16(entry.localHeaderOffset + 28, true);
	const dataStart = entry.localHeaderOffset + 30 + nameLen + extraLen;
	return buf.slice(dataStart, dataStart + entry.compressedSize);
}

/** Decompress deflate-raw data using browser DecompressionStream */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
	const ds = new DecompressionStream("deflate-raw");
	const writer = ds.writable.getWriter();
	writer.write(data);
	writer.close();
	const reader = ds.readable.getReader();
	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}
	const total = chunks.reduce((n, c) => n + c.length, 0);
	const result = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}

/** Extract a single file from a ZIP buffer by name */
async function extractFileFromZip(buf: Uint8Array, targetName: string): Promise<Uint8Array | null> {
	const eocd = findEOCD(buf);
	if (eocd < 0) throw new Error("Archivo ZIP inválido (no se encontró EOCD)");

	const entries = parseCentralDirectory(buf, eocd);
	const entry = entries.find((e) => e.name === targetName);
	if (!entry) return null;

	const raw = extractLocalFileData(buf, entry);
	if (entry.method === 0) return raw; // stored
	if (entry.method === 8) return inflateRaw(raw); // deflate
	throw new Error(`Método de compresión no soportado: ${entry.method}`);
}

/** Parse metadata from a pre-read buffer */
async function parseMetadataFromBuffer(buf: Uint8Array): Promise<ElpxMetadata> {
	const contentXml = await extractFileFromZip(buf, "content.xml");
	if (!contentXml) throw new Error("No se encontró content.xml en el archivo .elpx");
	return parseContentXml(new TextDecoder().decode(contentXml));
}

/**
 * Parse .elpx metadata from a File object entirely in the browser.
 */
export async function parseElpxMetadata(file: File): Promise<ElpxMetadata> {
	return parseMetadataFromBuffer(new Uint8Array(await file.arrayBuffer()));
}

/**
 * Generate a unique ID for an elpx upload.
 * Just a UUID — used as directory name and DB key.
 */
export function generateElpxId(): string {
	return crypto.randomUUID();
}

/**
 * Extract the HTML preview (index.html) from a .elpx file.
 * Returns null if no index.html found.
 */
export async function extractPreviewHtml(file: File): Promise<string | null> {
	const buf = new Uint8Array(await file.arrayBuffer());
	const indexHtml = await extractFileFromZip(buf, "index.html");
	if (!indexHtml) return null;
	return new TextDecoder().decode(indexHtml);
}

// --- Full extraction for preview generation ---

const MIME_TYPES: Record<string, string> = {
	html: "text/html", htm: "text/html", js: "application/javascript", mjs: "application/javascript",
	css: "text/css", json: "application/json", xml: "application/xml", dtd: "application/xml-dtd",
	png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
	svg: "image/svg+xml", webp: "image/webp", ico: "image/x-icon",
	woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
	mp3: "audio/mpeg", mp4: "video/mp4", webm: "video/webm", wav: "audio/wav",
	pdf: "application/pdf", zip: "application/zip", txt: "text/plain", map: "application/json",
};

function guessMime(filepath: string): string {
	const ext = filepath.split(".").pop()?.toLowerCase() ?? "";
	return MIME_TYPES[ext] || "application/octet-stream";
}

function resolvePath(base: string, relative: string): string {
	if (!relative || relative.startsWith("/")) return relative;
	const parts = base ? base.split("/") : [];
	for (const seg of relative.split("/")) {
		if (seg === "..") parts.pop();
		else if (seg !== ".") parts.push(seg);
	}
	return parts.join("/");
}

/**
 * Extract ALL files from a .elpx ZIP buffer.
 * Skips directories and path traversal entries.
 */
async function extractAllFromBuffer(buf: Uint8Array): Promise<Map<string, Uint8Array>> {
	const eocd = findEOCD(buf);
	if (eocd < 0) throw new Error("Archivo ZIP inválido");

	const entries = parseCentralDirectory(buf, eocd);
	const files = new Map<string, Uint8Array>();

	for (const entry of entries) {
		if (entry.name.endsWith("/") || entry.uncompressedSize === 0) continue;
		if (entry.name.includes("..")) continue;

		const raw = extractLocalFileData(buf, entry);
		if (entry.method === 0) files.set(entry.name, raw);
		else if (entry.method === 8) files.set(entry.name, await inflateRaw(raw));
	}
	return files;
}

/** Public wrapper that reads the file first */
export async function extractAllFiles(file: File): Promise<Map<string, Uint8Array>> {
	return extractAllFromBuffer(new Uint8Array(await file.arrayBuffer()));
}

/** Tracks all blob URLs created for a preview so they can be revoked together */
const previewBlobRegistry = new Map<string, string[]>();

function rewriteCssUrls(css: string, dir: string, blobUrls: Map<string, string>): string {
	return css.replace(
		/url\(\s*["']?(?!data:|https?:|\/\/|#)([^"')]+)["']?\s*\)/gi,
		(_match, relUrl: string) => {
			const resolved = resolvePath(dir, relUrl.split("?")[0].split("#")[0]);
			return blobUrls.has(resolved) ? `url("${blobUrls.get(resolved)}")` : _match;
		},
	);
}

/**
 * Create a self-contained preview blob URL from a .elpx file.
 * Extracts all files, creates blob URLs for assets, and rewrites HTML/CSS references.
 * Call `revokePreview(url)` when the preview is no longer needed to free memory.
 */
export async function createPreviewBlobUrl(file: File): Promise<string | null> {
	const allFiles = await extractAllFromBuffer(new Uint8Array(await file.arrayBuffer()));
	const indexData = allFiles.get("index.html");
	if (!indexData) return null;

	const dec = new TextDecoder();
	const blobUrls = new Map<string, string>();
	const allCreatedUrls: string[] = [];

	const createBlob = (data: BlobPart, type: string): string => {
		const u = URL.createObjectURL(new Blob([data], { type }));
		allCreatedUrls.push(u);
		return u;
	};

	// Non-CSS assets
	for (const [fp, data] of allFiles) {
		if (fp === "index.html") continue;
		const mime = guessMime(fp);
		if (mime !== "text/css") blobUrls.set(fp, createBlob(data, mime));
	}

	// CSS files — rewrite url() references
	for (const [fp, data] of allFiles) {
		if (guessMime(fp) !== "text/css") continue;
		const dir = fp.includes("/") ? fp.slice(0, fp.lastIndexOf("/")) : "";
		blobUrls.set(fp, createBlob(rewriteCssUrls(dec.decode(data), dir, blobUrls), "text/css"));
	}

	// Rewrite index.html
	let html = dec.decode(indexData);
	html = html.replace(
		/(<[^>]+\s)(src|href|poster)(\s*=\s*["'])(?!https?:\/\/|data:|\/\/|#|javascript:|mailto:)([^"']+)(["'])/gi,
		(_m, pre, attr, eq, rawUrl, q) => {
			const u = blobUrls.get(rawUrl.split("?")[0].split("#")[0]);
			return u ? `${pre}${attr}${eq}${u}${q}` : _m;
		},
	);
	html = rewriteCssUrls(html, "", blobUrls);

	const result = createBlob(html, "text/html");
	previewBlobRegistry.set(result, allCreatedUrls);
	return result;
}

/**
 * Revoke ALL blob URLs (assets + HTML) created by a `createPreviewBlobUrl` call.
 */
export function revokePreview(htmlBlobUrl: string): void {
	const urls = previewBlobRegistry.get(htmlBlobUrl);
	if (urls) { for (const u of urls) URL.revokeObjectURL(u); }
	URL.revokeObjectURL(htmlBlobUrl);
	previewBlobRegistry.delete(htmlBlobUrl);
}

/**
 * Parse metadata + generate preview in a single pass (avoids reading the file twice).
 */
export async function parseAndPreview(file: File): Promise<{ metadata: ElpxMetadata; previewUrl: string | null }> {
	const buf = new Uint8Array(await file.arrayBuffer());
	const metadata = await parseMetadataFromBuffer(buf);
	const allFiles = await extractAllFromBuffer(buf);
	const indexData = allFiles.get("index.html");
	if (!indexData) return { metadata, previewUrl: null };

	const dec = new TextDecoder();
	const blobUrls = new Map<string, string>();
	const allCreatedUrls: string[] = [];
	const createBlob = (data: BlobPart, type: string): string => {
		const u = URL.createObjectURL(new Blob([data], { type }));
		allCreatedUrls.push(u);
		return u;
	};

	for (const [fp, data] of allFiles) {
		if (fp === "index.html") continue;
		const mime = guessMime(fp);
		if (mime !== "text/css") blobUrls.set(fp, createBlob(data, mime));
	}
	for (const [fp, data] of allFiles) {
		if (guessMime(fp) !== "text/css") continue;
		const dir = fp.includes("/") ? fp.slice(0, fp.lastIndexOf("/")) : "";
		blobUrls.set(fp, createBlob(rewriteCssUrls(dec.decode(data), dir, blobUrls), "text/css"));
	}
	let html = dec.decode(indexData);
	html = html.replace(
		/(<[^>]+\s)(src|href|poster)(\s*=\s*["'])(?!https?:\/\/|data:|\/\/|#|javascript:|mailto:)([^"']+)(["'])/gi,
		(_m, pre, attr, eq, rawUrl, q) => {
			const u = blobUrls.get(rawUrl.split("?")[0].split("#")[0]);
			return u ? `${pre}${attr}${eq}${u}${q}` : _m;
		},
	);
	html = rewriteCssUrls(html, "", blobUrls);

	const previewUrl = createBlob(html, "text/html");
	previewBlobRegistry.set(previewUrl, allCreatedUrls);
	return { metadata, previewUrl };
}
