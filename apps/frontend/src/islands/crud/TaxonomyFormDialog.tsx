import type { FormEvent } from "react";
import { ModalFrame } from "../shared/ModalFrame.tsx";
import { TAXONOMY_TYPE_OPTIONS, type TaxonomyType } from "./taxonomy-options.ts";

interface TaxonomyFormValues {
	name: string;
	slug: string;
	type: TaxonomyType;
}

interface TaxonomyFormDialogProps {
	open: boolean;
	values: TaxonomyFormValues;
	error: string;
	busy?: boolean;
	onChange: (field: keyof TaxonomyFormValues, value: string) => void;
	onCancel: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function TaxonomyFormDialog({
	open,
	values,
	error,
	busy = false,
	onChange,
	onCancel,
	onSubmit,
}: TaxonomyFormDialogProps) {
	if (!open) return null;

	return (
		<ModalFrame open={open} className="admin-edit-dialog" titleId="edit-taxonomy-title" onClose={onCancel}>
			<h2 id="edit-taxonomy-title">Editar categoria</h2>
			<form onSubmit={onSubmit}>
				<label>
					Nombre
					<input
						value={values.name}
						onChange={(event) => {
							const value = event.currentTarget.value;
							onChange("name", value);
						}}
						required
					/>
				</label>
				<label>
					Slug
					<input
						value={values.slug}
						onChange={(event) => {
							const value = event.currentTarget.value;
							onChange("slug", value);
						}}
					/>
				</label>
				<label>
					Tipo
					<select
						value={values.type}
						onChange={(event) => {
							const value = event.currentTarget.value;
							onChange("type", value);
						}}
					>
						{TAXONOMY_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<div className="dialog-error" role="alert" aria-live="polite">
					{error}
				</div>
				<div className="admin-dialog-actions">
					<button type="button" className="admin-btn" onClick={onCancel} disabled={busy}>
						Cancelar
					</button>
					<button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
						{busy ? "Guardando..." : "Guardar"}
					</button>
				</div>
			</form>
		</ModalFrame>
	);
}
