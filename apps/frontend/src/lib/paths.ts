/**
 * Helper para construir URLs relativas al base path de la aplicación.
 * Necesario para que la navegación funcione bajo subpaths como /procomeka/pr-preview/pr-123/
 */
export function url(path: string): string {
	const base =
		(typeof window !== "undefined" &&
			(window as unknown as { __BASE_URL__?: string }).__BASE_URL__) ||
		"/";
	return base + path.replace(/^\//, "");
}
