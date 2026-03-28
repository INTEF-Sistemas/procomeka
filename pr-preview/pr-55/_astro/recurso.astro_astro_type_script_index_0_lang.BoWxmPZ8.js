import{g}from"./get-api-client.XxeWEj-I.js";import{u as t}from"./paths.DDXL0-p6.js";import{S as u,T as y,e as s,F as S,f as w}from"./resource-display.DPOOk5ro.js";import"./preload-helper.DkUKpjU6.js";const i=document.getElementById("resource-detail"),m=new URLSearchParams(window.location.search).get("slug");async function T(){if(!m){i.innerHTML=`<p class="empty-state">No se especifico un recurso. <a href="${t("")}">Volver al catalogo</a></p>`;return}try{const l=await g(),[e,$]=await Promise.all([l.getResourceBySlug(m),l.getSession().catch(()=>null)]);if(!e){i.innerHTML=`<p class="empty-state">Recurso no encontrado. <a href="${t("")}">Volver al catalogo</a></p>`;return}let d="";const h=$?.user?.role??"reader";["reader","author","curator","admin"].indexOf(h)>=1&&(d=`<a href="${t(`admin/recursos/editar?id=${e.id}`)}" class="edit-btn">Editar recurso</a>`);const c=u[e.editorialStatus]??u.draft,f=y[e.resourceType]||"&#128196;",n=e.createdAt?new Date(e.createdAt).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"}):"",r=e.keywords?e.keywords.split(",").map(a=>`<span class="keyword">${s(a.trim())}</span>`).join(""):"",o=e.mediaItems?.length?e.mediaItems.map(a=>{const v=S[a.mimeType]||"&#128193;",p=a.fileSize?w(a.fileSize):"";return`
						<a href="${a.url}" class="file-card" download>
							<span class="file-icon">${v}</span>
							<div class="file-info">
								<span class="file-name">${s(a.filename||"Archivo")}</span>
								${p?`<span class="file-size">${p}</span>`:""}
							</div>
						</a>`}).join(""):"";i.innerHTML=`
				<nav class="breadcrumb">
					<a href="${t("")}">Catalogo</a>
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
							<span class="pill ${c.cssClass}">${c.label}</span>
						</div>
					</div>
					${d}
				</div>

				<div class="detail-content">
					<div class="detail-main">
						<section class="description-section">
							<h2>Descripcion</h2>
							<p>${s(e.description)}</p>
						</section>

						${r?`
						<section class="keywords-section">
							<h2>Palabras clave</h2>
							<div class="keywords-list">${r}</div>
						</section>`:""}

						${o?`
						<section class="files-section">
							<h2>Archivos adjuntos</h2>
							<div class="files-grid">${o}</div>
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
								${n?`<dt>Publicado</dt><dd>${n}</dd>`:""}
								${e.subjects?.length?`<dt>Materias</dt><dd>${e.subjects.map(a=>s(a)).join(", ")}</dd>`:""}
								${e.levels?.length?`<dt>Niveles</dt><dd>${e.levels.map(a=>s(a)).join(", ")}</dd>`:""}
							</dl>
						</div>
					</aside>
				</div>
			`}catch{i.innerHTML=`<p class="empty-state">Error al cargar el recurso. <a href="${t("")}">Volver al catalogo</a></p>`}}T();
