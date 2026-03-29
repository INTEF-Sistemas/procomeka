import { beforeEach, describe, expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema/index.ts";
import {
	addResourceToCollection,
	createCollection,
	createElpxProject,
	createResource,
	createTaxonomy,
	deleteCollection,
	deleteElpxProject,
	deleteMediaItem,
	deleteTaxonomy,
	ensureUser,
	failUploadSession,
	getCollectionById,
	getElpxProjectByHash,
	getElpxProjectByResourceId,
	getTaxonomyById,
	getUserById,
	listCollectionResources,
	listCollections,
	listTaxonomies,
	listUsers,
	removeResourceFromCollection,
	updateCollection,
	updateTaxonomy,
	updateUser,
} from "./repository.ts";
import { createTables } from "./setup.ts";

describe("repository admin helpers", () => {
	let db: ReturnType<typeof drizzle>;

	beforeEach(async () => {
		const pglite = new PGlite();
		await createTables(pglite);
		db = drizzle(pglite, { schema });
	});

	test("crea y actualiza usuarios sin duplicarlos", async () => {
		const created = await ensureUser(db, {
			id: "user-admin",
			email: "admin@example.com",
			name: "Admin Inicial",
			role: "admin",
		});

		expect(created?.email).toBe("admin@example.com");
		expect(created?.role).toBe("admin");

		const sameUser = await ensureUser(db, {
			id: "user-admin",
			email: "otro@example.com",
			name: "No debe cambiar",
			role: "editor",
		});
		expect(sameUser?.email).toBe("admin@example.com");

		await ensureUser(db, {
			id: "user-editor",
			email: "editor@example.com",
			name: "Editor",
			role: "editor",
		});
		await updateUser(db, "user-editor", { name: "Editor Jefe", isActive: false });

		const updated = await getUserById(db, "user-editor");
		expect(updated?.name).toBe("Editor Jefe");
		expect(updated?.isActive).toBe(false);

		const list = await listUsers(db, { search: "editor", role: "editor", isActive: false });
		expect(list.total).toBe(1);
		expect(list.data[0]?.id).toBe("user-editor");
	});

	test("gestiona colecciones con filtros de búsqueda y curatorId", async () => {
		await ensureUser(db, {
			id: "curator-1",
			email: "curator@example.com",
			name: "Curadora",
			role: "editor",
		});
		await ensureUser(db, {
			id: "curator-2",
			email: "owner@example.com",
			name: "Otra Curadora",
			role: "editor",
		});

		const first = await createCollection(db, {
			title: "Álgebra visual",
			description: "Colección de matemáticas",
			curatorId: "curator-1",
		});
		await createCollection(db, {
			title: "Historia universal",
			description: "Colección de sociales",
			curatorId: "curator-2",
			editorialStatus: "published",
			isOrdered: 1,
		});

		const filtered = await listCollections(db, {
			search: "algebra",
			curatorId: "curator-1",
		});
		expect(filtered.total).toBe(1);
		expect(filtered.data[0]?.slug).toContain("algebra-visual-");

		await updateCollection(db, first.id, {
			title: "Álgebra visual avanzada",
			editorialStatus: "published",
			isOrdered: 1,
		});

		const updated = await getCollectionById(db, first.id);
		expect(updated?.title).toBe("Álgebra visual avanzada");
		expect(updated?.editorialStatus).toBe("published");
		expect(updated?.isOrdered).toBe(1);

		await deleteCollection(db, first.id);
		expect(await getCollectionById(db, first.id)).toBeNull();
	});

	test("gestiona taxonomías con slug normalizado, filtro por tipo y borrado", async () => {
		const parent = await createTaxonomy(db, {
			name: "Educación Primaria",
			type: "level",
		});
		const child = await createTaxonomy(db, {
			name: "Matemáticas",
			type: "subject",
			parentId: parent.id,
		});

		const levels = await listTaxonomies(db, { search: "educacion", type: "level" });
		expect(levels.total).toBe(1);
		expect(levels.data[0]?.slug).toContain("educacion-primaria-");

		await updateTaxonomy(db, child.id, {
			name: "Matemáticas Aplicadas",
			slug: "matematicas-aplicadas",
			type: "topic",
			parentId: null,
		});

		const updated = await getTaxonomyById(db, child.id);
		expect(updated?.name).toBe("Matemáticas Aplicadas");
		expect(updated?.slug).toBe("matematicas-aplicadas");
		expect(updated?.type).toBe("topic");
		expect(updated?.parentId).toBeNull();

		await deleteTaxonomy(db, child.id);
		expect(await getTaxonomyById(db, child.id)).toBeNull();
	});
});

describe("repository elpx projects", () => {
	let db: ReturnType<typeof drizzle>;

	let resourceId: string;

	beforeEach(async () => {
		const pglite = new PGlite();
		await createTables(pglite);
		db = drizzle(pglite, { schema });
		await ensureUser(db, { id: "u1", email: "a@b.com", name: "A", role: "admin" });
		const res = await createResource(db, {
			title: "Recurso",
			description: "Desc",
			language: "es",
			license: "cc-by",
			resourceType: "documento",
			createdBy: "u1",
		});
		resourceId = res.id;
	});

	test("crea, consulta por resource y por hash, y borra", async () => {

		const result = await createElpxProject(db, {
			resourceId,
			hash: "abc123",
			extractPath: "/tmp/test",
			originalFilename: "test.elpx",
			hasPreview: 1,
			elpxMetadata: JSON.stringify({ title: "Test" }),
		});
		expect(result.id).toBeTruthy();

		const byResource = await getElpxProjectByResourceId(db, resourceId);
		expect(byResource).not.toBeNull();
		expect(byResource!.hash).toBe("abc123");
		expect(byResource!.originalFilename).toBe("test.elpx");

		const byHash = await getElpxProjectByHash(db, "abc123");
		expect(byHash).not.toBeNull();
		expect(byHash!.resourceId).toBe(resourceId);

		const notFound = await getElpxProjectByHash(db, "nonexistent");
		expect(notFound).toBeNull();

		await deleteElpxProject(db, result.id);
		expect(await getElpxProjectByResourceId(db, resourceId)).toBeNull();
	});
});

describe("repository collection-resources", () => {
	let db: ReturnType<typeof drizzle>;
	let collectionId: string;
	let resourceId: string;

	beforeEach(async () => {
		const pglite = new PGlite();
		await createTables(pglite);
		db = drizzle(pglite, { schema });
		await ensureUser(db, { id: "u1", email: "a@b.com", name: "A", role: "admin" });

		const col = await createCollection(db, { title: "Col", description: "D", curatorId: "u1" });
		collectionId = col.id;

		const res = await createResource(db, {
			title: "Recurso",
			description: "Desc",
			language: "es",
			license: "cc-by",
			resourceType: "documento",
			createdBy: "u1",
		});
		resourceId = res.id;
	});

	test("añade, lista y elimina recurso de colección", async () => {
		await addResourceToCollection(db, collectionId, resourceId, 1);

		const items = await listCollectionResources(db, collectionId);
		expect(items).toHaveLength(1);
		expect(items[0].resourceId).toBe(resourceId);
		expect(items[0].position).toBe(1);

		await removeResourceFromCollection(db, collectionId, resourceId);
		const after = await listCollectionResources(db, collectionId);
		expect(after).toHaveLength(0);
	});

	test("posición por defecto es 0", async () => {
		await addResourceToCollection(db, collectionId, resourceId);
		const items = await listCollectionResources(db, collectionId);
		expect(items).toHaveLength(1);
		expect(items[0].position).toBe(0);
	});
});
