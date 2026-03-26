import { describe, expect, mock, test } from "bun:test";

import type { ApiClient, ResourceListResult } from "./api-client.ts";
import { resolveResourcePage } from "./resource-list-pagination.ts";

function createApiClient(listResources: ApiClient["listResources"]): ApiClient {
	return {
		createResource: async () => ({ id: "", slug: "" }),
		deleteResource: async () => {},
		getConfig: async () => ({ oidcEnabled: false, oidcEndSessionUrl: null }),
		getResourceById: async () => null,
		getResourceBySlug: async () => null,
		getSession: async () => null,
		listAdminResources: async () => ({ data: [], total: 0, limit: 20, offset: 0 }),
		listResources,
		signIn: async () => ({ ok: false }),
		signInOidc: async () => ({ ok: false }),
		signOut: async () => {},
		updateResource: async () => ({ ok: true }),
	};
}

describe("resolveResourcePage", () => {
	test("refetches on normalized page when initial response is out of range", async () => {
		const firstResponse: ResourceListResult = {
			data: [],
			limit: 20,
			offset: 19_960,
			total: 45,
		};
		const secondResponse: ResourceListResult = {
			data: [
				{
					author: null,
					createdAt: null,
					deletedAt: null,
					description: "Descripción",
					editorialStatus: "published",
					id: "r1",
					keywords: null,
					language: "es",
					license: "CC BY",
					publisher: null,
					resourceType: "activity",
					slug: "recurso-1",
					title: "Recurso 1",
					updatedAt: null,
				},
			],
			limit: 20,
			offset: 40,
			total: 45,
		};
		const listResources = mock<ApiClient["listResources"]>()
			.mockResolvedValueOnce(firstResponse)
			.mockResolvedValueOnce(secondResponse);
		const api = createApiClient(listResources);

		const resolved = await resolveResourcePage({ api, page: 999, query: "matemáticas" });

		expect(resolved.page).toBe(3);
		expect(resolved.result).toEqual(secondResponse);
		expect(listResources).toHaveBeenCalledTimes(2);
		expect(listResources).toHaveBeenNthCalledWith(1, {
			limit: 20,
			offset: 19_960,
			q: "matemáticas",
		});
		expect(listResources).toHaveBeenNthCalledWith(2, {
			limit: 20,
			offset: 40,
			q: "matemáticas",
		});
	});

	test("does not refetch when requested page is already valid", async () => {
		const response: ResourceListResult = {
			data: [],
			limit: 20,
			offset: 20,
			total: 45,
		};
		const listResources = mock<ApiClient["listResources"]>().mockResolvedValue(response);
		const api = createApiClient(listResources);

		const resolved = await resolveResourcePage({ api, page: 2 });

		expect(resolved.page).toBe(2);
		expect(resolved.result).toEqual(response);
		expect(listResources).toHaveBeenCalledTimes(1);
	});
});
