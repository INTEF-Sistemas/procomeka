import{g as r}from"./get-api-client.ClCyC4ig.js";import{u as c}from"./paths.DDXL0-p6.js";import"./preload-helper.BKXYl-sz.js";const o=document.getElementById("resources-body"),s=document.getElementById("list-status"),p=document.getElementById("page-label"),u=document.getElementById("prev-page"),m=document.getElementById("next-page"),g=document.getElementById("search"),y=document.getElementById("status-filter");let e=0;const a=10;let d=0;async function n(){s.textContent="Cargando recursos…";const i=await(await r()).listAdminResources({q:g.value||void 0,limit:a,offset:e,status:y.value||void 0});if(d=i.total,p.textContent=`Página ${Math.floor(e/a)+1}`,u.disabled=e===0,m.disabled=e+a>=d,!i.data.length){o.innerHTML='<tr><td colspan="5">No hay recursos para los filtros actuales.</td></tr>',s.textContent=`${d} recursos visibles`;return}o.innerHTML=i.data.map(t=>`
			<tr>
				<td>${t.title}</td>
				<td>${t.createdByName??t.author??"Sin autoría"}</td>
				<td>${t.editorialStatus}</td>
				<td>${t.updatedAt?new Date(t.updatedAt).toLocaleDateString("es-ES"):"-"}</td>
				<td>
					<a href="${c(`admin/recursos/editar?id=${t.id}`)}">Editar</a>
					<button type="button" data-delete-id="${t.id}">Eliminar</button>
				</td>
			</tr>
		`).join(""),o.querySelectorAll("[data-delete-id]").forEach(t=>{t.addEventListener("click",async()=>{const l=t.dataset.deleteId;if(!l||!confirm("¿Eliminar este recurso?"))return;await(await r()).deleteResource(l),n()})}),s.textContent=`${d} recursos visibles`}document.getElementById("apply-filters")?.addEventListener("click",()=>{e=0,n()});u.addEventListener("click",()=>{e=Math.max(0,e-a),n()});m.addEventListener("click",()=>{e+=a,n()});n().catch(()=>{window.location.href=c("login")});
