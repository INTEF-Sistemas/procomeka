import { useEffect, useState, type FormEvent } from "react";
import type { CreateResourceInput, UpdateResourceInput } from "../../lib/api-client.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";
import { AccessibleFeedback } from "../shared/AccessibleFeedback.tsx";
import { LANGUAGE_OPTIONS, LICENSE_OPTIONS, RESOURCE_TYPE_OPTIONS } from "./resource-form-options.ts";

interface ResourceFormState {
	title: string;
	description: string;
	language: string;
	license: string;
	resourceType: string;
	author: string;
	keywords: string;
}

interface ResourceFormIslandProps {
	mode: "create" | "edit";
	resourceId?: string;
}

const EMPTY_FORM: ResourceFormState = {
	title: "",
	description: "",
	language: "es",
	license: "cc-by",
	resourceType: "documento",
	author: "",
	keywords: "",
};

function hasAuthorAccess(role: string | undefined) {
	const hierarchy = ["reader", "author", "curator", "admin"];
	return hierarchy.indexOf(role ?? "reader") >= 1;
}

function toFormState(resource: Partial<ResourceFormState & { author?: string | null; keywords?: string | null }>) {
	return {
		title: resource.title ?? "",
		description: resource.description ?? "",
		language: resource.language ?? "es",
		license: resource.license ?? "cc-by",
		resourceType: resource.resourceType ?? "documento",
		author: resource.author ?? "",
		keywords: resource.keywords ?? "",
	};
}

function toPayload(form: ResourceFormState): CreateResourceInput | UpdateResourceInput {
	return {
		title: form.title,
		description: form.description,
		language: form.language,
		license: form.license,
		resourceType: form.resourceType,
		author: form.author || undefined,
		keywords: form.keywords || undefined,
	};
}

