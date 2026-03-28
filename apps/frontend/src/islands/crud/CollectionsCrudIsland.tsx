import { startTransition, useEffect, useState, type FormEvent } from "react";
import type { CollectionRecord } from "../../lib/api-client.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { AccessibleFeedback } from "../shared/AccessibleFeedback.tsx";
import { ConfirmDialog } from "../shared/ConfirmDialog.tsx";
import { ModalFrame } from "../shared/ModalFrame.tsx";
import { CrudTable, type CrudColumn } from "./CrudTable.tsx";

const PAGE_SIZE = 20;

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

interface CollectionFormState {
	title: string;
	description: string;
	editorialStatus: string;
	isOrdered: boolean;
}

const EMPTY_CREATE_FORM: CollectionFormState = {
	title: "",
	description: "",
	editorialStatus: "draft",
	isOrdered: false,
};

const EMPTY_EDIT_FORM: CollectionFormState = {
	title: "",
	description: "",
	editorialStatus: "draft",
	isOrdered: false,
};

function formatDate(dateValue: CollectionRecord["updatedAt"]) {
	if (!dateValue) return "-";
	return new Date(dateValue).toLocaleDateString("es-ES");
}

function truncate(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
}

function statusLabel(status: string) {
	return STATUS_LABELS[status] ?? status;
}

function statusBadgeClass(status: string) {
	return STATUS_BADGES[status] ?? "";
}

function isOrderedValue(value: CollectionRecord["isOrdered"] | boolean) {
	return Boolean(value);
}

