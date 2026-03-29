/**
 * Serves the eXeLearning static editor with Procomeka bootstrap config injected.
 * Equivalent to editor-bootstrap.php in wp-exelearning.
 */
import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import path from "node:path";

const EDITOR_STATIC_DIR = path.resolve(import.meta.dir, "../../static/exelearning-editor/static");

export const exelearningEditorRoutes = new Hono();

/**
 * Bootstrap page: loads editor index.html with Procomeka embedding config injected.
 * Query params: elpxUrl (URL to load), resourceId
 */
exelearningEditorRoutes.get("/index.html", async (c) => {
	const elpxUrl = c.req.query("elpxUrl") || "";
	const resourceId = c.req.query("resourceId") || "";

	const indexPath = path.join(EDITOR_STATIC_DIR, "index.html");
	let html: string;
	try {
		html = await readFile(indexPath, "utf-8");
	} catch {
		return c.text("Editor no disponible. Ejecuta: make download-exelearning-editor", 404);
	}

	// Determine editor base URL for asset resolution
	const editorBaseUrl = "/api/v1/exelearning-editor";

	// Inject <base> tag for relative asset resolution
	html = html.replace("<head>", `<head>\n<base href="${editorBaseUrl}/">`);

	// Inject Procomeka embedding config before </head> (like editor-bootstrap.php)
	const configScript = `
<script>
window.__EXE_EMBEDDING_CONFIG__ = {
	basePath: "${editorBaseUrl}",
	initialProjectUrl: ${JSON.stringify(elpxUrl || null)},
	parentOrigin: window.location.origin,
	trustedOrigins: [window.location.origin],
	hideUI: {
		fileMenu: true,
		saveButton: true,
		userMenu: true,
	},
};
window.__PROCOMEKA_CONFIG__ = {
	resourceId: ${JSON.stringify(resourceId)},
	editorBaseUrl: "${editorBaseUrl}",
};
</script>`;

	html = html.replace("</head>", `${configScript}\n</head>`);

	// Inject the bridge script before </body> — handles postMessage communication
	// with the parent (same role as wp-exe-bridge.js in wp-exelearning)
	html = html.replace("</body>", `${BRIDGE_SCRIPT}\n</body>`);

	return new Response(html, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-cache",
		},
	});
});

/**
 * Bridge script injected into the editor iframe.
 * Ported from wp-exelearning/assets/js/wp-exe-bridge.js.
 * Handles: EXELEARNING_READY, WP_REQUEST_SAVE → WP_SAVE_FILE, CONFIGURE, DOCUMENT_LOADED/CHANGED.
 */
