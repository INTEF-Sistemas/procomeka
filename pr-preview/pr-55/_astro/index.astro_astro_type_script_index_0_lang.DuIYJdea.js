import{g as b}from"./get-api-client.XxeWEj-I.js";import{u as h}from"./paths.DDXL0-p6.js";import"./preload-helper.DkUKpjU6.js";const r=document.getElementById("users-body"),u=document.getElementById("list-status"),$=document.getElementById("page-label"),y=document.getElementById("prev-page"),E=document.getElementById("next-page"),k=document.getElementById("search"),x=document.getElementById("role-filter"),e=document.getElementById("save-feedback");let a=0;const o=20;let s=0;function f(c){const d=document.createElement("div");return d.textContent=c,d.innerHTML}async function i(){u.textContent="Cargando usuarios...";const d=await(await b()).listUsers({q:k.value||void 0,role:x.value||void 0,limit:o,offset:a});s=d.total;const p=document.querySelector(".admin-pager");if(s<=o)p.hidden=!0;else{p.hidden=!1;const t=Math.floor(a/o)+1,n=Math.ceil(s/o);$.textContent=`Pagina ${t} de ${n}`,y.disabled=a===0,E.disabled=a+o>=s}if(!d.data.length){r.innerHTML='<tr class="admin-empty-row"><td colspan="6">No hay usuarios para los filtros actuales.</td></tr>',u.textContent=`${s} usuarios encontrados`;return}r.innerHTML=d.data.map(t=>`
			<tr>
				<td>${f(t.name??"-")}</td>
				<td>${f(t.email)}</td>
				<td>
					<select data-role-id="${t.id}">
						<option value="reader" ${t.role==="reader"?"selected":""}>reader</option>
						<option value="author" ${t.role==="author"?"selected":""}>author</option>
						<option value="curator" ${t.role==="curator"?"selected":""}>curator</option>
						<option value="admin" ${t.role==="admin"?"selected":""}>admin</option>
					</select>
				</td>
				<td>
					<span class="admin-badge ${t.isActive?"admin-badge--active":"admin-badge--inactive"}">
						${t.isActive?"Activo":"Inactivo"}
					</span>
				</td>
				<td>${t.updatedAt?new Date(t.updatedAt).toLocaleDateString("es-ES"):"-"}</td>
				<td class="actions-cell">
					<button type="button" class="admin-btn admin-btn--sm" data-save-id="${t.id}">Guardar</button>
					<button type="button" class="admin-btn admin-btn--sm admin-btn--ghost" data-toggle-id="${t.id}" data-is-active="${t.isActive?"1":"0"}">
						${t.isActive?"Desactivar":"Activar"}
					</button>
				</td>
			</tr>
		`).join("");const v=await b();r.querySelectorAll("[data-save-id]").forEach(t=>{t.addEventListener("click",async()=>{const n=t.dataset.saveId,m=r.querySelector(`[data-role-id="${n}"]`)?.value??"reader";e.textContent="",e.className="admin-list-status";try{const l=await v.updateUser(n,{role:m});l.ok?(e.textContent="Usuario actualizado.",e.className="admin-feedback admin-feedback--success"):(e.textContent=l.error??"Error al guardar.",e.className="admin-feedback admin-feedback--error")}catch{e.textContent="Error de conexion.",e.className="admin-feedback admin-feedback--error"}})}),r.querySelectorAll("[data-toggle-id]").forEach(t=>{t.addEventListener("click",async()=>{const n=t,m=n.dataset.toggleId,l=n.dataset.isActive==="1";e.textContent="",e.className="admin-list-status";try{const g=await v.updateUser(m,{isActive:!l});g.ok?i():(e.textContent=g.error??"Error al cambiar estado.",e.className="admin-feedback admin-feedback--error")}catch{e.textContent="Error de conexion.",e.className="admin-feedback admin-feedback--error"}})}),u.textContent=`${s} usuarios encontrados`}document.getElementById("apply-filters")?.addEventListener("click",()=>{a=0,i()});k.addEventListener("keydown",c=>{c.key==="Enter"&&(a=0,i())});y.addEventListener("click",()=>{a=Math.max(0,a-o),i()});E.addEventListener("click",()=>{a+=o,i()});i().catch(()=>{window.location.href=h("login")});
