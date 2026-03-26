import { describe, expect, test } from "bun:test";

import { formatE2EEnvError } from "./check-e2e-env.ts";

describe("check-e2e-env helpers", () => {
	test("formatE2EEnvError includes browser name and original error", () => {
		const message = formatE2EEnvError(
			"chromium",
			new Error("bootstrap_check_in permission denied"),
		);

		expect(message).toContain("chromium");
		expect(message).toContain("permission denied");
		expect(message).toContain("browser permissions enabled");
	});
});
