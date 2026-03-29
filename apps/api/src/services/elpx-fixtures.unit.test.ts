import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import path from "node:path";
import { mkdir, rm, readdir } from "node:fs/promises";
import os from "node:os";
import { Hono } from "hono";
import {
	parseElpxMetadata,
	processElpxUpload,
	type ElpxMetadata,
} from "./elpx-processor.ts";
import { elpxContentRoutes } from "../routes/elpx-content.ts";

const FIXTURES_DIR = path.join(import.meta.dir, "../test-fixtures/elpx");
const TEMP_DIR = path.join(
	os.tmpdir(),
	"procomeka-elpx-fixture-tests-" + Date.now(),
);

const FIXTURES = [
	"idevice-text.elpx",
	"latex-without-matjax.elpx",
	"latex2.elpx",
	"mermaid.elpx",
	"propiedades.elpx",
	"really-simple-test-project.elpx",
	"un-contenido-de-ejemplo-para-probar-estilos-y-catalogacion.elpx",
];

afterAll(async () => {
	await rm(TEMP_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// parseElpxMetadata with real fixtures
// ---------------------------------------------------------------------------
describe("parseElpxMetadata with real fixtures", { timeout: 30_000 }, () => {
	for (const fixture of FIXTURES) {
		const fixturePath = path.join(FIXTURES_DIR, fixture);

		it(`parses metadata from "${fixture}"`, async () => {
			const metadata = await parseElpxMetadata(fixturePath);

			// All fields must be strings (never null/undefined)
			for (const key of Object.keys(metadata) as (keyof ElpxMetadata)[]) {
				expect(typeof metadata[key]).toBe("string");
			}

			// At least title or description should be non-empty
			const hasContent = metadata.title.length > 0 || metadata.description.length > 0;
			expect(hasContent).toBe(true);

			// Log extracted metadata for debugging visibility
			console.log(`[${fixture}] metadata:`, JSON.stringify(metadata, null, 2));
		});
	}
});

// ---------------------------------------------------------------------------
// processElpxUpload with real fixtures
// ---------------------------------------------------------------------------
describe("processElpxUpload with real fixtures", { timeout: 60_000 }, () => {
	const results: Record<string, Awaited<ReturnType<typeof processElpxUpload>>> = {};

	for (const fixture of FIXTURES) {
		const fixturePath = path.join(FIXTURES_DIR, fixture);
		const fixtureBaseDir = path.join(TEMP_DIR, fixture.replace(/\s+/g, "_"));

		it(`processes "${fixture}" successfully`, { timeout: 60_000 }, async () => {
			await mkdir(fixtureBaseDir, { recursive: true });

			const result = await processElpxUpload(fixturePath, fixtureBaseDir);
			results[fixture] = result;

			// Hash must be a non-empty string (UUID)
			expect(typeof result.hash).toBe("string");
			expect(result.hash.length).toBeGreaterThan(0);

			// extractPath must exist
			const extractPathExists = await Bun.file(
				path.join(result.extractPath, "content.xml"),
			).exists();
			expect(extractPathExists).toBe(true);

			// Verify index.html existence matches hasPreview
			const indexExists = await Bun.file(
				path.join(result.extractPath, "index.html"),
			).exists();
			expect(result.hasPreview).toBe(indexExists);

			// content.xml must always exist in extracted directory
			const contentXmlExists = await Bun.file(
				path.join(result.extractPath, "content.xml"),
			).exists();
			expect(contentXmlExists).toBe(true);

			// Metadata should be populated (all string fields)
			for (const key of Object.keys(result.metadata) as (keyof ElpxMetadata)[]) {
				expect(typeof result.metadata[key]).toBe("string");
			}

			console.log(
				`[${fixture}] hash=${result.hash}, hasPreview=${result.hasPreview}, title="${result.metadata.title}"`,
			);
		});
	}
});

// ---------------------------------------------------------------------------
// metadata content validation
// ---------------------------------------------------------------------------
describe("metadata content validation", { timeout: 30_000 }, () => {
	it('"propiedades.elpx" has title filled', async () => {
		const fixturePath = path.join(FIXTURES_DIR, "propiedades.elpx");
		const metadata = await parseElpxMetadata(fixturePath);

		expect(metadata.title.length).toBeGreaterThan(0);
		expect(metadata.title).toBe("propiedades");

		console.log("[propiedades.elpx] title:", metadata.title);
		console.log("[propiedades.elpx] description:", metadata.description);
	});

	it('"un-contenido-de-ejemplo-para-probar-estilos-y-catalogacion.elpx" has rich metadata', async () => {
		const fixturePath = path.join(
			FIXTURES_DIR,
			"un-contenido-de-ejemplo-para-probar-estilos-y-catalogacion.elpx",
		);
		const metadata = await parseElpxMetadata(fixturePath);

		// This fixture is explicitly for testing catalogation, should have metadata
		expect(metadata.title.length).toBeGreaterThan(0);
		console.log("[catalogacion fixture] metadata:", JSON.stringify(metadata, null, 2));
	});

	it('"mermaid.elpx" has title', async () => {
		const fixturePath = path.join(FIXTURES_DIR, "mermaid.elpx");
		const metadata = await parseElpxMetadata(fixturePath);

		expect(metadata.title.length).toBeGreaterThan(0);
		console.log("[mermaid] title:", metadata.title);
	});

	it("language field contains a reasonable value when present", { timeout: 30_000 }, async () => {
		// Check all fixtures and collect language values
		const languages: Record<string, string> = {};

		for (const fixture of FIXTURES) {
			const fixturePath = path.join(FIXTURES_DIR, fixture);
			const metadata = await parseElpxMetadata(fixturePath);
			if (metadata.language.length > 0) {
				languages[fixture] = metadata.language;
				// Language codes are typically 2-5 chars (e.g., "es", "en", "pt-BR")
				expect(metadata.language.length).toBeLessThanOrEqual(10);
			}
		}

		console.log("Fixtures with language:", languages);
	});

	it("license field is populated when present", { timeout: 30_000 }, async () => {
		const licenses: Record<string, string> = {};

		for (const fixture of FIXTURES) {
			const fixturePath = path.join(FIXTURES_DIR, fixture);
			const metadata = await parseElpxMetadata(fixturePath);
			if (metadata.license.length > 0) {
				licenses[fixture] = metadata.license;
			}
		}

		console.log("Fixtures with license:", licenses);
		// At least one fixture should have a license
		expect(Object.keys(licenses).length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// elpx content proxy integration
// ---------------------------------------------------------------------------
describe("elpx content proxy integration", { timeout: 60_000 }, () => {
	let app: InstanceType<typeof Hono>;
	let processedHash: string;
	let processedExtractPath: string;
	const integrationBaseDir = path.join(TEMP_DIR, "integration-proxy");

	beforeAll(async () => {
		await mkdir(integrationBaseDir, { recursive: true });

		// Process a fixture that is likely to have index.html and CSS
		const fixturePath = path.join(FIXTURES_DIR, "really-simple-test-project.elpx");
		const result = await processElpxUpload(fixturePath, integrationBaseDir);
		processedHash = result.hash;
		processedExtractPath = result.extractPath;

		// Point UPLOAD_STORAGE_DIR to the integration base dir so elpx-content resolves files
		process.env.UPLOAD_STORAGE_DIR = integrationBaseDir;

		app = new Hono();
		app.route("/api/v1/elpx", elpxContentRoutes);
	});

	it("GET /:hash/ returns 200 with HTML content", async () => {
		const res = await app.request(`/api/v1/elpx/${processedHash}`);

		// If there is an index.html it should return 200
		const indexExists = await Bun.file(
			path.join(processedExtractPath, "index.html"),
		).exists();

		if (indexExists) {
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe("text/html");
			const html = await res.text();
			expect(html.length).toBeGreaterThan(0);
			// Verify URLs have been rewritten to include the hash prefix
			expect(html).toContain(`/api/v1/elpx/${processedHash}/`);
		} else {
			expect(res.status).toBe(404);
		}
	});

	it("GET /:hash/content.xml returns 200 with XML", async () => {
		const res = await app.request(`/api/v1/elpx/${processedHash}/content.xml`);

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("application/xml");
		const xml = await res.text();
		expect(xml).toContain("<ode");
	});

	it("CSS files have rewritten URLs", async () => {
		// Find CSS files in the extracted directory
		const files = await readdir(processedExtractPath, { recursive: true });
		const cssFiles = files.filter(
			(f) => typeof f === "string" && f.endsWith(".css"),
		);

		if (cssFiles.length === 0) {
			console.log("No CSS files found in this fixture, skipping URL rewrite check");
			return;
		}

		for (const cssFile of cssFiles) {
			const res = await app.request(
				`/api/v1/elpx/${processedHash}/${cssFile}`,
			);
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe("text/css");

			const css = await res.text();
			// If the CSS has url() references that are relative, they should be rewritten
			const urlMatches = css.match(/url\s*\([^)]+\)/g);
			if (urlMatches) {
				for (const urlRef of urlMatches) {
					// Each non-data/non-external URL should be rewritten to include the hash
					const isExternal = /https?:\/\//.test(urlRef);
					const isData = /data:/.test(urlRef);
					if (!isExternal && !isData) {
						expect(urlRef).toContain(`/api/v1/elpx/${processedHash}/`);
					}
				}
			}

			console.log(
				`[${cssFile}] has ${urlMatches?.length ?? 0} url() references, all correctly rewritten`,
			);
		}
	});

	it("returns 404 for nonexistent file within extracted content", async () => {
		const res = await app.request(
			`/api/v1/elpx/${processedHash}/does-not-exist.html`,
		);
		expect(res.status).toBe(404);
	});

	it("serves a second fixture through the proxy", { timeout: 30_000 }, async () => {
		const fixturePath = path.join(FIXTURES_DIR, "mermaid.elpx");
		const result = await processElpxUpload(fixturePath, integrationBaseDir);

		const res = await app.request(`/api/v1/elpx/${result.hash}`);
		const indexExists = await Bun.file(
			path.join(result.extractPath, "index.html"),
		).exists();

		if (indexExists) {
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain(`/api/v1/elpx/${result.hash}/`);
		} else {
			expect(res.status).toBe(404);
		}
	});
});
