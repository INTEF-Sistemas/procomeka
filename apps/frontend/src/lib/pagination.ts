export const DEFAULT_PAGE_SIZE = 20;

export interface PaginationState {
	currentPage: number;
	endItem: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	limit: number;
	offset: number;
	startItem: number;
	total: number;
	totalPages: number;
}

export function getPaginationState(
	total: number,
	limit = DEFAULT_PAGE_SIZE,
	offset = 0,
): PaginationState {
	const safeTotal = Math.max(0, total);
	const safeLimit = Math.max(1, limit);
	const maxOffset = safeTotal > 0
		? Math.max(0, (Math.ceil(safeTotal / safeLimit) - 1) * safeLimit)
		: 0;
	const safeOffset = Math.min(Math.max(0, offset), maxOffset);
	const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
	const currentPage = Math.floor(safeOffset / safeLimit) + 1;
	const hasPreviousPage = safeOffset > 0;
	const hasNextPage = safeOffset + safeLimit < safeTotal;
	const startItem = safeTotal === 0 ? 0 : safeOffset + 1;
	const endItem = safeTotal === 0 ? 0 : Math.min(safeOffset + safeLimit, safeTotal);

	return {
		currentPage,
		endItem,
		hasNextPage,
		hasPreviousPage,
		limit: safeLimit,
		offset: safeOffset,
		startItem,
		total: safeTotal,
		totalPages,
	};
}