export function CollectionsCrudIsland() {
	const [rows, setRows] = useState<CollectionRecord[]>([]);
	const [search, setSearch] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [statusMessage, setStatusMessage] = useState("Cargando colecciones...");
	const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
	const [createFeedback, setCreateFeedback] = useState({ message: "", variant: "neutral" as const });
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
	const [editError, setEditError] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<CollectionRecord | null>(null);
	const [busyAction, setBusyAction] = useState<"create" | "edit" | "delete" | "load-edit" | null>(null);

	async function loadCollections(nextOffset = offset, nextSearch = appliedSearch) {
		setStatusMessage("Cargando colecciones...");

		try {
			const api = await getApiClient();
			const result = await api.listCollections({
				q: nextSearch || undefined,
				limit: PAGE_SIZE,
				offset: nextOffset,
			});

			startTransition(() => {
				setRows(result.data);
				setOffset(result.offset);
				setTotal(result.total);
				setStatusMessage(`${result.total} colecciones encontradas`);
			});
		} catch {
			setRows([]);
			setTotal(0);
			setStatusMessage("No se pudieron cargar las colecciones.");
		}
	}

	useEffect(() => {
		void loadCollections(0, "");
	}, []);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

	const columns: CrudColumn<CollectionRecord>[] = [
		{
			id: "title",
			header: "Titulo",
			cell: (row) => row.title,
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
			id: "description",
			header: "Descripcion",
			cell: (row) => truncate(row.description ?? "", 60) || "-",
		},
		{
			id: "ordered",
			header: "Orden fija",
			cell: (row) => (isOrderedValue(row.isOrdered) ? "Si" : "No"),
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
					<button
						type="button"
						className="admin-btn admin-btn--sm"
						disabled={busyAction === "load-edit"}
						onClick={() => void handleEditOpen(row.id)}
					>
						Editar
					</button>
					<button
						type="button"
						className="admin-btn admin-btn--sm admin-btn--danger"
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
		setOffset(0);
		await loadCollections(0, nextSearch);
	}

	async function handleEditOpen(id: string) {
		setBusyAction("load-edit");
		setEditError("");

		try {
			const api = await getApiClient();
			const collection = await api.getCollectionById(id);
			if (!collection) {
				setStatusMessage("No se pudo cargar la coleccion seleccionada.");
				return;
			}

			setEditingId(collection.id);
			setEditForm({
				title: collection.title,
				description: collection.description,
				editorialStatus: collection.editorialStatus,
				isOrdered: isOrderedValue(collection.isOrdered),
			});
		} catch {
			setStatusMessage("No se pudo cargar la coleccion seleccionada.");
		} finally {
			setBusyAction(null);
		}
	}

	async function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusyAction("create");
		setCreateFeedback({ message: "", variant: "neutral" });

		try {
			const api = await getApiClient();
			await api.createCollection({
				title: createForm.title,
				description: createForm.description,
				isOrdered: createForm.isOrdered,
			});
			setCreateForm(EMPTY_CREATE_FORM);
			setCreateFeedback({ message: "Coleccion creada.", variant: "success" });
			await loadCollections(0, appliedSearch);
		} catch {
			setCreateFeedback({ message: "Error al crear la coleccion.", variant: "error" });
		} finally {
			setBusyAction(null);
		}
	}

	async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editingId) return;

		setBusyAction("edit");
		setEditError("");

		try {
			const api = await getApiClient();
			const result = await api.updateCollection(editingId, {
				title: editForm.title,
				description: editForm.description,
				editorialStatus: editForm.editorialStatus,
				isOrdered: editForm.isOrdered,
			});
			if (!result.ok) {
				setEditError(result.error ?? "Error al guardar.");
				return;
			}

			setEditingId(null);
			await loadCollections(offset, appliedSearch);
		} catch {
			setEditError("Error de conexion.");
		} finally {
			setBusyAction(null);
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		setBusyAction("delete");

		try {
			const api = await getApiClient();
			await api.deleteCollection(deleteTarget.id);
			const nextOffset = rows.length === 1 && offset > 0 ? Math.max(0, offset - PAGE_SIZE) : offset;
			setDeleteTarget(null);
			await loadCollections(nextOffset, appliedSearch);
		} catch {
			setStatusMessage("No se pudo eliminar la coleccion.");
		} finally {
			setBusyAction(null);
		}
	}

	return (
		<>
			<section className="admin-form-card">
				<h2>Nueva coleccion</h2>
				<form onSubmit={handleCreate}>
					<div className="admin-form-grid">
						<label>
							Titulo
							<input
								value={createForm.title}
								onChange={(event) => {
									const value = event.currentTarget.value;
									setCreateForm((current) => ({ ...current, title: value }));
								}}
								required
							/>
						</label>
						<label className="full">
							Descripcion
							<textarea
								rows={2}
								value={createForm.description}
								onChange={(event) => {
									const value = event.currentTarget.value;
									setCreateForm((current) => ({ ...current, description: value }));
								}}
								required
							/>
						</label>
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={createForm.isOrdered}
								onChange={(event) => {
									const checked = event.currentTarget.checked;
									setCreateForm((current) => ({ ...current, isOrdered: checked }));
								}}
							/>
							{" "}
							Orden fija
						</label>
					</div>
					<div className="admin-form-actions">
						<button type="submit" className="admin-btn admin-btn--primary" disabled={busyAction === "create"}>
							{busyAction === "create" ? "Creando..." : "Crear coleccion"}
						</button>
					</div>
				</form>
				<AccessibleFeedback
					id="collections-create-feedback"
					message={createFeedback.message}
					variant={createFeedback.variant}
				/>
			</section>

			<section className="admin-toolbar">
				<label>
					Busqueda
					<input
						type="search"
						placeholder="Titulo o descripcion"
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
				emptyMessage="No hay colecciones para los filtros actuales."
			/>

			<div className="admin-pager" hidden={total <= PAGE_SIZE}>
				<button
					type="button"
					onClick={() => void loadCollections(Math.max(0, offset - PAGE_SIZE), appliedSearch)}
					disabled={offset === 0}
				>
					Anterior
				</button>
				<span className="admin-pager-label">
					{`Pagina ${currentPage} de ${totalPages}`}
				</span>
				<button
					type="button"
					onClick={() => void loadCollections(offset + PAGE_SIZE, appliedSearch)}
					disabled={offset + PAGE_SIZE >= total}
				>
					Siguiente
				</button>
			</div>

			{editingId
				? (
					<ModalFrame
						open={editingId !== null}
						className="admin-edit-dialog"
						titleId="edit-collection-title"
						onClose={() => {
							setEditingId(null);
							setEditError("");
						}}
					>
						<h2 id="edit-collection-title">Editar coleccion</h2>
						<form onSubmit={handleEditSubmit}>
							<label>
								Titulo
								<input
									value={editForm.title}
									onChange={(event) => {
										const value = event.currentTarget.value;
										setEditForm((current) => ({ ...current, title: value }));
									}}
									required
								/>
							</label>
							<label>
								Descripcion
								<textarea
									rows={3}
									value={editForm.description}
									onChange={(event) => {
										const value = event.currentTarget.value;
										setEditForm((current) => ({ ...current, description: value }));
									}}
									required
								/>
							</label>
							<label>
								Estado
								<select
									value={editForm.editorialStatus}
									onChange={(event) => {
										const value = event.currentTarget.value;
										setEditForm((current) => ({ ...current, editorialStatus: value }));
									}}
								>
									<option value="draft">Borrador</option>
									<option value="review">En revision</option>
									<option value="published">Publicado</option>
									<option value="archived">Archivado</option>
								</select>
							</label>
							<label className="checkbox-label">
								<input
									type="checkbox"
									checked={editForm.isOrdered}
									onChange={(event) => {
										const checked = event.currentTarget.checked;
										setEditForm((current) => ({ ...current, isOrdered: checked }));
									}}
								/>
								{" "}
								Orden fija
							</label>
							<AccessibleFeedback message={editError} variant="error" polite={false} />
							<div className="admin-dialog-actions">
								<button
									type="button"
									id="edit-cancel"
									className="admin-btn"
									onClick={() => {
										setEditingId(null);
										setEditError("");
									}}
									disabled={busyAction === "edit"}
								>
									Cancelar
								</button>
								<button type="submit" className="admin-btn admin-btn--primary" disabled={busyAction === "edit"}>
									{busyAction === "edit" ? "Guardando..." : "Guardar"}
								</button>
							</div>
						</form>
					</ModalFrame>
				)
				: null}

			<ConfirmDialog
				open={deleteTarget !== null}
				title="Eliminar coleccion"
				message={`Seguro que deseas eliminar "${deleteTarget?.title ?? "esta coleccion"}"?`}
				confirmLabel="Eliminar"
				busy={busyAction === "delete"}
				onCancel={() => setDeleteTarget(null)}
				onConfirm={() => void handleDelete()}
			/>
		</>
	);
}
