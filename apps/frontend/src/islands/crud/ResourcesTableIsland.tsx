import { startTransition, useEffect, useState } from "react";
import type { Resource } from "../../lib/api-client.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";
import { ConfirmDialog } from "../shared/ConfirmDialog.tsx";
import { CrudTable, type CrudColumn } from "./CrudTable.tsx";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, string> = {
	draft: "Borrador",
	review: "En revision",
	published: "Publicado",
	archived: "Archivado",
};

const STATUS_BADGES: Record<string, string> = {
	draft: "admin-badge--draft",
	review: "admin-badge--review",
	published: "admin-badge--published",
	archived: "admin-badge--archived",
};

function formatDate(dateValue: Resource["updatedAt"]) {
	if (!dateValue) return "-";
	return new Date(dateValue).toLocaleDateString("es-ES");
}

function statusLabel(status: string) {
	return STATUS_LABELS[status] ?? status;
}

function statusBadgeClass(status: string) {
	return STATUS_BADGES[status] ?? "";
}

export function ResourcesTableIsland() {
	const [rows, setRows] = useState<Resource[]>([]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [appliedStatus, setAppliedStatus] = useState("");
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [statusMessage, setStatusMessage] = useState("Cargando recursos...");
	const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
	const [busyAction, setBusyAction] = useState<"delete" | null>(null);

	async function loadResources(nextOffset = offset, nextSearch = appliedSearch, nextStatus = appliedStatus) {
		setStatusMessage("Cargando recursos...");

		try {
			const api = await getApiClient();
			const result = await api.listAdminResources({
				q: nextSearch || undefined,
				status: nextStatus || undefined,
				limit: PAGE_SIZE,
				offset: nextOffset,
			});

			startTransition(() => {
				setRows(result.data);
				setOffset(result.offset);
				setTotal(result.total);
				setStatusMessage(`${result.total} recursos encontrados`);
			});
		} catch {
			setRows([]);
			setTotal(0);
			setStatusMessage("No se pudieron cargar los recursos.");
		}
	}

	useEffect(() => {
		void loadResources(0, "", "");
	}, []);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

	const columns: CrudColumn<Resource>[] = [
		{
			id: "title",
			header: "Titulo",
			cell: (row) => row.title,
		},
		{
			id: "type",
			header: "Tipo",
			cell: (row) => row.resourceType ?? "-",
		},
		{
			id: "language",
			header: "Idioma",
			cell: (row) => row.language ?? "-",
		},
		{
			id: "status",
			header: "Estado",
			cell: (row) => (
				<span className={`admin-badge ${statusBadgeClass(row.editorialStatus)}`.trim()}>
					{statusLabel(row.editorialStatus)}
				</span>
			),
		},
		{
			id: "authorship",
			header: "Autoria",
			cell: (row) => row.createdByName ?? row.author ?? "Sin autoria",
		},
		{
			id: "updatedAt",
			header: "Actualizado",
			cell: (row) => formatDate(row.updatedAt),
		},
		{
			id: "actions",
			header: "Acciones",
			className: "actions-cell",
			cell: (row) => (
				<>
					<a href={url(`admin/recursos/editar?id=${row.id}`)} className="admin-btn admin-btn--sm">
						Editar
					</a>
					<button
						type="button"
						className="admin-btn admin-btn--sm admin-btn--danger"
						disabled={busyAction === "delete"}
						onClick={() => setDeleteTarget(row)}
					>
						Eliminar
					</button>
				</>
			),
		},
	];

	async function applyFilters() {
		const nextSearch = search.trim();
		setAppliedSearch(nextSearch);
		setAppliedStatus(statusFilter);
		setOffset(0);
		await loadResources(0, nextSearch, statusFilter);
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		setBusyAction("delete");

		try {
			const api = await getApiClient();
			await api.deleteResource(deleteTarget.id);
			const nextOffset = rows.length === 1 && offset > 0 ? Math.max(0, offset - PAGE_SIZE) : offset;
			setDeleteTarget(null);
			await loadResources(nextOffset, appliedSearch, appliedStatus);
		} catch {
			setStatusMessage("No se pudo eliminar el recurso.");
		} finally {
			setBusyAction(null);
		}
	}

	return (
		<>
			<section className="admin-toolbar">
				<label>
					Busqueda
					<input
						type="search"
						placeholder="Titulo, descripcion o autor"
						value={search}
						onChange={(event) => setSearch(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								void applyFilters();
							}
						}}
					/>
				</label>
				<label>
					Estado
					<select value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value)}>
						<option value="">Todos</option>
						<option value="draft">Borrador</option>
						<option value="review">En revision</option>
						<option value="published">Publicado</option>
						<option value="archived">Archivado</option>
					</select>
				</label>
				<button type="button" className="admin-btn" onClick={() => void applyFilters()}>
					Aplicar
				</button>
			</section>

			<div className="admin-list-status" aria-live="polite">
				{statusMessage}
			</div>

			<CrudTable
				columns={columns}
				rows={rows}
				getRowKey={(row) => row.id}
				emptyMessage="No hay recursos para los filtros actuales."
			 />

			<div className="admin-pager" hidden={total <= PAGE_SIZE}>
				<button
					type="button"
					onClick={() => void loadResources(Math.max(0, offset - PAGE_SIZE), appliedSearch, appliedStatus)}
					disabled={offset === 0}
				>
					Anterior
				</button>
				<span className="admin-pager-label">{`Pagina ${currentPage} de ${totalPages}`}</span>
				<button
					type="button"
					onClick={() => void loadResources(offset + PAGE_SIZE, appliedSearch, appliedStatus)}
					disabled={offset + PAGE_SIZE >= total}
				>
					Siguiente
				</button>
			</div>

			<ConfirmDialog
				open={deleteTarget !== null}
				title="Eliminar recurso"
				message={`Seguro que deseas eliminar "${deleteTarget?.title ?? "este recurso"}"?`}
				confirmLabel="Eliminar"
				busy={busyAction === "delete"}
				onCancel={() => setDeleteTarget(null)}
				onConfirm={() => void handleDelete()}
			/>
		</>
	);
}
