import { describe, expect, test } from "bun:test";

import { DEFAULT_PAGE_SIZE, getPaginationState } from "./pagination.ts";

describe("pagination helpers", () => {
	test("builds first page state for multi-page results", () => {
		expect(getPaginationState(45)).toEqual({
			currentPage: 1,
			endItem: 20,
			hasNextPage: true,
			hasPreviousPage: false,
			limit: DEFAULT_PAGE_SIZE,
			offset: 0,
			startItem: 1,
			total: 45,
			totalPages: 3,
		});
	});

	test("builds middle page state", () => {
		expect(getPaginationState(45, 20, 20)).toEqual({
			currentPage: 2,
			endItem: 40,
			hasNextPage: true,
			hasPreviousPage: true,
			limit: 20,
			offset: 20,
			startItem: 21,
			total: 45,
			totalPages: 3,
		});
	});

	test("clamps overflowing offsets to the last available page", () => {
		expect(getPaginationState(45, 20, 999)).toEqual({
			currentPage: 3,
			endItem: 45,
			hasNextPage: false,
			hasPreviousPage: true,
			limit: 20,
			offset: 40,
			startItem: 41,
			total: 45,
			totalPages: 3,
		});
	});

	test("returns a stable empty state", () => {
		expect(getPaginationState(0)).toEqual({
			currentPage: 1,
			endItem: 0,
			hasNextPage: false,
			hasPreviousPage: false,
			limit: DEFAULT_PAGE_SIZE,
			offset: 0,
			startItem: 0,
			total: 0,
			totalPages: 1,
		});
	});
});
