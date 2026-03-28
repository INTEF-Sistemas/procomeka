import { getApiClient } from "./get-api-client.ts";
import { buildListingUrl, readListingState, writeListingStateToHistory } from "./listing-history.ts";
import { DEFAULT_PAGE_SIZE, getPaginationState } from "./pagination.ts";
import { url } from "./paths.ts";
import { loadFilterOptions, RESOURCE_TYPE_OPTIONS, LANGUAGE_OPTIONS, LICENSE_OPTIONS } from "./resource-filters.ts";
import { escapeHtml, TYPE_ICONS } from "./resource-display.ts";

function renderCard(r: Record<string, string>): string {
	const icon = TYPE_ICONS[r.resourceType] || "&#128196;";
	const desc = (r.description || "").slice(0, 140);
	const ellipsis = (r.description || "").length > 140 ? "..." : "";
	return `
		<a href="${url(`recurso?slug=${r.slug}`)}" class="resource-card">
			<div class="card-icon">${icon}</div>
			<div class="card-body">
				<h3>${escapeHtml(r.title || "")}</h3>
				<p>${escapeHtml(desc)}${ellipsis}</p>
				<div class="card-tags">
					<span class="pill pill-type">${escapeHtml(r.resourceType || "")}</span>
					<span class="pill pill-lang">${escapeHtml((r.language || "").toUpperCase())}</span>
					${r.license ? `<span class="pill pill-license">${escapeHtml(r.license)}</span>` : ""}
				</div>
				${r.createdByName ? `<span class="card-meta">${escapeHtml(r.createdByName)}</span>` : ""}
			</div>
		</a>`;
}

function renderPaginationHtml(currentPage: number, totalPages: number): string {
	const pages: (number | "...")[] = [];
	for (let i = 1; i <= totalPages; i++) {
		if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
			pages.push(i);
		} else if (pages.length > 0 && pages[pages.length - 1] !== "...") {
			pages.push("...");
		}
	}
	return pages.map((p) =>
		p === "..."
			? `<span class="pag-ellipsis">&hellip;</span>`
			: `<button class="pag-num${p === currentPage ? " active" : ""}" data-page="${p}">${p}</button>`
	).join("");
}