export function ResourceFormIsland({ mode, resourceId }: ResourceFormIslandProps) {
	const [form, setForm] = useState<ResourceFormState>(EMPTY_FORM);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [showAuthCheck, setShowAuthCheck] = useState(false);
	const [showNotFound, setShowNotFound] = useState(false);
	const [loading, setLoading] = useState(mode === "edit");
	const [ready, setReady] = useState(mode === "create");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (mode !== "edit") return;
		if (!resourceId) {
			setLoading(false);
			setShowNotFound(true);
			return;
		}

		void (async () => {
			try {
				const api = await getApiClient();
				const session = await api.getSession();
				if (!session?.user || !hasAuthorAccess(session.user.role)) {
					setShowAuthCheck(true);
					setLoading(false);
					return;
				}

				const resource = await api.getResourceById(resourceId);
				if (!resource) {
					setShowNotFound(true);
					setLoading(false);
					return;
				}

				setForm(toFormState(resource));
				setReady(true);
			} catch {
				setShowNotFound(true);
			} finally {
				setLoading(false);
			}
		})();
	}, [mode, resourceId]);

	useEffect(() => {
		if (mode !== "create") return;
		void (async () => {
			try {
				const api = await getApiClient();
				const session = await api.getSession();
				if (!session?.user || !hasAuthorAccess(session.user.role)) {
					setShowAuthCheck(true);
					setReady(false);
					return;
				}
				setReady(true);
			} catch {
				setShowAuthCheck(true);
				setReady(false);
			}
		})();
	}, [mode]);

	function setFieldValue(field: keyof ResourceFormState, value: string) {
		setForm((current) => ({ ...current, [field]: value }));
		setFieldErrors((current) => ({ ...current, [field]: "" }));
	}

	function applyFieldErrors(details: { field: string; message: string }[]) {
		setFieldErrors(Object.fromEntries(details.map((detail) => [detail.field, detail.message])));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setErrorMessage("");
		setSuccessMessage("");
		setFieldErrors({});

		try {
			const api = await getApiClient();
			if (mode === "create") {
				const created = await api.createResource(toPayload(form) as CreateResourceInput);
				setSuccessMessage("Recurso creado. Redirigiendo al editor para adjuntar archivos…");
				window.setTimeout(() => {
					window.location.href = url(`admin/recursos/editar?id=${created.id}`);
				}, 500);
				return;
			}

			const result = await api.updateResource(resourceId!, toPayload(form) as UpdateResourceInput);
			if (!result.ok) {
				if (result.details) applyFieldErrors(result.details);
				setErrorMessage(result.error ?? "Error al actualizar el recurso");
				return;
			}
			setSuccessMessage("Recurso actualizado correctamente.");
		} catch (error) {
			const known = error as { details?: { field: string; message: string }[]; error?: string };
			if (known.details) applyFieldErrors(known.details);
			setErrorMessage(known.error ?? (mode === "create" ? "Error al crear el recurso" : "Error de conexión"));
		} finally {
			setBusy(false);
		}
	}

	if (showAuthCheck) {
		return (
			<div id="auth-check">
				<p>
					Necesitas <a id="login-link" href={url("login")}>iniciar sesión</a> como autor o superior para
					{" "}
					{mode === "create" ? "crear" : "editar"}
					{" "}
					recursos.
				</p>
			</div>
		);
	}

	if (showNotFound) {
		return (
			<div id="not-found">
				<p>Recurso no encontrado.</p>
				<a id="dashboard-link" href={url("dashboard")}>Volver al panel</a>
			</div>
		);
	}

	if (loading) {
		return <div id="loading">Cargando recurso...</div>;
	}

	if (!ready) return null;

	return (
		<>
			<AccessibleFeedback message={errorMessage} variant="error" polite={false} />
			<AccessibleFeedback message={successMessage} variant="success" />

			<form id="resource-form" onSubmit={handleSubmit} noValidate>
				<div className="field">
					<label htmlFor="title">Título *</label>
					<input
						type="text"
						id="title"
						required
						aria-describedby="title-error"
						aria-invalid={fieldErrors.title ? "true" : undefined}
						value={form.title}
						onChange={(event) => setFieldValue("title", event.currentTarget.value)}
					/>
					<span id="title-error" className="field-error" role="alert">{fieldErrors.title ?? ""}</span>
				</div>

				<div className="field">
					<label htmlFor="description">Descripción *</label>
					<textarea
						id="description"
						rows={4}
						required
						aria-describedby="description-error"
						aria-invalid={fieldErrors.description ? "true" : undefined}
						value={form.description}
						onChange={(event) => setFieldValue("description", event.currentTarget.value)}
					/>
					<span id="description-error" className="field-error" role="alert">{fieldErrors.description ?? ""}</span>
				</div>

				<div className="row">
					<div className="field">
						<label htmlFor="language">Idioma *</label>
						<select
							id="language"
							required
							aria-describedby="language-error"
							aria-invalid={fieldErrors.language ? "true" : undefined}
							value={form.language}
							onChange={(event) => setFieldValue("language", event.currentTarget.value)}
						>
							{LANGUAGE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
						<span id="language-error" className="field-error" role="alert">{fieldErrors.language ?? ""}</span>
					</div>

					<div className="field">
						<label htmlFor="license">Licencia *</label>
						<select
							id="license"
							required
							aria-describedby="license-error"
							aria-invalid={fieldErrors.license ? "true" : undefined}
							value={form.license}
							onChange={(event) => setFieldValue("license", event.currentTarget.value)}
						>
							{LICENSE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>{option.label}</option>
							))}
						</select>
						<span id="license-error" className="field-error" role="alert">{fieldErrors.license ?? ""}</span>
					</div>
				</div>

				<div className="field">
					<label htmlFor="resourceType">Tipo de recurso *</label>
					<select
						id="resourceType"
						required
						aria-describedby="resourceType-error"
						aria-invalid={fieldErrors.resourceType ? "true" : undefined}
						value={form.resourceType}
						onChange={(event) => setFieldValue("resourceType", event.currentTarget.value)}
					>
						{RESOURCE_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
					<span id="resourceType-error" className="field-error" role="alert">{fieldErrors.resourceType ?? ""}</span>
				</div>

				<div className="field">
					<label htmlFor="author">Autor</label>
					<input
						type="text"
						id="author"
						aria-describedby="author-error"
						aria-invalid={fieldErrors.author ? "true" : undefined}
						value={form.author}
						onChange={(event) => setFieldValue("author", event.currentTarget.value)}
					/>
					<span id="author-error" className="field-error" role="alert">{fieldErrors.author ?? ""}</span>
				</div>

				<div className="field">
					<label htmlFor="keywords">Palabras clave (separadas por comas)</label>
					<input
						type="text"
						id="keywords"
						placeholder="matemáticas, fracciones, visual"
						aria-describedby="keywords-error"
						aria-invalid={fieldErrors.keywords ? "true" : undefined}
						value={form.keywords}
						onChange={(event) => setFieldValue("keywords", event.currentTarget.value)}
					/>
					<span id="keywords-error" className="field-error" role="alert">{fieldErrors.keywords ?? ""}</span>
				</div>

				<button type="submit" id="submit-btn" disabled={busy}>
					{busy ? (mode === "create" ? "Creando..." : "Guardando...") : (mode === "create" ? "Crear recurso" : "Guardar cambios")}
				</button>
			</form>
		</>
	);
}
