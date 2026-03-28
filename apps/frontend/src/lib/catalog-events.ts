export const CATALOG_QUERY_CHANGE_EVENT = "catalog:querychange";
export const CATALOG_QUERY_SYNC_EVENT = "catalog:querysync";

export interface CatalogQueryDetail {
	query: string;
}

function dispatchCatalogEvent(name: string, query: string) {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent<CatalogQueryDetail>(name, { detail: { query } }));
}

export function dispatchCatalogQueryChange(query: string) {
	dispatchCatalogEvent(CATALOG_QUERY_CHANGE_EVENT, query);
}

export function dispatchCatalogQuerySync(query: string) {
	dispatchCatalogEvent(CATALOG_QUERY_SYNC_EVENT, query);
}
