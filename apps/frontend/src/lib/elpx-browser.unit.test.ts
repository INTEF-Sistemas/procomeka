import { describe, test, expect } from "bun:test";
import { parseElpxMetadata, generateElpxId, extractPreviewHtml, extractAllFiles, createPreviewBlobUrl, parseAndPreview, revokePreview } from "./elpx-browser.ts";
import { readFileSync } from "node:fs";
import path from "node:path";

const FIXTURES_DIR = path.resolve(import.meta.dir, "../../../api/src/test-fixtures/elpx");

function fixtureFile(name: string): File {
	const buf = readFileSync(path.join(FIXTURES_DIR, name));
	return new File([buf], name, { type: "application/zip" });
}

describe("parseElpxMetadata", () => {
	test("extrae metadatos de really-simple-test-project.elpx", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const metadata = await parseElpxMetadata(file);

		expect(metadata).toBeDefined();
		expect(typeof metadata.title).toBe("string");
		expect(typeof metadata.description).toBe("string");
		expect(typeof metadata.author).toBe("string");
		expect(typeof metadata.license).toBe("string");
		expect(typeof metadata.language).toBe("string");
		expect(typeof metadata.learningResourceType).toBe("string");
	});

	test("extrae metadatos de propiedades.elpx con título conocido", async () => {
		const file = fixtureFile("propiedades.elpx");
		const metadata = await parseElpxMetadata(file);

		// This fixture has metadata filled in
		expect(metadata.title.length).toBeGreaterThan(0);
	});

	test("lanza error para archivo sin content.xml", async () => {
		// Create a minimal valid ZIP but without content.xml
		// ZIP with just an empty file "dummy.txt"
		const zip = createMinimalZip("dummy.txt", new Uint8Array(0));
		const file = new File([zip], "no-content.elpx", { type: "application/zip" });

		await expect(parseElpxMetadata(file)).rejects.toThrow("content.xml");
	});

	test("lanza error para archivo ZIP inválido", async () => {
		const file = new File([new Uint8Array([0, 1, 2, 3])], "invalid.elpx");
		await expect(parseElpxMetadata(file)).rejects.toThrow();
	});
});

describe("generateElpxId", () => {
	test("genera un UUID válido", () => {
		const id = generateElpxId();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	test("genera IDs únicos cada vez", () => {
		const id1 = generateElpxId();
		const id2 = generateElpxId();
		expect(id1).not.toBe(id2);
	});
});

describe("extractPreviewHtml", () => {
	test("extrae index.html de un .elpx con preview", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const html = await extractPreviewHtml(file);

		expect(html).not.toBeNull();
		expect(html!).toContain("<html");
	});

	test("retorna null para archivo sin index.html", async () => {
		const zip = createMinimalZip("content.xml", new TextEncoder().encode("<ode></ode>"));
		const file = new File([zip], "no-preview.elpx", { type: "application/zip" });
		const html = await extractPreviewHtml(file);

		expect(html).toBeNull();
	});
});

describe("extractAllFiles", () => {
	test("extrae todos los archivos de un .elpx real", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const files = await extractAllFiles(file);

		expect(files.size).toBeGreaterThan(10);
		expect(files.has("index.html")).toBe(true);
		expect(files.has("content.xml")).toBe(true);

		// Check that files have actual content
		const indexHtml = files.get("index.html");
		expect(indexHtml).toBeDefined();
		expect(indexHtml!.length).toBeGreaterThan(100);
	});

	test("incluye CSS, JS y assets del tema", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const files = await extractAllFiles(file);
		const paths = Array.from(files.keys());

		// Should have theme, libs, content directories
		expect(paths.some(p => p.startsWith("libs/"))).toBe(true);
		expect(paths.some(p => p.startsWith("theme/"))).toBe(true);
		expect(paths.some(p => p.endsWith(".css"))).toBe(true);
		expect(paths.some(p => p.endsWith(".js"))).toBe(true);
	});

	test("no incluye directorios (solo archivos)", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const files = await extractAllFiles(file);
		const paths = Array.from(files.keys());

		for (const p of paths) {
			expect(p.endsWith("/")).toBe(false);
		}
	});
});

