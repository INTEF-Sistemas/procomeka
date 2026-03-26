import{g as l}from"./get-api-client.lL_BHjf4.js";import{u}from"./paths.B0westx2.js";import"./preload-helper.DpnhIzxq.js";const h={draft:"Borrador",review:"En revisión",published:"Publicado",archived:"Archivado"};let o=10,a=0,r=0;const b=document.getElementById("btn-create");document.getElementById("search-input");const m=document.getElementById("status-filter"),i=document.getElementById("resources-list"),g=document.getElementById("prev-btn"),p=document.getElementById("next-btn"),f=document.getElementById("page-info"),E=document.getElementById("pagination");b.href=u("admin/recursos/nuevo");async function d(){i.innerHTML='<p class="loading-text">Cargando recursos...</p>';try{const e=await l(),s=m.value||void 0,{data:t,total:n}=await e.listAdminResources({limit:o,offset:a,status:s});r=n,y(t),v()}catch{i.innerHTML="<p class='error-text'>Error al cargar recursos.</p>"}}function y(e){if(!e||e.length===0){i.innerHTML="<p>No se encontraron recursos.</p>";return}const s=e.map(t=>{const n=t.editorialStatus??"draft",c=t.createdAt?new Date(typeof t.createdAt=="number"?t.createdAt*1e3:t.createdAt).toLocaleDateString("es-ES"):"-";return`<tr>
				<td><strong>${t.title}</strong></td>
				<td>${t.createdByName||"Desconocido"}</td>
				<td><span class="badge badge-${n}">${h[n]||n}</span></td>
				<td>${c}</td>
				<td class="actions">
					<a href="${u(`admin/recursos/editar?id=${t.id}`)}" class="action-btn edit-btn" title="Editar">✏️</a>
					<button class="action-btn delete-btn" data-id="${t.id}" title="Eliminar">🗑️</button>
				</td>
			</tr>`}).join("");i.innerHTML=`<table>
			<thead><tr><th>Título</th><th>Autor</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
			<tbody>${s}</tbody>
		</table>`,i.querySelectorAll(".delete-btn").forEach(t=>{t.addEventListener("click",async()=>{const n=t.dataset.id;n&&confirm("¿Estás seguro de que deseas eliminar este recurso?")&&(await(await l()).deleteResource(n),d())})})}function v(){E.style.display=r>o?"flex":"none";const e=Math.floor(a/o)+1,s=Math.ceil(r/o);f.textContent=`Página ${e} de ${s}`,g.disabled=a===0,p.disabled=a+o>=r}g.addEventListener("click",()=>{a=Math.max(0,a-o),d()});p.addEventListener("click",()=>{a+=o,d()});m.addEventListener("change",()=>{a=0,d()});d();
