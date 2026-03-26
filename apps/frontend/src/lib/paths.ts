/**
 * Helper para construir URLs relativas al base path de la aplicación.
 * Necesario para que la navegación funcione bajo subpaths como /procomeka/pr-preview/pr-123/
 */
export function url(path: string): string {
	// Intentar obtener el base path dinámico inyectado en el cliente (window.__BASE_URL__)
	// Si no existe (SSR o build), usar import.meta.env.BASE_URL de Astro.
	let base = "/";
	if (typeof window !== "undefined") {
		const win = window as unknown as { __BASE_URL__?: string };
		if (win.__BASE_URL__ !== undefined) {
			base = win.__BASE_URL__;
		}
	} else {
		base = import.meta.env.BASE_URL || "/";
	}

	// Asegurar que el path no empieza por / para concatenar limpiamente
	let normalizedPath = path.replace(/^\//, "");

	// Si estamos en modo preview (estático), asegurar que los directorios terminan en /
	// para evitar 404 en GitHub Pages.
	const isPreview = typeof window !== "undefined"
		? (window as unknown as { __PREVIEW_MODE__?: boolean }).__PREVIEW_MODE__ === true
		: import.meta.env.PUBLIC_PREVIEW_MODE === "true";

	if (isPreview && normalizedPath && !normalizedPath.includes(".") && !normalizedPath.endsWith("/")) {
		normalizedPath += "/";
	}

	// Concatenación robusta de base + path
	if (base.endsWith("/")) {
		return base + normalizedPath;
	}

	return base + "/" + normalizedPath;
}
