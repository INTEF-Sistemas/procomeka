import { startTransition, useEffect, useRef, useState } from "react";
import type { Resource } from "../../lib/api-client.ts";
import {
	CATALOG_QUERY_CHANGE_EVENT,
	dispatchCatalogQuerySync,
	type CatalogQueryDetail,
} from "../../lib/catalog-events.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import {
	buildListingUrl,
	readListingState,
	writeListingStateToHistory,
	type ListingState,
} from "../../lib/listing-history.ts";
import { DEFAULT_PAGE_SIZE, getPaginationState } from "../../lib/pagination.ts";
import { url } from "../../lib/paths.ts";
import {
	LANGUAGE_OPTIONS,
	LICENSE_OPTIONS,
	loadFilterOptions,
	RESOURCE_TYPE_OPTIONS,
	type FilterOption,
} from "../../lib/resource-filters.ts";
import { TYPE_ICONS } from "../../lib/resource-display.ts";

type ViewMode = "grid" | "list";
type HistoryMode = "push" | "replace";

const DEFAULT_LISTING_STATE: ListingState = {
	query: "",
	page: 1,
	resourceType: "",
	language: "",
	license: "",
};

function getResourceIcon(type: string) {
	return TYPE_ICONS[type] ?? "&#128196;";
}

function renderPaginationPages(currentPage: number, totalPages: number): Array<number | "..."> {
	const pages: Array<number | "..."> = [];

	for (let page = 1; page <= totalPages; page += 1) {
		if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
			pages.push(page);
			continue;
		}

		if (pages[pages.length - 1] !== "...") {
			pages.push("...");
		}
	}

	return pages;
}

function summaryLabel(total: number, startItem: number, endItem: number) {
	if (total === 0) return "Sin resultados para la búsqueda actual.";
	return `${startItem}-${endItem} de ${total} recursos`;
}

function ResourceCard({ resource }: { resource: Resource }) {
	const description = resource.description || "";
	const clipped = description.length > 140 ? `${description.slice(0, 140)}...` : description;

	return (
		<a href={url(`recurso?slug=${resource.slug}`)} className="resource-card">
			<div
				className="card-icon"
				aria-hidden="true"
				dangerouslySetInnerHTML={{ __html: getResourceIcon(resource.resourceType) }}
			/>
			<div className="card-body">
				<h3>{resource.title}</h3>
				<p>{clipped}</p>
				<div className="card-tags">
					<span className="pill pill-type">{resource.resourceType}</span>
					<span className="pill pill-lang">{(resource.language || "").toUpperCase()}</span>
					{resource.license ? <span className="pill pill-license">{resource.license}</span> : null}
				</div>
				{resource.createdByName ? <span className="card-meta">{resource.createdByName}</span> : null}
			</div>
		</a>
	);
}

