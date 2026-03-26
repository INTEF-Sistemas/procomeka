import type { ApiClient, ResourceListResult } from "./api-client.ts";
import { DEFAULT_PAGE_SIZE, getPaginationState } from "./pagination.ts";

interface ResolveResourcePageInput {
	api: ApiClient;
	page: number;
	query?: string;
	limit?: number;
}

interface ResolveResourcePageResult {
	result: ResourceListResult;
	page: number;
}

export async function resolveResourcePage({
	api,
	page,
	query,
	limit = DEFAULT_PAGE_SIZE,
}: ResolveResourcePageInput): Promise<ResolveResourcePageResult> {
	let requestedPage = Math.max(1, page);
	let result = await api.listResources({
		q: query || undefined,
		limit,
		offset: (requestedPage - 1) * limit,
	});

	let state = getPaginationState(result.total, result.limit, result.offset);

	if (state.currentPage !== requestedPage) {
		requestedPage = state.currentPage;
		result = await api.listResources({
			q: query || undefined,
			limit,
			offset: (requestedPage - 1) * limit,
		});
		state = getPaginationState(result.total, result.limit, result.offset);
		requestedPage = state.currentPage;
	}

	return {
		page: requestedPage,
		result,
	};
}
