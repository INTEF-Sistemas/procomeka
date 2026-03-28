import { useEffect, useState } from "react";
import type { Resource, SessionData } from "../../lib/api-client.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";
import { FILE_ICONS, formatBytes, STATUS_MAP, TYPE_ICONS } from "../../lib/resource-display.ts";

const EDITABLE_ROLES = new Set(["author", "curator", "admin"]);

function resourceDate(dateValue: Resource["createdAt"]) {
	if (!dateValue) return "";
	return new Date(dateValue).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function ResourceDetailContent({ resource, session }: { resource: Resource; session: SessionData | null }) {
	const status = STATUS_MAP[resource.editorialStatus] ?? STATUS_MAP.draft;
	const resourceIcon = TYPE_ICONS[resource.resourceType] ?? "&#128196;";
	const keywords = resource.keywords
		? resource.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean)
		: [];
	const publicationDate = resourceDate(resource.createdAt);
	const canEdit = EDITABLE_ROLES.has(session?.user?.role ?? "reader");

	return (
		<>
			<nav className="breadcrumb">
				<a href={url("")}>Catalogo</a>
				<span className="sep">/</span>
				<span>{resource.title}</span>
			</nav>

			<div className="detail-header">
				<div
					className="detail-icon"
					aria-hidden="true"
					dangerouslySetInnerHTML={{ __html: resourceIcon }}
				/>
				<div className="detail-title-area">
					<h1>{resource.title}</h1>
					<div className="detail-pills">
						<span className="pill pill-type">{resource.resourceType}</span>
						<span className="pill pill-lang">{(resource.language || "").toUpperCase()}</span>
						<span className="pill pill-license">{resource.license}</span>
						<span className={`pill ${status.cssClass}`}>{status.label}</span>
					</div>
				</div>
				{canEdit ? (
					<a href={url(`admin/recursos/editar?id=${resource.id}`)} className="edit-btn">
						Editar recurso
					</a>
				) : null}
			</div>

			<div className="detail-content">
				<div className="detail-main">
					<section className="description-section">
						<h2>Descripcion</h2>
						<p>{resource.description}</p>
					</section>

					{keywords.length > 0 ? (
						<section className="keywords-section">
							<h2>Palabras clave</h2>
							<div className="keywords-list">
								{keywords.map((keyword) => (
									<span key={keyword} className="keyword">{keyword}</span>
								))}
							</div>
						</section>
					) : null}

					{resource.mediaItems?.length ? (
						<section className="files-section">
							<h2>Archivos adjuntos</h2>
									<div className="files-grid">
								{resource.mediaItems.map((mediaItem) => {
									const fileIcon = FILE_ICONS[mediaItem.mimeType || ""] ?? "&#128193;";
									const size = mediaItem.fileSize ? formatBytes(mediaItem.fileSize) : "";
									return (
										<a key={mediaItem.id} href={mediaItem.url} className="file-card" download>
											<span
												className="file-icon"
												aria-hidden="true"
												dangerouslySetInnerHTML={{ __html: fileIcon }}
											/>
											<div className="file-info">
												<span className="file-name">{mediaItem.filename || "Archivo"}</span>
												{size ? <span className="file-size">{size}</span> : null}
											</div>
										</a>
									);
								})}
							</div>
						</section>
					) : null}
				</div>

				<aside className="detail-sidebar">
					<div className="meta-card">
						<h3>Informacion</h3>
						<dl className="meta-list">
							{resource.author || resource.createdByName ? (
								<>
									<dt>Autor</dt>
									<dd>{resource.createdByName || resource.author || ""}</dd>
								</>
							) : null}
							{resource.publisher ? (
								<>
									<dt>Editor</dt>
									<dd>{resource.publisher}</dd>
								</>
							) : null}
							<dt>Idioma</dt>
							<dd>{resource.language}</dd>
							<dt>Licencia</dt>
							<dd>{resource.license}</dd>
							<dt>Tipo</dt>
							<dd>{resource.resourceType}</dd>
							{publicationDate ? (
								<>
									<dt>Publicado</dt>
									<dd>{publicationDate}</dd>
								</>
							) : null}
							{resource.subjects?.length ? (
								<>
									<dt>Materias</dt>
									<dd>{resource.subjects.join(", ")}</dd>
								</>
							) : null}
							{resource.levels?.length ? (
								<>
									<dt>Niveles</dt>
									<dd>{resource.levels.join(", ")}</dd>
								</>
							) : null}
						</dl>
					</div>
				</aside>
			</div>
		</>
	);
}

export function ResourceDetailIsland() {
	const [resource, setResource] = useState<Resource | null | undefined>(undefined);
	const [session, setSession] = useState<SessionData | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		const slug = new URLSearchParams(window.location.search).get("slug");
		if (!slug) {
			setResource(null);
			return;
		}

		void (async () => {
			try {
				const api = await getApiClient();
				const [nextResource, nextSession] = await Promise.all([
					api.getResourceBySlug(slug),
					api.getSession().catch(() => null),
				]);

				setResource(nextResource);
				setSession(nextSession);
			} catch {
				setError("Error al cargar el recurso.");
				setResource(null);
			}
		})();
	}, []);

	if (resource === undefined && !error) {
		return (
			<div className="detail-page">
				<p className="loading">Cargando recurso...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="detail-page">
				<p className="empty-state">
					{error} <a href={url("")}>Volver al catalogo</a>
				</p>
			</div>
		);
	}

	if (resource === null) {
		return (
			<div className="detail-page">
				<p className="empty-state">
					No se especifico o no se encontro el recurso. <a href={url("")}>Volver al catalogo</a>
				</p>
			</div>
		);
	}

	return (
		<div className="detail-page">
			<ResourceDetailContent resource={resource} session={session} />
		</div>
	);
}