const BRIDGE_SCRIPT = `<script>
(function() {
	'use strict';
	var targetOrigin = window.__EXE_EMBEDDING_CONFIG__?.parentOrigin || '*';
	var documentLoadedNotified = false;

	function post(msg) {
		if (window.parent && window.parent !== window) window.parent.postMessage(msg, targetOrigin);
	}

	async function getApp(timeout) {
		timeout = timeout || 15000;
		var start = Date.now();
		while (Date.now() - start < timeout) {
			if (window.eXeLearning?.app) return window.eXeLearning.app;
			await new Promise(function(r) { setTimeout(r, 100); });
		}
		throw new Error('App not ready');
	}

	async function exportToBytes() {
		var app = await getApp();
		var project = app.project;
		var blob, filename = 'project.elpx';
		if (window.SharedExporters?.createExporter && project?._yjsBridge?.documentManager) {
			var yb = project._yjsBridge;
			var exporter = window.SharedExporters.createExporter('elpx', yb.documentManager, yb.assetCache || null, yb.resourceFetcher || null, yb.assetManager || null);
			var result = await exporter.export({});
			if (!result?.success || !result?.data) throw new Error(result?.error || 'Export failed');
			blob = new Blob([result.data], { type: 'application/zip' });
			filename = result.filename || filename;
		} else if (project && typeof project.exportToElpxBlob === 'function') {
			blob = await project.exportToElpxBlob();
			filename = project.getExportFilename?.() || filename;
		} else if (project?._yjsBridge?.exporter) {
			blob = await project._yjsBridge.exporter.exportToBlob();
			filename = project._yjsBridge.exporter.buildFilename?.() || filename;
		} else {
			throw new Error('Export not available');
		}
		var bytes = await blob.arrayBuffer();
		return { bytes: bytes, filename: filename, mimeType: blob.type || 'application/zip' };
	}

	function applyHideUI(h) {
		if (!h) return;
		var b = document.body;
		if (h.fileMenu) b.setAttribute('data-exe-hide-file-menu', 'true');
		if (h.saveButton) b.setAttribute('data-exe-hide-save', 'true');
		if (h.userMenu) b.setAttribute('data-exe-hide-user-menu', 'true');
	}

	async function notifyDocumentLoaded() {
		var start = Date.now();
		while (Date.now() - start < 30000) {
			var mgr = window.eXeLearning?.app?.project?._yjsBridge?.documentManager;
			if (mgr && !documentLoadedNotified) {
				documentLoadedNotified = true;
				post({ type: 'DOCUMENT_LOADED' });
				// Monitor changes
				var ydoc = mgr.ydoc;
				if (ydoc && typeof ydoc.on === 'function') {
					var changed = false;
					ydoc.on('update', function() {
						if (!changed) { changed = true; post({ type: 'DOCUMENT_CHANGED' }); }
					});
				}
				return;
			}
			await new Promise(function(r) { setTimeout(r, 150); });
		}
	}

	async function handleMessage(event) {
		var msg = event?.data;
		if (!msg?.type || msg.source === 'procomeka-bridge') return;
		try {
			switch (msg.type) {
				case 'WP_REQUEST_SAVE':
					var exported = await exportToBytes();
					post({ type: 'WP_SAVE_FILE', requestId: msg.requestId, bytes: exported.bytes, filename: exported.filename, mimeType: exported.mimeType, size: exported.bytes.byteLength });
					break;
				case 'CONFIGURE':
					applyHideUI(msg.data?.hideUI);
					post({ type: 'CONFIGURE_SUCCESS', requestId: msg.requestId });
					break;
				case 'WP_SAVE_CONFIRMED':
					var mgr2 = window.eXeLearning?.app?.project?._yjsBridge?.documentManager;
					if (mgr2?.markClean) mgr2.markClean();
					window.onbeforeunload = null;
					post({ type: 'WP_SAVE_CONFIRMED_ACK', requestId: msg.requestId });
					break;
			}
		} catch (err) {
			post({ type: (msg.type || 'UNKNOWN') + '_ERROR', requestId: msg.requestId, error: err?.message || 'Unknown error' });
		}
	}

	async function init() {
		if (window.eXeLearning?.ready) await window.eXeLearning.ready;
		window.addEventListener('message', handleMessage);
		post({ type: 'EXELEARNING_READY', version: window.eXeLearning?.version || 'unknown', capabilities: ['WP_REQUEST_SAVE', 'CONFIGURE'] });
		notifyDocumentLoaded();
		document.addEventListener('keydown', function(e) {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); post({ type: 'DOCUMENT_CHANGED' }); }
		});
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
<\/script>`;

/**
 * Serve all static editor assets (JS, CSS, images, fonts, etc.)
 */
exelearningEditorRoutes.get("/*", async (c) => {
	const urlPath = new URL(c.req.url).pathname;
	// Strip the route prefix to get the relative file path
	const prefix = "/api/v1/exelearning-editor/";
	const relativePath = urlPath.startsWith(prefix)
		? urlPath.slice(prefix.length)
		: urlPath.replace(/^\/+/, "");

	if (!relativePath || relativePath.includes("..")) {
		return c.text("Not found", 404);
	}

	const filePath = path.join(EDITOR_STATIC_DIR, relativePath);
	const file = Bun.file(filePath);

	if (!(await file.exists())) {
		return c.text("Not found", 404);
	}

	// Determine MIME type from extension
	const ext = path.extname(relativePath).slice(1).toLowerCase();
	const mimeTypes: Record<string, string> = {
		html: "text/html", js: "application/javascript", mjs: "application/javascript",
		css: "text/css", json: "application/json", xml: "application/xml",
		png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
		svg: "image/svg+xml", webp: "image/webp", ico: "image/x-icon",
		woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
		mp3: "audio/mpeg", mp4: "video/mp4", webm: "video/webm", wav: "audio/wav",
		pdf: "application/pdf", zip: "application/zip", txt: "text/plain",
	};
	const contentType = mimeTypes[ext] || "application/octet-stream";

	return new Response(file, {
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=3600",
		},
	});
});
