import{g as d}from"./get-api-client.6UHFq9-q.js";import{u as r}from"./paths.DDXL0-p6.js";import"./preload-helper.DpnhIzxq.js";const p={draft:"Borrador",review:"En revisión",published:"Publicado",archived:"Archivado"},s=document.getElementById("resource-detail"),u=new URLSearchParams(window.location.search),n=u.get("slug");async function g(){if(!n){s.innerHTML=`<p>No se especificó un recurso.</p><a href='${r("")}'>Volver al inicio</a>`;return}try{const t=await d(),e=await t.getResourceBySlug(n);if(!e){s.innerHTML=`<p>Recurso no encontrado.</p><a href='${r("")}'>Volver al inicio</a>`;return}let i="";try{const o=await t.getSession();if(o?.user){const l=o.user.role??"reader";["reader","author","curator","admin"].indexOf(l)>=1&&(i=`<a href="${r(`admin/recursos/editar?id=${e.id}`)}" class="btn-edit" aria-label="Editar recurso">Editar</a>`)}}catch{}const a=e.editorialStatus??"draft",c=p[a]??a;s.innerHTML=`
				<nav class="breadcrumb"><a href="${r("")}">Recursos</a> / ${e.title}</nav>
				<div class="title-row">
					<h1>${e.title}</h1>
					${i}
				</div>
				<div class="meta">
					<span class="badge">${e.resourceType}</span>
					<span class="badge badge-${a}">${c}</span>
					<span>${e.language}</span>
					<span>${e.license}</span>
				</div>
				<p class="description">${e.description}</p>
				${e.createdByName?`<p class="field"><strong>Autor:</strong> ${e.createdByName}</p>`:e.author?`<p class="field"><strong>Autor:</strong> ${e.author}</p>`:""}
				${e.publisher?`<p class="field"><strong>Editor:</strong> ${e.publisher}</p>`:""}
				${e.keywords?`<p class="field"><strong>Palabras clave:</strong> ${e.keywords}</p>`:""}
				${e.subjects?.length?`<p class="field"><strong>Materias:</strong> ${e.subjects.join(", ")}</p>`:""}
				${e.levels?.length?`<p class="field"><strong>Niveles:</strong> ${e.levels.join(", ")}</p>`:""}
			`}catch{s.innerHTML="<p>Error al cargar el recurso.</p>"}}g();
