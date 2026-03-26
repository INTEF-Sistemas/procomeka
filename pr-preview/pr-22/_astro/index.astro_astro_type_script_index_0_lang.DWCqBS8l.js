import{g as l}from"./get-api-client.CFpb1rTF.js";import{u}from"./paths.DDXL0-p6.js";import"./preload-helper.Bui4qXue.js";const s=document.getElementById("resources-list"),n=document.getElementById("search");async function i(a=""){try{const c=await l(),{data:t,total:r}=await c.listResources(a?{q:a}:void 0);if(t.length===0){s.innerHTML="<p>No se encontraron recursos.</p>";return}s.innerHTML=t.map(e=>`
				<a href="${u(`recurso?slug=${e.slug}`)}" class="resource-card">
					<div class="card-header">
						<span class="badge badge-${e.resourceType}">${e.resourceType}</span>
						<span class="badge badge-status-${e.editorialStatus}">${e.editorialStatus}</span>
					</div>
					<h2>${e.title}</h2>
					<p>${e.description.slice(0,150)}${e.description.length>150?"...":""}</p>
				</a>
			`).join(""),r>t.length&&(s.innerHTML+=`<p class="total">Mostrando ${t.length} de ${r} recursos</p>`)}catch{s.innerHTML="<p>Error al cargar recursos.</p>"}}let o;n.addEventListener("input",()=>{clearTimeout(o),o=setTimeout(()=>i(n.value),300)});i();
