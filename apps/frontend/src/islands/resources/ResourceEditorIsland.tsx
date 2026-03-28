import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import type { Resource, UpdateResourceInput } from "../../lib/api-client.ts";
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

const EMPTY_FORM: ResourceFormState = {
	title: "",
	description: "",
	language: "es",
	license: "cc-by",
	resourceType: "documento",
	author: "",
	keywords: "",
};

const ROLE_LEVELS: Record<string, number> = { reader: 0, author: 1, curator: 2, admin: 3 };
const STEPS = ["draft", "review", "published"] as const;
const STEP_LABELS: Record<string, string> = {
	draft: "Borrador",
	review: "En revisión",
	published: "Aprobado",
};
const TRANSITION_RULES: Record<string, { to: string; minRole: string }[]> = {
	draft: [{ to: "review", minRole: "author" }],
	review: [{ to: "draft", minRole: "curator" }, { to: "published", minRole: "curator" }],
	published: [{ to: "archived", minRole: "curator" }],
	archived: [{ to: "draft", minRole: "curator" }],
};
const TRANSITION_LABELS: Record<string, string> = {
	"draft→review": "Enviar a revisión",
	"review→draft": "Devolver a borrador",
	"review→published": "Aprobar",
	"published→archived": "Archivar",
	"archived→draft": "Restaurar a borrador",
};
const TRANSITION_STYLES: Record<string, string> = {
	"draft→review": "btn-gold",
	"review→draft": "btn-outline",
	"review→published": "btn-green",
	"published→archived": "btn-gray",
	"archived→draft": "btn-outline",
};

function hasAuthorAccess(role: string | undefined) {
	const hierarchy = ["reader", "author", "curator", "admin"];
	return hierarchy.indexOf(role ?? "reader") >= 1;
}

