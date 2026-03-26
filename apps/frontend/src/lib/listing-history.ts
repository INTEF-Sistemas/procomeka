export type HistoryUpdateMode = "push" | "replace";

export interface ListingState {
	query: string;
	page: number;
	resourceType: string;
	language: string;
	license: string;
}

interface HistoryLike {
	pushState(data: unknown, unused: string, url?: string | URL | null): void;
	replaceState(data: unknown, unused: string, url?: string | URL | null): void;
}

export function readListingState(search: string): ListingState {
	const params = new URLSearchParams(search);

	return {
		query: params.get("q") ?? "",
		page: Math.max(1, Number(params.get("page") ?? "1") || 1),
		resourceType: params.get("resourceType") ?? "",
		language: params.get("language") ?? "",
		license: params.get("license") ?? "",
	};
}

export function buildListingUrl(pathname: string, search: string, state: ListingState): string {
	const params = new URLSearchParams(search);
	if (state.query) {
		params.set("q", state.query);
	} else {
		params.delete("q");
	}

	if (state.page > 1) {
		params.set("page", String(state.page));
	} else {
		params.delete("page");
	}

	if (state.resourceType) {
		params.set("resourceType", state.resourceType);
	} else {
		params.delete("resourceType");
	}

	if (state.language) {
		params.set("language", state.language);
	} else {
		params.delete("language");
	}

	if (state.license) {
		params.set("license", state.license);
	} else {
		params.delete("license");
	}

	const queryString = params.toString();
	return queryString ? `${pathname}?${queryString}` : pathname;
}

export function writeListingStateToHistory(
	history: HistoryLike,
	targetUrl: string,
	mode: HistoryUpdateMode,
): void {
	if (mode === "push") {
		history.pushState({}, "", targetUrl);
		return;
	}

	history.replaceState({}, "", targetUrl);
}
