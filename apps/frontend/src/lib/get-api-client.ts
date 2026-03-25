import type { ApiClient } from "./api-client.ts";

let _client: ApiClient | null = null;
let _initPromise: Promise<ApiClient> | null = null;

/**
 * Devuelve el ApiClient adecuado al modo de ejecución.
 * En modo preview, carga PGlite dinámicamente para no incluirlo en builds normales.
 */
export async function getApiClient(): Promise<ApiClient> {
	if (_client) return _client;
	if (_initPromise) return _initPromise;

	_initPromise = (async () => {
		const isPreview =
			typeof window !== "undefined" &&
			(window as unknown as { __PREVIEW_MODE__?: boolean }).__PREVIEW_MODE__ === true;

		if (isPreview) {
			const { PreviewApiClient } = await import("./preview-api-client.ts");
			_client = await PreviewApiClient.getInstance();
		} else {
			const { HttpApiClient } = await import("./http-api-client.ts");
			_client = new HttpApiClient();
		}
		return _client;
	})();

	return _initPromise;
}
