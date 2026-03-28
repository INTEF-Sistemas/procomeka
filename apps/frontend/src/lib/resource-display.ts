export function escapeHtml(s: string): string {
	return s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export const TYPE_ICONS: Record<string, string> = {
	documento: "&#128196;", presentacion: "&#128202;", video: "&#127909;", audio: "&#127911;",
	imagen: "&#128247;", "actividad-interactiva": "&#127918;", "secuencia-didactica": "&#128218;",
	ejercicio: "&#9997;", evaluacion: "&#128203;", proyecto: "&#128640;",
};

export const STATUS_MAP: Record<string, { label: string; cssClass: string }> = {
	draft: { label: "Borrador", cssClass: "pill-status-draft" },
	review: { label: "En revision", cssClass: "pill-status-review" },
	published: { label: "Publicado", cssClass: "pill-status-published" },
	archived: { label: "Archivado", cssClass: "pill-status-archived" },
};

export const FILE_ICONS: Record<string, string> = {
	"application/pdf": "&#128196;", "video/mp4": "&#127909;", "audio/mpeg": "&#127911;",
	"image/png": "&#128247;", "image/jpeg": "&#128247;", "image/gif": "&#128247;",
};

export function formatBytes(bytes?: number | null): string {
	if (!bytes || bytes <= 0) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	let value = bytes;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
