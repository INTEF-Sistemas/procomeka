import{g as w}from"./get-api-client.DQ7NerdP.js";import{u as i}from"./paths.TWm4X3qt.js";import{S as u,T as y,e as s,F as S,f as b}from"./resource-display.DPOOk5ro.js";import"./preload-helper.CgvBGqr6.js";const t=document.getElementById("resource-detail"),m=new URLSearchParams(window.location.search).get("slug");async function T(){if(!m){t.innerHTML=`<p class="empty-state">No se especifico un recurso. <a href="${i("")}">Volver al catalogo</a></p>`;return}try{const l=await w(),[e,v]=await Promise.all([l.getResourceBySlug(m),l.getSession().catch(()=>null)]);if(!e){t.innerHTML=`<p class="empty-state">Recurso no encontrado. <a href="${i("")}">Volver al catalogo</a></p>`;return}let r="";const $=v?.user?.role??"reader";["reader","author","curator","admin"].indexOf($)>=1&&(r=`<a href="${i(`admin/recursos/editar?id=${e.id}`)}" class="edit-btn">Editar recurso</a>`);const d=u[e.editorialStatus]??u.draft,f=y[e.resourceType]||"&#128196;",o=e.createdAt?new Date(e.createdAt).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"}):"",c=e.keywords?e.keywords.split(",").map(a=>`<span class="keyword">${s(a.trim())}</span>`).join(""):"",h=e.elpxPreview?.previewUrl?`<section class="elpx-preview-section">
					<h2>Vista previa del recurso</h2>
					<div class="elpx-preview-wrapper">
						<iframe src="${e.elpxPreview.previewUrl}" class="elpx-preview-iframe"
							sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
							referrerpolicy="no-referrer"
							loading="lazy"
							title="Vista previa del recurso eXeLearning"></iframe>
					</div>
				</section>`:"",n=e.mediaItems?.length?e.mediaItems.map(a=>{const g=S[a.mimeType]||"&#128193;",p=a.fileSize?b(a.fileSize):"";return`
						<a href="${a.url}" class="file-card" download>
							<span class="file-icon">${g}</span>
							<div class="file-info">
								<span class="file-name">${s(a.filename||"Archivo")}</span>
								${p?`<span class="file-size">${p}</span>`:""}
							</div>
						</a>`}).join(""):"";t.innerHTML=`
				<nav class="breadcrumb">
					<a href="${i("")}">Catalogo</a>
					<span class="sep">/</span>
					<span>${s(e.title)}</span>
				</nav>

				<div class="detail-header">
					<div class="detail-icon">${f}</div>
					<div class="detail-title-area">
						<h1>${s(e.title)}</h1>
						<div class="detail-pills">
							<span class="pill pill-type">${s(e.resourceType)}</span>
							<span class="pill pill-lang">${s((e.language||"").toUpperCase())}</span>
							<span class="pill pill-license">${s(e.license)}</span>
							<span class="pill ${d.cssClass}">${d.label}</span>
						</div>
					</div>
					${r}
				</div>

				<div class="detail-content">
					<div class="detail-main">
						${h}

						<section class="description-section">
							<h2>Descripcion</h2>
							<p>${s(e.description)}</p>
						</section>

						${c?`
						<section class="keywords-section">
							<h2>Palabras clave</h2>
							<div class="keywords-list">${c}</div>
						</section>`:""}

						${n?`
						<section class="files-section">
							<h2>Archivos adjuntos</h2>
							<div class="files-grid">${n}</div>
						</section>`:""}
					</div>

					<aside class="detail-sidebar">
						<div class="meta-card">
							<h3>Informacion</h3>
							<dl class="meta-list">
								${e.author||e.createdByName?`<dt>Autor</dt><dd>${s(e.createdByName||e.author||"")}</dd>`:""}
								${e.publisher?`<dt>Editor</dt><dd>${s(e.publisher)}</dd>`:""}
								<dt>Idioma</dt><dd>${s(e.language)}</dd>
								<dt>Licencia</dt><dd>${s(e.license)}</dd>
								<dt>Tipo</dt><dd>${s(e.resourceType)}</dd>
								${o?`<dt>Publicado</dt><dd>${o}</dd>`:""}
								${e.subjects?.length?`<dt>Materias</dt><dd>${e.subjects.map(a=>s(a)).join(", ")}</dd>`:""}
								${e.levels?.length?`<dt>Niveles</dt><dd>${e.levels.map(a=>s(a)).join(", ")}</dd>`:""}
							</dl>
						</div>
					</aside>
				</div>
			`}catch{t.innerHTML=`<p class="empty-state">Error al cargar el recurso. <a href="${i("")}">Volver al catalogo</a></p>`}}T();
