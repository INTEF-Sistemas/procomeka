import { describe, expect, test } from "bun:test";

import {
	DEFAULT_FRONTEND_URL,
	getAuthBaseUrl,
	getFrontendUrl,
} from "./urls.ts";

describe("auth config helpers", () => {
	test("use frontend URL as canonical local default", () => {
		expect(getFrontendUrl({} as NodeJS.ProcessEnv)).toBe(DEFAULT_FRONTEND_URL);
		expect(getAuthBaseUrl({} as NodeJS.ProcessEnv)).toBe(DEFAULT_FRONTEND_URL);
	});

	test("prefer explicit BETTER_AUTH_URL over frontend URL", () => {
		expect(
			getAuthBaseUrl({
				BETTER_AUTH_URL: "https://catalogo.ejemplo.test",
				FRONTEND_URL: "http://localhost:4321",
			} as NodeJS.ProcessEnv),
		).toBe("https://catalogo.ejemplo.test");
	});

	test("keep explicit FRONTEND_URL for trusted origins and auth fallback", () => {
		const env = {
			FRONTEND_URL: "https://staging.procomeka.test",
		} as NodeJS.ProcessEnv;

		expect(getFrontendUrl(env)).toBe("https://staging.procomeka.test");
		expect(getAuthBaseUrl(env)).toBe("https://staging.procomeka.test");
	});
});
