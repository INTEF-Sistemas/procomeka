import { useEffect, useRef, useState } from "react";
import {
	CATALOG_QUERY_SYNC_EVENT,
	dispatchCatalogQueryChange,
	type CatalogQueryDetail,
} from "../../lib/catalog-events.ts";

interface CatalogSearchIslandProps {
	initialQuery?: string;
}

export function CatalogSearchIsland({ initialQuery = "" }: CatalogSearchIslandProps) {
	const [query, setQuery] = useState(initialQuery);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		function handleSync(event: Event) {
			const customEvent = event as CustomEvent<CatalogQueryDetail>;
			const nextQuery = customEvent.detail?.query ?? "";
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
				debounceRef.current = null;
			}
			setQuery(nextQuery);
		}

		window.addEventListener(CATALOG_QUERY_SYNC_EVENT, handleSync as EventListener);
		return () => {
			window.removeEventListener(CATALOG_QUERY_SYNC_EVENT, handleSync as EventListener);
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	function queueDispatch(nextQuery: string) {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			dispatchCatalogQueryChange(nextQuery.trim());
		}, 300);
	}

	return (
		<input
			type="text"
			id="header-search"
			placeholder="Buscar recursos..."
			aria-label="Buscar recursos"
			className="header-search-input"
			value={query}
			onChange={(event) => {
				const nextQuery = event.currentTarget.value;
				setQuery(nextQuery);
				queueDispatch(nextQuery);
			}}
			onKeyDown={(event) => {
				if (event.key !== "Enter") return;
				if (debounceRef.current) {
					clearTimeout(debounceRef.current);
					debounceRef.current = null;
				}
				dispatchCatalogQueryChange(query.trim());
			}}
		/>
	);
}