describe("createPreviewBlobUrl", () => {
	test("genera blob URL de preview para un .elpx real", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const blobUrl = await createPreviewBlobUrl(file);

		expect(blobUrl).not.toBeNull();
		expect(blobUrl!).toMatch(/^blob:/);

		// Fetch the blob URL and verify it's valid HTML with rewritten URLs
		const res = await fetch(blobUrl!);
		const html = await res.text();
		expect(html).toContain("<html");
		// CSS/JS references should be rewritten to blob: URLs
		expect(html).toContain("blob:");

		URL.revokeObjectURL(blobUrl!);
	});

	test("retorna null para .elpx sin index.html", async () => {
		const zip = createMinimalZip("content.xml", new TextEncoder().encode("<ode></ode>"));
		const file = new File([zip], "no-index.elpx", { type: "application/zip" });
		const blobUrl = await createPreviewBlobUrl(file);

		expect(blobUrl).toBeNull();
	});

	test("reescribe rutas relativas de CSS a blob URLs", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const blobUrl = await createPreviewBlobUrl(file);

		const res = await fetch(blobUrl!);
		const html = await res.text();

		// The original index.html has relative paths like libs/bootstrap/bootstrap.min.css
		// After rewriting they should be blob: URLs
		expect(html).not.toContain('href="libs/');
		expect(html).not.toContain('src="libs/');

		URL.revokeObjectURL(blobUrl!);
	});
});

/**
 * Creates a minimal valid ZIP file with a single stored (uncompressed) entry.
 */
describe("parseAndPreview", () => {
	test("returns metadata and preview URL in a single pass", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const result = await parseAndPreview(file);

		expect(result.metadata).toBeDefined();
		expect(typeof result.metadata.title).toBe("string");
		expect(result.previewUrl).not.toBeNull();
		expect(result.previewUrl!).toMatch(/^blob:/);

		revokePreview(result.previewUrl!);
	});

	test("returns null previewUrl when no index.html", async () => {
		const zip = createMinimalZip("content.xml", new TextEncoder().encode(
			'<ode><odeProperty><key>pp_title</key><value>Test</value></odeProperty></ode>'
		));
		const file = new File([zip], "no-index.elpx", { type: "application/zip" });
		const result = await parseAndPreview(file);

		expect(result.metadata.title).toBe("Test");
		expect(result.previewUrl).toBeNull();
	});
});

describe("revokePreview", () => {
	test("revokes blob URL without error", async () => {
		const file = fixtureFile("really-simple-test-project.elpx");
		const url = await createPreviewBlobUrl(file);
		expect(url).not.toBeNull();
		// Should not throw
		revokePreview(url!);
		// Calling again on already-revoked URL should not throw
		revokePreview(url!);
	});
});

function createMinimalZip(filename: string, data: Uint8Array): Uint8Array {
	const enc = new TextEncoder();
	const nameBytes = enc.encode(filename);
	const nameLen = nameBytes.length;
	const dataLen = data.length;

	// CRC32 (simplified — 0 for empty files, or compute for non-empty)
	const crc = crc32(data);

	// Local file header (30 + nameLen + dataLen)
	const localHeader = new Uint8Array(30 + nameLen + dataLen);
	const lv = new DataView(localHeader.buffer);
	lv.setUint32(0, 0x04034b50, true);  // signature
	lv.setUint16(4, 20, true);           // version needed
	lv.setUint16(6, 0, true);            // flags
	lv.setUint16(8, 0, true);            // method: stored
	lv.setUint32(14, crc, true);         // crc32
	lv.setUint32(18, dataLen, true);     // compressed size
	lv.setUint32(22, dataLen, true);     // uncompressed size
	lv.setUint16(26, nameLen, true);     // filename length
	localHeader.set(nameBytes, 30);
	localHeader.set(data, 30 + nameLen);

	const localSize = localHeader.length;

	// Central directory entry (46 + nameLen)
	const cdEntry = new Uint8Array(46 + nameLen);
	const cv = new DataView(cdEntry.buffer);
	cv.setUint32(0, 0x02014b50, true);   // signature
	cv.setUint16(4, 20, true);           // version made by
	cv.setUint16(6, 20, true);           // version needed
	cv.setUint16(10, 0, true);           // method: stored
	cv.setUint32(16, crc, true);         // crc32
	cv.setUint32(20, dataLen, true);     // compressed size
	cv.setUint32(24, dataLen, true);     // uncompressed size
	cv.setUint16(28, nameLen, true);     // filename length
	cv.setUint32(42, 0, true);           // local header offset
	cdEntry.set(nameBytes, 46);

	const cdSize = cdEntry.length;

	// End of central directory (22 bytes)
	const eocd = new Uint8Array(22);
	const ev = new DataView(eocd.buffer);
	ev.setUint32(0, 0x06054b50, true);   // signature
	ev.setUint16(8, 1, true);            // entries on disk
	ev.setUint16(10, 1, true);           // total entries
	ev.setUint32(12, cdSize, true);      // CD size
	ev.setUint32(16, localSize, true);   // CD offset

	// Combine all parts
	const result = new Uint8Array(localSize + cdSize + 22);
	result.set(localHeader, 0);
	result.set(cdEntry, localSize);
	result.set(eocd, localSize + cdSize);
	return result;
}

/** Simple CRC32 implementation for test ZIP creation */
function crc32(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of data) {
		crc ^= byte;
		for (let j = 0; j < 8; j++) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}
