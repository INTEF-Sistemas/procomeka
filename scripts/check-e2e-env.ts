import { chromium, firefox } from "@playwright/test";

type BrowserName = "chromium" | "firefox";

const launchers = {
	chromium,
	firefox,
} as const;

export function formatE2EEnvError(browserName: BrowserName, error: unknown): string {
	const details = error instanceof Error ? error.message : String(error);

	return [
		`E2E preflight failed for ${browserName}.`,
		"Playwright could not launch the browser in this environment.",
		"Run this target in a local shell or CI runner with browser permissions enabled.",
		`Original error: ${details}`,
	].join("\n");
}

function isBrowserName(value: string | undefined): value is BrowserName {
	return value === "chromium" || value === "firefox";
}

async function main() {
	const browserName = process.argv[2];

	if (!isBrowserName(browserName)) {
		console.error("Usage: bun run scripts/check-e2e-env.ts <chromium|firefox>");
		process.exit(1);
	}

	try {
		const browser = await launchers[browserName].launch({ headless: true });
		await browser.close();
		console.log(`Playwright preflight OK for ${browserName}.`);
	} catch (error) {
		console.error(formatE2EEnvError(browserName, error));
		process.exit(1);
	}
}

if (import.meta.main) {
	await main();
}
