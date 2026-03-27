import{g as l}from"./get-api-client.w_qaBL6_.js";import{u as n}from"./paths.DDXL0-p6.js";import"./preload-helper.CPZg4Qqv.js";const r=document.getElementById("collection-form"),i=document.getElementById("collections-body");async function d(){const a=await l(),o=await a.listCollections({limit:100,offset:0});i.innerHTML=o.data.map(t=>`
			<tr>
				<td><input data-title-id="${t.id}" value="${t.title}" /></td>
				<td><textarea data-description-id="${t.id}" rows="2">${t.description}</textarea></td>
				<td>
					<select data-status-id="${t.id}">
						<option value="draft" ${t.editorialStatus==="draft"?"selected":""}>draft</option>
						<option value="review" ${t.editorialStatus==="review"?"selected":""}>review</option>
						<option value="published" ${t.editorialStatus==="published"?"selected":""}>published</option>
						<option value="archived" ${t.editorialStatus==="archived"?"selected":""}>archived</option>
					</select>
				</td>
				<td>
					<button type="button" data-save-id="${t.id}">Guardar</button>
					<button type="button" data-delete-id="${t.id}">Eliminar</button>
				</td>
			</tr>
		`).join(""),i.querySelectorAll("[data-save-id]").forEach(t=>{t.addEventListener("click",async()=>{const e=t.dataset.saveId;await a.updateCollection(e,{title:i.querySelector(`[data-title-id="${e}"]`).value,description:i.querySelector(`[data-description-id="${e}"]`).value,editorialStatus:i.querySelector(`[data-status-id="${e}"]`).value}),d()})}),i.querySelectorAll("[data-delete-id]").forEach(t=>{t.addEventListener("click",async()=>{const e=t.dataset.deleteId;confirm("¿Eliminar esta colección?")&&(await a.deleteCollection(e),d())})})}r.addEventListener("submit",async a=>{a.preventDefault(),await(await l()).createCollection({title:document.getElementById("collection-title").value,description:document.getElementById("collection-description").value,isOrdered:document.getElementById("collection-ordered").checked}),r.reset(),d()});d().catch(()=>{window.location.href=n("login")});