export function CatalogIsland() {
	const [listingState, setListingState] = useState<ListingState>(DEFAULT_LISTING_STATE);
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [resourceTypeOptions, setResourceTypeOptions] = useState<FilterOption[]>(RESOURCE_TYPE_OPTIONS);
	const [languageOptions, setLanguageOptions] = useState<FilterOption[]>(LANGUAGE_OPTIONS);
	const [licenseOptions, setLicenseOptions] = useState<FilterOption[]>(LICENSE_OPTIONS);
	const [resources, setResources] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [summary, setSummary] = useState("Cargando recursos...");
	const [pagination, setPagination] = useState(() => getPaginationState(0, DEFAULT_PAGE_SIZE, 0));
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const requestIdRef = useRef(0);
	const listingStateRef = useRef<ListingState>(DEFAULT_LISTING_STATE);

	useEffect(() => {
		listingStateRef.current = listingState;
	}, [listingState]);

	async function loadResources(nextState: ListingState, mode?: HistoryMode) {
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		setLoading(true);
		setError("");

		try {
			const api = await getApiClient();
			const offset = (nextState.page - 1) * DEFAULT_PAGE_SIZE;
			const result = await api.listResources({
				q: nextState.query || undefined,
				limit: DEFAULT_PAGE_SIZE,
				offset,
				resourceType: nextState.resourceType || undefined,
				language: nextState.language || undefined,
				license: nextState.license || undefined,
			});

			if (requestId !== requestIdRef.current) return;

			const paginationState = getPaginationState(result.total, result.limit, result.offset);
			if (nextState.page > paginationState.totalPages) {
				await applyListingState({ ...nextState, page: 1 }, "replace", { syncSearch: false, scrollToTop: false });
				return;
			}

			startTransition(() => {
				setResources(result.data);
				setPagination(paginationState);
				setSummary(summaryLabel(result.total, paginationState.startItem, paginationState.endItem));
				setLoading(false);
			});

			if (mode) {
				writeListingStateToHistory(
					window.history,
					buildListingUrl(window.location.pathname, window.location.search, nextState),
					mode,
				);
			}
		} catch {
			if (requestId !== requestIdRef.current) return;
			setResources([]);
			setPagination(getPaginationState(0, DEFAULT_PAGE_SIZE, 0));
			setSummary("");
			setError("Error al cargar recursos.");
			setLoading(false);
		}
	}

	async function applyListingState(
		nextState: ListingState,
		mode: HistoryMode,
		options?: { syncSearch?: boolean; scrollToTop?: boolean },
	) {
		const syncSearch = options?.syncSearch ?? true;
		const scrollToTop = options?.scrollToTop ?? false;

		setListingState(nextState);
		setSidebarOpen(false);

		if (syncSearch) {
			dispatchCatalogQuerySync(nextState.query);
		}

		await loadResources(nextState, mode);

		if (scrollToTop) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}

	useEffect(() => {
		const nextViewMode = localStorage.getItem("catalog-view") === "list" ? "list" : "grid";
		const nextState = readListingState(window.location.search);
		setViewMode(nextViewMode);
		setListingState(nextState);
		listingStateRef.current = nextState;
		dispatchCatalogQuerySync(nextState.query);

		void Promise.all([
			loadFilterOptions("resource-type", "Todos los tipos", RESOURCE_TYPE_OPTIONS),
			loadFilterOptions("language", "Todos los idiomas", LANGUAGE_OPTIONS),
			loadFilterOptions("license", "Todas las licencias", LICENSE_OPTIONS),
		]).then(([types, languages, licenses]) => {
			setResourceTypeOptions(types);
			setLanguageOptions(languages);
			setLicenseOptions(licenses);
		});

		void loadResources(nextState);

		function handlePopState() {
			const popState = readListingState(window.location.search);
			setListingState(popState);
			dispatchCatalogQuerySync(popState.query);
			void loadResources(popState);
		}

		function handleQueryChange(event: Event) {
			const customEvent = event as CustomEvent<CatalogQueryDetail>;
			const nextQuery = customEvent.detail?.query ?? "";
			void applyListingState({ ...listingStateRef.current, query: nextQuery, page: 1 }, "replace", { syncSearch: false });
		}

		window.addEventListener("popstate", handlePopState);
		window.addEventListener(CATALOG_QUERY_CHANGE_EVENT, handleQueryChange as EventListener);

		return () => {
			window.removeEventListener("popstate", handlePopState);
			window.removeEventListener(CATALOG_QUERY_CHANGE_EVENT, handleQueryChange as EventListener);
		};
	}, []);

	function updateViewMode(nextViewMode: ViewMode) {
		setViewMode(nextViewMode);
		localStorage.setItem("catalog-view", nextViewMode);
	}

	const paginationPages = renderPaginationPages(pagination.currentPage, pagination.totalPages);
	const resourcesClassName = viewMode === "list" ? "resources-list-view" : "resources-grid";

	return (
		<div className="catalog">
			<aside className={`sidebar${sidebarOpen ? " open" : ""}`} id="sidebar">
				<h2 className="sidebar-title">Filtros</h2>
				<div className="filter-group">
					<label htmlFor="filter-resource-type">Tipo de recurso</label>
					<select
						id="filter-resource-type"
						value={listingState.resourceType}
						onChange={(event) => {
							void applyListingState(
								{ ...listingState, resourceType: event.currentTarget.value, page: 1 },
								"replace",
							);
						}}
					>
						{resourceTypeOptions.map((option) => (
							<option key={option.value || "all"} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>

				<div className="filter-group">
					<label htmlFor="filter-language">Idioma</label>
					<select
						id="filter-language"
						value={listingState.language}
						onChange={(event) => {
							void applyListingState(
								{ ...listingState, language: event.currentTarget.value, page: 1 },
								"replace",
							);
						}}
					>
						{languageOptions.map((option) => (
							<option key={option.value || "all"} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>

				<div className="filter-group">
					<label htmlFor="filter-license">Licencia</label>
					<select
						id="filter-license"
						value={listingState.license}
						onChange={(event) => {
							void applyListingState(
								{ ...listingState, license: event.currentTarget.value, page: 1 },
								"replace",
							);
						}}
					>
						{licenseOptions.map((option) => (
							<option key={option.value || "all"} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>

				<button
					id="clear-filters"
					className="clear-btn"
					type="button"
					onClick={() => {
						void applyListingState(DEFAULT_LISTING_STATE, "replace");
					}}
				>
					Limpiar filtros
				</button>
			</aside>

			<section className="content">
				<div className="toolbar">
					<button
						id="toggle-sidebar"
						className="toggle-sidebar-btn"
						type="button"
						onClick={() => setSidebarOpen((current) => !current)}
					>
						Filtros
					</button>
					<span className="results-summary" aria-live="polite">
						{summary}
					</span>
					<div className="toolbar-right">
						<button
							id="view-grid"
							className={`view-btn${viewMode === "grid" ? " active" : ""}`}
							type="button"
							title="Cuadrícula"
							onClick={() => updateViewMode("grid")}
						>
							▦
						</button>
						<button
							id="view-list"
							className={`view-btn${viewMode === "list" ? " active" : ""}`}
							type="button"
							title="Lista"
							onClick={() => updateViewMode("list")}
						>
							☰
						</button>
					</div>
				</div>

				<div className={resourcesClassName} aria-live="polite">
					{loading ? <p className="loading">Cargando recursos...</p> : null}
					{!loading && error ? <p className="empty">{error}</p> : null}
					{!loading && !error && resources.length === 0 ? (
						<p className="empty">No se encontraron recursos.</p>
					) : null}
					{!loading && !error && resources.map((resource) => (
						<ResourceCard key={resource.id} resource={resource} />
					))}
				</div>

				<nav className="pagination" aria-label="Paginación" hidden={pagination.totalPages <= 1}>
					<button
						type="button"
						className="pag-btn"
						disabled={!pagination.hasPreviousPage}
						onClick={() => {
							void applyListingState(
								{ ...listingState, page: pagination.currentPage - 1 },
								"push",
								{ scrollToTop: true },
							);
						}}
					>
						← Anterior
					</button>
					<div className="pag-numbers">
						{paginationPages.map((page, index) => (
							page === "..." ? (
								<span key={`ellipsis-${index}`} className="pag-ellipsis">…</span>
							) : (
								<button
									key={page}
									type="button"
									className={`pag-num${page === pagination.currentPage ? " active" : ""}`}
									onClick={() => {
										void applyListingState(
											{ ...listingState, page },
											"push",
											{ scrollToTop: true },
										);
									}}
								>
									{page}
								</button>
							)
						))}
					</div>
					<button
						type="button"
						className="pag-btn"
						disabled={!pagination.hasNextPage}
						onClick={() => {
							void applyListingState(
								{ ...listingState, page: pagination.currentPage + 1 },
								"push",
								{ scrollToTop: true },
							);
						}}
					>
						Siguiente →
					</button>
				</nav>
			</section>
		</div>
	);
}
