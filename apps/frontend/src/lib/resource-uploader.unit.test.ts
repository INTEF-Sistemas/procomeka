import { describe, expect, test } from "bun:test";
import { escapeHtml, renderMediaItem, renderPersistedUploadItem, renderQueueItem } from "./resource-uploader.ts";

describe("resource uploader rendering", () => {
	test("escapeHtml codifica caracteres peligrosos", () => {
		expect(escapeHtml(`"><img src=x onerror=alert(1)>`)).toBe("&quot;&gt;&lt;img src=x onerror=alert(1)&gt;");
	});

	test("renderPersistedUploadItem escapa nombres y mensajes de error", () => {
		const html = renderPersistedUploadItem({
			id: `upload"><script>1</script>`,
			resourceId: "res-1",
			ownerId: "user-1",
			status: "failed",
			originalFilename: `</strong><img src=x onerror=alert(1)>`,
			storageKey: "key",
			receivedBytes: 100,
			declaredSize: 200,
			errorMessage: `<svg onload=alert(1)>`,
		});
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("<img");
		expect(html).toContain("&lt;/strong&gt;&lt;img src=x onerror=alert(1)&gt;");
		expect(html).toContain("&lt;svg onload=alert(1)&gt;");
	});

	test("renderMediaItem escapa texto y URL", () => {
		const html = renderMediaItem({
			id: "media-1",
			resourceId: "res-1",
			type: "file",
			url: `javascript:alert("x")`,
			filename: `<b>guia.pdf</b>`,
			isPrimary: 0,
		});
		expect(html).toContain('href="javascript:alert(&quot;x&quot;)"');
		expect(html).toContain("&lt;b&gt;guia.pdf&lt;/b&gt;");
	});

	test("renderQueueItem escapa nombre, error y atributos", () => {
		const html = renderQueueItem({
			id: `file"><svg onload=alert(1)>`,
			name: `<img src=x onerror=alert(1)>`,
			size: 1024,
			error: `<b>fallo</b>`,
			progress: { percentage: 25 },
			response: { uploadURL: "/api/uploads/upload-1" },
		});
		expect(html).not.toContain("<img");
		expect(html).not.toContain("<svg");
		expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
		expect(html).toContain("&lt;b&gt;fallo&lt;/b&gt;");
		expect(html).toContain('data-remove-local="file&quot;&gt;&lt;svg onload=alert(1)&gt;"');
	});
});
