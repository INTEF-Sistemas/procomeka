import{g as o}from"./get-api-client.DWzmtCFH.js";import{u as r}from"./paths.DDXL0-p6.js";import"./preload-helper.BeyGMO5U.js";const i={draft:"Borrador",review:"En revisión",published:"Publicado",archived:"Archivado"},e=document.getElementById("resource-detail"),c=new URLSearchParams(window.location.search),n=c.get("slug");async function l(){if(!n){e.innerHTML=`<p>No se especificó un recurso.</p><a href='${r("")}'>Volver al inicio</a>`;return}try{const s=await(await o()).getResourceBySlug(n);if(!s){e.innerHTML=`<p>Recurso no encontrado.</p><a href='${r("")}'>Volver al inicio</a>`;return}const a=s.editorialStatus??"draft",t=i[a]??a;e.innerHTML=`
				<nav class="breadcrumb"><a href="${r("")}">Recursos</a> / ${s.title}</nav>
				<h1>${s.title}</h1>
				<div class="meta">
					<span class="badge">${s.resourceType}</span>
					<span class="badge badge-${a}">${t}</span>
					<span>${s.language}</span>
					<span>${s.license}</span>
				</div>
				<p class="description">${s.description}</p>
				${s.author?`<p class="field"><strong>Autor:</strong> ${s.author}</p>`:""}
				${s.publisher?`<p class="field"><strong>Editor:</strong> ${s.publisher}</p>`:""}
				${s.keywords?`<p class="field"><strong>Palabras clave:</strong> ${s.keywords}</p>`:""}
				${s.subjects?.length?`<p class="field"><strong>Materias:</strong> ${s.subjects.join(", ")}</p>`:""}
				${s.levels?.length?`<p class="field"><strong>Niveles:</strong> ${s.levels.join(", ")}</p>`:""}
			`}catch{e.innerHTML="<p>Error al cargar el recurso.</p>"}}l();
