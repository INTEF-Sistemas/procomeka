/**
 * Returns the application base URL, resolved from window.__BASE_URL__ (client)
 * or import.meta.env.BASE_URL (SSR), defaulting to "/".
 */
export function getBaseUrl(): string {
	return (typeof window !== "undefined" &&
		(window as unknown as { __BASE_URL__?: string }).__BASE_URL__) ||
		(typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ||
		"/";
}

/**
 * Returns true when running in static preview mode (PGlite + IndexedDB).
 */
export function isPreviewMode(): boolean {
	return typeof window !== "undefined" && (window as Record<string, unknown>).__PREVIEW_MODE__ === true;
}

/**
 * Helper para construir URLs relativas al base path de la aplicación.
 * Necesario para que la navegación funcione bajo subpaths como /procomeka/pr-preview/pr-123/
 *
 * Funciona tanto en SSR (import.meta.env.BASE_URL) como en cliente (window.__BASE_URL__).
 */
export function url(path: string): string {
	return getBaseUrl() + path.replace(/^\//, "");
}
