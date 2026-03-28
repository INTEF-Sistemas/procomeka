import { expect, test, describe } from "bun:test";
import {
	listResources,
	getResourceById,
	getResourceBySlug,
	createResource,
	updateResource,
	deleteResource,
	updateEditorialStatus,
} from "./repository.ts";
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";

const baseResource = {
	title: "Recurso test repo",
	description: "Descripción completa del recurso para testing",
	language: "es",
	license: "cc-by",
	resourceType: "documento",
};

describe("Repository — CRUD completo", () => {
	let createdId: string;
	let createdSlug: string;

	test("createResource → devuelve id y slug", async () => {
		const result = await createResource(baseResource);
		expect(result.id).toBeDefined();
		expect(result.slug).toContain("recurso-test-repo");
		createdId = result.id;
		createdSlug = result.slug;
	});

	test("createResource con subjects y levels", async () => {
		const result = await createResource({
			...baseResource,
			title: "Recurso con materias",
			subjects: ["matematicas", "informatica"],
			levels: ["educacion-primaria"],
		});
		expect(result.id).toBeDefined();

		const resource = await getResourceById(result.id);
		expect(resource).not.toBeNull();
		expect(resource!.subjects).toContain("matematicas");
		expect(resource!.subjects).toContain("informatica");
		expect(resource!.levels).toContain("educacion-primaria");
	});

	test("getResourceById → recurso existente", async () => {
		const resource = await getResourceById(createdId);
		expect(resource).not.toBeNull();
		expect(resource!.title).toBe(baseResource.title);
		expect(resource!.subjects).toEqual([]);
		expect(resource!.levels).toEqual([]);
	});

	test("getResourceById → null para id inexistente", async () => {
		const resource = await getResourceById("no-existe");
		expect(resource).toBeNull();
	});

	test("getResourceBySlug → recurso existente", async () => {
		const resource = await getResourceBySlug(createdSlug);
		expect(resource).not.toBeNull();
		expect(resource!.id).toBe(createdId);
		expect(resource!.subjects).toEqual([]);
		expect(resource!.mediaItems).toEqual([]);
	});

	test("getResourceBySlug → incluye media items asociados", async () => {
		await repo.createMediaItem(getDb().db, {
			resourceId: createdId,
			type: "file",
			mimeType: "application/pdf",
			url: "/api/admin/uploads/upload-public/content",
			fileSize: 1024,
			filename: "guia.pdf",
		});

		const resource = await getResourceBySlug(createdSlug);
		expect(resource).not.toBeNull();
		expect(resource!.mediaItems).toHaveLength(1);
		expect(resource!.mediaItems?.[0]?.filename).toBe("guia.pdf");
		expect(resource!.mediaItems?.[0]?.url).toBe("/api/v1/uploads/upload-public/content");
	});

	test("getResourceBySlug → null para slug inexistente", async () => {
		const resource = await getResourceBySlug("slug-que-no-existe");
		expect(resource).toBeNull();
	});

	test("listResources → lista con resultados", async () => {
		const result = await listResources({});
		expect(result.data.length).toBeGreaterThan(0);
		expect(typeof result.total).toBe("number");
	});

	test("listResources con búsqueda", async () => {
		const result = await listResources({ search: "test repo" });
		expect(result.data.length).toBeGreaterThan(0);
	});

	test("listResources con status", async () => {
		const result = await listResources({ status: "draft" });
		expect(Array.isArray(result.data)).toBe(true);
	});

	test("listResources filtra por resourceType", async () => {
		const video = await createResource({
			...baseResource,
			title: "Recurso video repo",
			resourceType: "video",
		});

		const result = await listResources({ resourceType: "video" });
		const ids = result.data.map((resource) => resource.id);
		expect(ids).toContain(video.id);
		expect(ids).not.toContain(createdId);
	});

	test("listResources filtra por language", async () => {
		const english = await createResource({
			...baseResource,
			title: "English repo resource",
			language: "en",
		});

		const result = await listResources({ language: "en" });
		const ids = result.data.map((resource) => resource.id);
		expect(ids).toContain(english.id);
		expect(ids).not.toContain(createdId);
	});

	test("listResources filtra por license", async () => {
		const open = await createResource({
			...baseResource,
			title: "CC0 repo resource",
			license: "cc0",
		});

		const result = await listResources({ license: "cc0" });
		const ids = result.data.map((resource) => resource.id);
		expect(ids).toContain(open.id);
		expect(ids).not.toContain(createdId);
	});

	test("listResources combina busqueda y filtros", async () => {
		const result = await listResources({
			search: "English",
			language: "en",
		});

		expect(result.data.some((resource) => resource.title === "English repo resource")).toBe(true);
		expect(result.data.every((resource) => resource.language === "en")).toBe(true);
	});

	test("updateResource → actualiza campos", async () => {
		await updateResource(createdId, { title: "Título actualizado repo" });
		const resource = await getResourceById(createdId);
		expect(resource!.title).toBe("Título actualizado repo");
	});

	test("updateEditorialStatus → cambia estado", async () => {
		await updateEditorialStatus(createdId, "published", "1");
		const resource = await getResourceById(createdId);
		expect(resource!.editorialStatus).toBe("published");
	});

	test("deleteResource → soft delete", async () => {
		await deleteResource(createdId);
		const resource = await getResourceById(createdId);
		expect(resource).toBeNull();
	});
});
