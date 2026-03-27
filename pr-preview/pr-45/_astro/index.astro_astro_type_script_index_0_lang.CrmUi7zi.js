import{g as l}from"./get-api-client.w_qaBL6_.js";import{u}from"./paths.DDXL0-p6.js";import"./preload-helper.CPZg4Qqv.js";const a=document.getElementById("taxonomy-body"),o=document.getElementById("taxonomy-form");async function n(){const d=await l(),i=await d.listTaxonomies({limit:100,offset:0});a.innerHTML=i.data.map(t=>`
			<tr>
				<td><input data-name-id="${t.id}" value="${t.name}" /></td>
				<td><input data-slug-id="${t.id}" value="${t.slug}" /></td>
				<td><input data-type-id="${t.id}" value="${t.type}" /></td>
				<td>
					<button type="button" data-save-id="${t.id}">Guardar</button>
					<button type="button" data-delete-id="${t.id}">Eliminar</button>
				</td>
			</tr>
		`).join(""),a.querySelectorAll("[data-save-id]").forEach(t=>{t.addEventListener("click",async()=>{const e=t.dataset.saveId;await d.updateTaxonomy(e,{name:a.querySelector(`[data-name-id="${e}"]`).value,slug:a.querySelector(`[data-slug-id="${e}"]`).value,type:a.querySelector(`[data-type-id="${e}"]`).value}),n()})}),a.querySelectorAll("[data-delete-id]").forEach(t=>{t.addEventListener("click",async()=>{const e=t.dataset.deleteId;confirm("¿Eliminar esta categoría?")&&(await d.deleteTaxonomy(e),n())})})}o.addEventListener("submit",async d=>{d.preventDefault(),await(await l()).createTaxonomy({name:document.getElementById("taxonomy-name").value,slug:document.getElementById("taxonomy-slug").value||void 0,type:document.getElementById("taxonomy-type").value||"category"}),o.reset(),document.getElementById("taxonomy-type").value="category",n()});n().catch(()=>{window.location.href=u("login")});
