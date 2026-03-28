import { startTransition, useEffect, useState } from "react";
import type { UserRecord } from "../../lib/api-client.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { AccessibleFeedback } from "../shared/AccessibleFeedback.tsx";
import { CrudTable, type CrudColumn } from "./CrudTable.tsx";

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
	{ value: "reader", label: "reader" },
	{ value: "author", label: "author" },
	{ value: "curator", label: "curator" },
	{ value: "admin", label: "admin" },
] as const;

function formatDate(dateValue: UserRecord["updatedAt"]) {
	if (!dateValue) return "-";
	return new Date(dateValue).toLocaleDateString("es-ES");
}

export function UsersCrudIsland() {
	const [rows, setRows] = useState<UserRecord[]>([]);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [appliedRole, setAppliedRole] = useState("");
	const [draftRoles, setDraftRoles] = useState<Record<string, string>>({});
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [statusMessage, setStatusMessage] = useState("Cargando usuarios...");
	const [saveFeedback, setSaveFeedback] = useState({ message: "", variant: "neutral" as const });
	const [busyRowId, setBusyRowId] = useState<string | null>(null);

	async function loadUsers(nextOffset = offset, nextSearch = appliedSearch, nextRole = appliedRole) {
		setStatusMessage("Cargando usuarios...");

		try {
			const api = await getApiClient();
			const result = await api.listUsers({
				q: nextSearch || undefined,
				role: nextRole || undefined,
				limit: PAGE_SIZE,
				offset: nextOffset,
			});

			startTransition(() => {
				setRows(result.data);
				setDraftRoles(Object.fromEntries(result.data.map((user) => [user.id, user.role])));
				setOffset(result.offset);
				setTotal(result.total);
				setStatusMessage(`${result.total} usuarios encontrados`);
			});
		} catch {
			setRows([]);
			setDraftRoles({});
			setTotal(0);
			setStatusMessage("No se pudieron cargar los usuarios.");
		}
	}

	useEffect(() => {
		void loadUsers(0, "", "");
	}, []);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

	const columns: CrudColumn<UserRecord>[] = [
		{
			id: "name",
			header: "Nombre",
			cell: (row) => row.name ?? "-",
		},
		{
			id: "email",
			header: "Email",
			cell: (row) => row.email,
		},
		{
			id: "role",
			header: "Rol",
			cell: (row) => (
				<select
					value={draftRoles[row.id] ?? row.role}
					onChange={(event) => {
						const value = event.currentTarget.value;
						setDraftRoles((current) => ({ ...current, [row.id]: value }));
					}}
					disabled={busyRowId === row.id}
				>
					{ROLE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			),
		},
		{
			id: "status",
			header: "Estado",
			cell: (row) => (
				<span className={`admin-badge ${row.isActive ? "admin-badge--active" : "admin-badge--inactive"}`}>
					{row.isActive ? "Activo" : "Inactivo"}
				</span>
			),
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
						disabled={busyRowId === row.id}
						onClick={() => void handleSaveRole(row)}
					>
						Guardar
					</button>
					<button
						type="button"
						className="admin-btn admin-btn--sm admin-btn--ghost"
						disabled={busyRowId === row.id}
						onClick={() => void handleToggleActive(row)}
					>
						{row.isActive ? "Desactivar" : "Activar"}
					</button>
				</>
			),
		},
	];

	async function applyFilters() {
		const nextSearch = search.trim();
		setAppliedSearch(nextSearch);
		setAppliedRole(roleFilter);
		setOffset(0);
		await loadUsers(0, nextSearch, roleFilter);
	}

	async function handleSaveRole(user: UserRecord) {
		const nextRole = draftRoles[user.id] ?? user.role;
		setBusyRowId(user.id);
		setSaveFeedback({ message: "", variant: "neutral" });

		try {
			const api = await getApiClient();
			const result = await api.updateUser(user.id, { role: nextRole });
			if (!result.ok) {
				setSaveFeedback({ message: result.error ?? "Error al guardar.", variant: "error" });
				return;
			}

			setRows((current) => current.map((row) => row.id === user.id ? { ...row, role: nextRole } : row));
			setSaveFeedback({ message: "Usuario actualizado.", variant: "success" });
		} catch {
			setSaveFeedback({ message: "Error de conexion.", variant: "error" });
		} finally {
			setBusyRowId(null);
		}
	}

	async function handleToggleActive(user: UserRecord) {
		setBusyRowId(user.id);
		setSaveFeedback({ message: "", variant: "neutral" });

		try {
			const api = await getApiClient();
			const nextActive = !user.isActive;
			const result = await api.updateUser(user.id, { isActive: nextActive });
			if (!result.ok) {
				setSaveFeedback({ message: result.error ?? "Error al cambiar estado.", variant: "error" });
				return;
			}

			setRows((current) => current.map((row) => row.id === user.id ? { ...row, isActive: nextActive } : row));
			setSaveFeedback({ message: "Estado de usuario actualizado.", variant: "success" });
		} catch {
			setSaveFeedback({ message: "Error de conexion.", variant: "error" });
		} finally {
			setBusyRowId(null);
		}
	}

	return (
		<>
			<section className="admin-toolbar">
				<label>
					Busqueda
					<input
						type="search"
						placeholder="Nombre o email"
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
					Rol
					<select value={roleFilter} onChange={(event) => setRoleFilter(event.currentTarget.value)}>
						<option value="">Todos</option>
						{ROLE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label[0]?.toUpperCase()}{option.label.slice(1)}
							</option>
						))}
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
				emptyMessage="No hay usuarios para los filtros actuales."
			/>

			<div className="admin-pager" hidden={total <= PAGE_SIZE}>
				<button
					type="button"
					onClick={() => void loadUsers(Math.max(0, offset - PAGE_SIZE), appliedSearch, appliedRole)}
					disabled={offset === 0}
				>
					Anterior
				</button>
				<span className="admin-pager-label">
					{`Pagina ${currentPage} de ${totalPages}`}
				</span>
				<button
					type="button"
					onClick={() => void loadUsers(offset + PAGE_SIZE, appliedSearch, appliedRole)}
					disabled={offset + PAGE_SIZE >= total}
				>
					Siguiente
				</button>
			</div>

			<AccessibleFeedback
				id="users-save-feedback"
				message={saveFeedback.message}
				variant={saveFeedback.variant}
			/>
		</>
	);
}
