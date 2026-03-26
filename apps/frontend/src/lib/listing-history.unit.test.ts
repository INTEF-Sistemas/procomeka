import { describe, expect, mock, test } from "bun:test";

import {
	buildListingUrl,
	readListingState,
	writeListingStateToHistory,
} from "./listing-history.ts";

describe("listing history helpers", () => {
	test("builds listing URL with query and page", () => {
		expect(buildListingUrl("/", "", {
			query: "matematicas",
			page: 3,
			resourceType: "",
			language: "",
			license: "",
		})).toBe("/?q=matematicas&page=3");
	});

	test("drops page parameter when navigating to first page", () => {
		expect(buildListingUrl("/", "?q=matematicas&page=2", {
			query: "matematicas",
			page: 1,
			resourceType: "",
			language: "",
			license: "",
		})).toBe("/?q=matematicas");
	});

	test("includes active filters in the listing URL", () => {
		expect(buildListingUrl("/", "", {
			query: "scratch",
			page: 2,
			resourceType: "video",
			language: "es",
			license: "cc-by",
		})).toBe("/?q=scratch&page=2&resourceType=video&language=es&license=cc-by");
	});

	test("reads listing state from URL params", () => {
		expect(readListingState("?q=scratch&page=3&resourceType=video&language=es&license=cc-by")).toEqual({
			query: "scratch",
			page: 3,
			resourceType: "video",
			language: "es",
			license: "cc-by",
		});
	});

	test("uses pushState in push mode", () => {
		const history = {
			pushState: mock(() => {}),
			replaceState: mock(() => {}),
		};

		writeListingStateToHistory(history, "/?q=matematicas&page=2", "push");

		expect(history.pushState).toHaveBeenCalledWith({}, "", "/?q=matematicas&page=2");
		expect(history.replaceState).not.toHaveBeenCalled();
	});

	test("uses replaceState in replace mode", () => {
		const history = {
			pushState: mock(() => {}),
			replaceState: mock(() => {}),
		};

		writeListingStateToHistory(history, "/?q=matematicas&page=2", "replace");

		expect(history.replaceState).toHaveBeenCalledWith({}, "", "/?q=matematicas&page=2");
		expect(history.pushState).not.toHaveBeenCalled();
	});
});
