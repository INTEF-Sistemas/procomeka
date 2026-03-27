import{g as r}from"./get-api-client.DBgXoPud.js";import{u as c}from"./paths.DDXL0-p6.js";import"./preload-helper.BKXYl-sz.js";const e=document.getElementById("users-body"),s=document.getElementById("users-status"),u=document.getElementById("search"),m=document.getElementById("role-filter");async function o(){const d=await r(),i=await d.listUsers({q:u.value||void 0,role:m.value||void 0,limit:50,offset:0});s.textContent=`${i.total} usuarios visibles`,e.innerHTML=i.data.map(t=>`
			<tr>
				<td><input data-name-id="${t.id}" value="${t.name??""}" /></td>
				<td>${t.email}</td>
				<td>
					<select data-role-id="${t.id}">
						<option value="reader" ${t.role==="reader"?"selected":""}>reader</option>
						<option value="author" ${t.role==="author"?"selected":""}>author</option>
						<option value="curator" ${t.role==="curator"?"selected":""}>curator</option>
						<option value="admin" ${t.role==="admin"?"selected":""}>admin</option>
					</select>
				</td>
				<td>${t.isActive?"Activo":"Inactivo"}</td>
				<td><button type="button" data-save-id="${t.id}">Guardar</button></td>
			</tr>
		`).join(""),e.querySelectorAll("[data-save-id]").forEach(t=>{t.addEventListener("click",async()=>{const a=t.dataset.saveId,n=e.querySelector(`[data-name-id="${a}"]`)?.value??"",l=e.querySelector(`[data-role-id="${a}"]`)?.value??"reader";await d.updateUser(a,{name:n,role:l}),o()})})}document.getElementById("apply-filters")?.addEventListener("click",()=>o());o().catch(()=>{window.location.href=c("login")});