export function initCatalog() {
	const container = document.getElementById("resources-container") as HTMLDivElement;
	const summary = document.getElementById("results-summary") as HTMLElement;
	const searchInput = document.getElementById("header-search") as HTMLInputElement | null;
	const typeFilter = document.getElementById("filter-resource-type") as HTMLSelectElement;
	const langFilter = document.getElementById("filter-language") as HTMLSelectElement;
	const licFilter = document.getElementById("filter-license") as HTMLSelectElement;
	const clearBtn = document.getElementById("clear-filters") as HTMLButtonElement;
	const paginationEl = document.getElementById("pagination") as HTMLElement;
	const prevBtn = document.getElementById("pag-prev") as HTMLButtonElement;
	const nextBtn = document.getElementById("pag-next") as HTMLButtonElement;
	const pagNumbers = document.getElementById("pag-numbers") as HTMLDivElement;
	const viewGrid = document.getElementById("view-grid") as HTMLButtonElement;
	const viewList = document.getElementById("view-list") as HTMLButtonElement;
	const sidebar = document.getElementById("sidebar") as HTMLElement;
	const toggleSidebar = document.getElementById("toggle-sidebar") as HTMLButtonElement | null;

	let query = "";
	let page = 1;
	let resourceType = "";
	let language = "";
	let license = "";
	let viewMode = localStorage.getItem("catalog-view") || "grid";

	function setView(mode: string) {
		viewMode = mode;
		localStorage.setItem("catalog-view", mode);
		container.className = mode === "list" ? "resources-list-view" : "resources-grid";
		viewGrid.classList.toggle("active", mode === "grid");
		viewList.classList.toggle("active", mode === "list");
	}

	function readUrl() {
		const s = readListingState(window.location.search);
		query = s.query;
		page = s.page;
		resourceType = s.resourceType;
		language = s.language;
		license = s.license;
		if (searchInput) searchInput.value = query;
		typeFilter.value = resourceType;
		langFilter.value = language;
		licFilter.value = license;
	}

	function writeUrl(mode: "push" | "replace" = "replace") {
		writeListingStateToHistory(
			window.history,
			buildListingUrl(window.location.pathname, window.location.search, { query, page, resourceType, language, license }),
			mode,
		);
	}

	function updatePagination(total: number, limit: number) {
		const totalPages = Math.ceil(total / limit);

		if (totalPages <= 1) {
			paginationEl.hidden = true;
			return;
		}

		paginationEl.hidden = false;
		prevBtn.disabled = page <= 1;
		nextBtn.disabled = page >= totalPages;
		pagNumbers.innerHTML = renderPaginationHtml(page, totalPages);
	}

	async function load() {
		const offset = (page - 1) * DEFAULT_PAGE_SIZE;

		try {
			const api = await getApiClient();
			const result = await api.listResources({
				q: query || undefined,
				limit: DEFAULT_PAGE_SIZE,
				offset,
				resourceType: resourceType || undefined,
				language: language || undefined,
				license: license || undefined,
			});

			const { data, total, limit } = result;

			const maxPage = Math.max(1, Math.ceil(total / limit));
			if (page > maxPage) {
				page = 1;
				writeUrl("replace");
			}

			const s = getPaginationState(total, limit, (page - 1) * DEFAULT_PAGE_SIZE);
			summary.textContent = total === 0
				? "Sin resultados para la busqueda actual."
				: `${s.startItem}\u2013${s.endItem} de ${s.total} recursos`;

			if (data.length === 0) {
				container.innerHTML = `<p class="empty">No se encontraron recursos.</p>`;
				paginationEl.hidden = true;
				return;
			}

			container.innerHTML = data.map((r: Record<string, string>) => renderCard(r)).join("");
			updatePagination(total, limit);
		} catch {
			container.innerHTML = `<p class="empty">Error al cargar recursos.</p>`;
			summary.textContent = "";
			paginationEl.hidden = true;
		}
	}

	function goToPage(p: number) {
		page = p;
		writeUrl("push");
		load();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function resetAndLoad() {
		page = 1;
		writeUrl("replace");
		load();
	}


	let debounce: ReturnType<typeof setTimeout>;
	searchInput?.addEventListener("input", () => {
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			query = searchInput.value.trim();
			resetAndLoad();
		}, 300);
	});

	typeFilter.addEventListener("change", () => { resourceType = typeFilter.value; resetAndLoad(); });
	langFilter.addEventListener("change", () => { language = langFilter.value; resetAndLoad(); });
	licFilter.addEventListener("change", () => { license = licFilter.value; resetAndLoad(); });

	clearBtn.addEventListener("click", () => {
		if (searchInput) searchInput.value = "";
		typeFilter.value = "";
		langFilter.value = "";
		licFilter.value = "";
		query = "";
		resourceType = "";
		language = "";
		license = "";
		resetAndLoad();
	});

	prevBtn.addEventListener("click", () => { if (page > 1) goToPage(page - 1); });
	nextBtn.addEventListener("click", () => goToPage(page + 1));
	pagNumbers.addEventListener("click", (e) => {
		const btn = (e.target as HTMLElement).closest("[data-page]") as HTMLElement | null;
		if (btn) goToPage(Number(btn.dataset.page));
	});

	viewGrid.addEventListener("click", () => setView("grid"));
	viewList.addEventListener("click", () => setView("list"));
	toggleSidebar?.addEventListener("click", () => sidebar.classList.toggle("open"));
	window.addEventListener("popstate", () => { readUrl(); load(); });


	function populateSelect(select: HTMLSelectElement, options: { value: string; label: string }[]) {
		const current = select.value;
		select.innerHTML = options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("");
		select.value = current;
	}

	async function loadDynamicFilters() {
		const [types, langs, lics] = await Promise.all([
			loadFilterOptions("resource-type", "Todos los tipos", RESOURCE_TYPE_OPTIONS),
			loadFilterOptions("language", "Todos los idiomas", LANGUAGE_OPTIONS),
			loadFilterOptions("license", "Todas las licencias", LICENSE_OPTIONS),
		]);
		populateSelect(typeFilter, types);
		populateSelect(langFilter, langs);
		populateSelect(licFilter, lics);
	}

	setView(viewMode);
	loadDynamicFilters().then(() => {
		readUrl();
		load();
	});
}
