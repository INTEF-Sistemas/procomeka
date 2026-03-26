export const DEFAULT_FRONTEND_URL = "http://localhost:4321";

export function getFrontendUrl(
	env: NodeJS.ProcessEnv = process.env,
): string {
	return env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL;
}

export function getAuthBaseUrl(
	env: NodeJS.ProcessEnv = process.env,
): string {
	return env.BETTER_AUTH_URL ?? getFrontendUrl(env);
}