function toFormState(resource: Resource): ResourceFormState {
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

function toPayload(form: ResourceFormState): UpdateResourceInput {
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

export function ResourceEditorIsland() {
	const uploadPanelRef = useRef<HTMLElement | null>(null);
	const uploaderInstanceRef = useRef<{ destroy(): void } | null>(null);
	const resourceId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;

	const [form, setForm] = useState<ResourceFormState>(EMPTY_FORM);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [workflowError, setWorkflowError] = useState("");
	const [workflowSuccess, setWorkflowSuccess] = useState("");
	const [showAuthCheck, setShowAuthCheck] = useState(false);
	const [showNotFound, setShowNotFound] = useState(false);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState("reader");
	const [resource, setResource] = useState<Resource | null>(null);
	const [currentStatus, setCurrentStatus] = useState("draft");
	const [busy, setBusy] = useState(false);
	const [busyTransition, setBusyTransition] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState("");

	useEffect(() => {
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

				setUserRole(session.user.role ?? "reader");
				const found = await api.getResourceById(resourceId);
				if (!found) {
					setShowNotFound(true);
					setLoading(false);
					return;
				}

				setResource(found);
				setForm(toFormState(found));
				setCurrentStatus(found.editorialStatus ?? "draft");
			} catch {
				setShowNotFound(true);
			} finally {
				setLoading(false);
			}
		})();
	}, [resourceId]);

	useEffect(() => {
		if (!resourceId || !resource || !uploadPanelRef.current) return;

		let cancelled = false;
		void (async () => {
			try {
				const api = await getApiClient();
				const { initResourceUploader } = await import("../../lib/resource-uploader.ts");
				if (cancelled || !uploadPanelRef.current) return;
				uploaderInstanceRef.current?.destroy();
				uploaderInstanceRef.current = await initResourceUploader({
					resourceId,
					root: uploadPanelRef.current,
					api,
				});
				setUploadError("");
			} catch {
				if (!cancelled) {
					setUploadError("No se pudo inicializar el panel de archivos. Recarga la página para reintentar.");
				}
			}
		})();

		return () => {
			cancelled = true;
			uploaderInstanceRef.current?.destroy();
			uploaderInstanceRef.current = null;
		};
	}, [resourceId, resource]);

	function setFieldValue(field: keyof ResourceFormState, value: string) {
		setForm((current) => ({ ...current, [field]: value }));
		setFieldErrors((current) => ({ ...current, [field]: "" }));
	}

	function applyFieldErrors(details: { field: string; message: string }[]) {
		setFieldErrors(Object.fromEntries(details.map((detail) => [detail.field, detail.message])));
	}

	async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
		event?.preventDefault();
		if (!resourceId) return;
		setBusy(true);
		setErrorMessage("");
		setSuccessMessage("");
		setFieldErrors({});

		try {
			const api = await getApiClient();
			const result = await api.updateResource(resourceId, toPayload(form));
			if (!result.ok) {
				if (result.details) applyFieldErrors(result.details);
				setErrorMessage(result.error ?? "Error al actualizar el recurso");
				return;
			}
			setSuccessMessage("Recurso actualizado correctamente.");
		} catch {
			setErrorMessage("Error de conexión");
		} finally {
			setBusy(false);
		}
	}

	async function handleTransition(targetStatus: string) {
		if (!resourceId) return;
		setWorkflowError("");
		setWorkflowSuccess("");
		setBusyTransition(targetStatus);

		try {
			const api = await getApiClient();
			await api.updateResourceStatus(resourceId, targetStatus);
			setCurrentStatus(targetStatus);
			setWorkflowSuccess(`Estado cambiado a: ${STEP_LABELS[targetStatus] ?? "Archivado"}`);
		} catch (error) {
			const known = error as { error?: string; details?: { message: string }[] };
			setWorkflowError(known?.details?.[0]?.message ?? known?.error ?? "Error al cambiar el estado");
		} finally {
			setBusyTransition(null);
		}
	}

	if (showAuthCheck) {
		return (
			<div id="auth-check">
				<p>Necesitas <a id="login-link" href={url("login")}>iniciar sesión</a> como autor o superior para editar recursos.</p>
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

	const resourceMetaParts = [];
	if (resource?.createdByName) resourceMetaParts.push(`Creado por: ${resource.createdByName}`);
	if (resource?.createdAt) {
		const date = new Date(typeof resource.createdAt === "number" ? resource.createdAt * 1000 : resource.createdAt);
		resourceMetaParts.push(`Fecha: ${date.toLocaleDateString("es-ES")}`);
	}

	const allowedTransitions = (TRANSITION_RULES[currentStatus] ?? []).filter((rule) => {
		const userLevel = ROLE_LEVELS[userRole] ?? 0;
		return userLevel >= (ROLE_LEVELS[rule.minRole] ?? 99);
	});

	return (
		<>
			{resourceMetaParts.length > 0
				? (
					<div id="resource-meta" className="resource-meta">
						{resourceMetaParts.map((part, index) => (
							<span key={part}>
								{index > 0 ? <span className="meta-sep">|</span> : null}
								{" "}
								{part}
							</span>
						))}
					</div>
				)
				: null}

			<section id="editorial-workflow" className="workflow-section" aria-label="Estado editorial del recurso">
				<div className="stepper" role="group" aria-label="Progreso editorial">
					{STEPS.map((step, index) => {
						const stepIndex = STEPS.indexOf(step);
						const currentIndex = STEPS.indexOf(currentStatus as typeof STEPS[number]);
						const isArchived = currentStatus === "archived";
						const stepClasses = [
							"step",
							isArchived ? "step--archived" : "",
							!isArchived && stepIndex === currentIndex ? "step--active" : "",
							!isArchived && stepIndex < currentIndex ? "step--completed" : "",
						].filter(Boolean).join(" ");

							return (
								<Fragment key={step}>
									<div className={stepClasses} data-status={step} aria-current={!isArchived && stepIndex === currentIndex ? "step" : undefined}>
										<span className="step-dot" aria-hidden="true"></span>
										<span className="step-label">{STEP_LABELS[step]}</span>
									</div>
								{index < STEPS.length - 1
									? (
										<div
											key={`${step}-line`}
											className={[
												"step-line",
												currentStatus === "archived" ? "step-line--archived" : "",
												currentIndex > index ? "step-line--completed" : "",
												currentIndex > index && index === 0 ? "step-line--completed-draft" : "",
												currentIndex > index && index === 1 ? "step-line--completed-review" : "",
											].filter(Boolean).join(" ")}
											aria-hidden="true"
											></div>
										)
										: null}
								</Fragment>
							);
						})}
				</div>
				<div id="archived-badge" className="archived-badge" style={{ display: currentStatus === "archived" ? "block" : "none" }} role="status">
					Archivado
				</div>
				<p className="sr-only" id="status-announcement" aria-live="polite">
					{`Estado actual: ${STEP_LABELS[currentStatus] ?? "Archivado"}`}
				</p>
				<div id="workflow-actions" className="workflow-actions">
					<button type="button" className="wf-btn btn-outline" onClick={() => void handleSubmit()} disabled={busy}>
						&#9998; Guardar cambios
					</button>
					{allowedTransitions.map((rule) => {
						const key = `${currentStatus}→${rule.to}`;
						return (
							<button
								key={key}
								type="button"
								className={`wf-btn ${TRANSITION_STYLES[key] ?? "btn-outline"}`}
								onClick={() => void handleTransition(rule.to)}
								disabled={busyTransition !== null}
							>
								{busyTransition === rule.to ? "Actualizando..." : (TRANSITION_LABELS[key] ?? rule.to)}
							</button>
						);
					})}
				</div>
				<AccessibleFeedback message={workflowError} variant="error" polite={false} />
				<AccessibleFeedback message={workflowSuccess} variant="success" />
			</section>

			<section id="upload-panel" className="upload-panel" ref={uploadPanelRef} aria-labelledby="upload-title">
				<div className="upload-header">
					<div>
						<p className="eyebrow">Archivos</p>
						<h2 id="upload-title">Adjuntar archivos al recurso</h2>
					</div>
					<label className="upload-picker">
						<span>Seleccionar archivos</span>
						<input data-upload-input type="file" multiple />
					</label>
				</div>
				<div data-upload-dropzone className="upload-dropzone" tabIndex={0}>
					Arrastra archivos aquí o usa el selector. Se permiten lotes de varios archivos y la subida continuará si la conexión se corta.
				</div>
				<AccessibleFeedback message={uploadError} variant="error" polite={false} />
				<div data-upload-feedback className="upload-feedback" aria-live="polite"></div>
				<div className="upload-progress-summary">
					<progress data-global-progress max="100" value="0"></progress>
					<span data-global-progress-label>Sin subidas activas</span>
				</div>
				<div className="upload-columns">
					<section>
						<h3>Cola local</h3>
						<ul data-upload-queue className="upload-list"><li>No hay archivos en cola.</li></ul>
					</section>
					<section>
						<h3>Uploads recientes</h3>
						<ul data-persisted-uploads className="upload-list"><li>No hay uploads recientes.</li></ul>
					</section>
				</div>
				<section>
					<h3>Archivos adjuntos</h3>
					<ul data-media-list className="upload-list"><li>No hay archivos adjuntos todavía.</li></ul>
				</section>
			</section>

			<AccessibleFeedback message={errorMessage} variant="error" polite={false} />
			<AccessibleFeedback message={successMessage} variant="success" />

			<form id="resource-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
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

				<button type="submit" id="submit-btn" style={{ display: "none" }} disabled={busy}>Guardar cambios</button>
			</form>
		</>
	);
}
