/**
 * Funciones de repositorio reutilizables.
 * Aceptan una instancia Drizzle como parámetro para funcionar
 * tanto en el servidor (API) como en el navegador (preview).
 */
import { eq, like, sql, desc, isNull, and, or, asc } from "drizzle-orm";
import {
	resources,
	resourceSubjects,
	resourceLevels,
} from "./schema/resources.ts";
import { collections } from "./schema/collections.ts";
import { user } from "./schema/auth.ts";
import { taxonomies } from "./schema/taxonomies.ts";

type DrizzleDB = {
	select: (...args: unknown[]) => unknown;
	insert: (...args: unknown[]) => unknown;
	update: (...args: unknown[]) => unknown;
	// biome-ignore lint: generic drizzle db type
	[key: string]: any;
};

/**
 * Normaliza un string para búsqueda insensible a mayúsculas y acentos.
 * Usa translate para ser compatible con PGlite y PostgreSQL estándar sin extensiones.
 */
function normalizeSearch(col: any) {
	return sql`lower(translate(${col}, 'áéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑ', 'aeiouAEIOUaeiouAEIOUnN'))`;
}

export async function listResources(
	db: DrizzleDB,
	opts: {
		limit?: number;
		offset?: number;
		search?: string;
		status?: string;
		resourceType?: string;
		language?: string;
		license?: string;
		createdBy?: string;
		visibleToUserId?: string;
	},
) {
	const limit = Math.min(opts.limit ?? 20, 100);
	const offset = opts.offset ?? 0;

	const conditions = [isNull(resources.deletedAt)];
	if (opts.search) {
		const term = `%${opts.search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}%`;
		conditions.push(
			sql`(${normalizeSearch(resources.title)} LIKE ${term} OR
                 ${normalizeSearch(resources.description)} LIKE ${term} OR
                 ${normalizeSearch(resources.author)} LIKE ${term} OR
                 ${normalizeSearch(resources.keywords)} LIKE ${term})`,
		);
	}
	if (opts.status) {
		conditions.push(eq(resources.editorialStatus, opts.status));
	}
	if (opts.resourceType) {
		conditions.push(eq(resources.resourceType, opts.resourceType));
	}
	if (opts.language) {
		conditions.push(eq(resources.language, opts.language));
	}
	if (opts.license) {
		conditions.push(eq(resources.license, opts.license));
	}
	if (opts.createdBy) {
		conditions.push(eq(resources.createdBy, opts.createdBy));
	}
	if (opts.visibleToUserId) {
		conditions.push(
			or(
				eq(resources.createdBy, opts.visibleToUserId),
				eq(resources.assignedCuratorId, opts.visibleToUserId),
			),
		);
	}

	const where = conditions.reduce((a, b) => sql`${a} AND ${b}`);

	const rows = await db
		.select({
			id: resources.id,
			slug: resources.slug,
			externalId: resources.externalId,
			sourceUri: resources.sourceUri,
			title: resources.title,
			description: resources.description,
			language: resources.language,
			license: resources.license,
			resourceType: resources.resourceType,
			keywords: resources.keywords,
			author: resources.author,
			publisher: resources.publisher,
			createdBy: resources.createdBy,
			createdByName: user.name,
			editorialStatus: resources.editorialStatus,
			deletedAt: resources.deletedAt,
			createdAt: resources.createdAt,
			updatedAt: resources.updatedAt,
		})
		.from(resources)
		.leftJoin(user, eq(resources.createdBy, user.id))
		.where(where)
		.limit(limit)
		.offset(offset)
		.orderBy(desc(resources.createdAt));

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(resources)
		.where(where);

	const total = countResult[0]?.count ?? 0;

	return { data: rows, total, limit, offset };
}

export async function getResourceById(db: DrizzleDB, id: string) {
	const rows = await db
		.select({
			id: resources.id,
			slug: resources.slug,
			externalId: resources.externalId,
			sourceUri: resources.sourceUri,
			title: resources.title,
			description: resources.description,
			language: resources.language,
			license: resources.license,
			resourceType: resources.resourceType,
			keywords: resources.keywords,
			author: resources.author,
			publisher: resources.publisher,
			createdBy: resources.createdBy,
			createdByName: user.name,
			editorialStatus: resources.editorialStatus,
			assignedCuratorId: resources.assignedCuratorId,
			curatedAt: resources.curatedAt,
			deletedAt: resources.deletedAt,
			createdAt: resources.createdAt,
			updatedAt: resources.updatedAt,
		})
		.from(resources)
		.leftJoin(user, eq(resources.createdBy, user.id))
		.where(and(eq(resources.id, id), isNull(resources.deletedAt)))
		.limit(1);

	const resource = rows[0];
	if (!resource) return null;

	const subjects = await db
		.select({ subject: resourceSubjects.subject })
		.from(resourceSubjects)
		.where(eq(resourceSubjects.resourceId, resource.id));

	const levels = await db
		.select({ level: resourceLevels.level })
		.from(resourceLevels)
		.where(eq(resourceLevels.resourceId, resource.id));

	return {
		...resource,
		subjects: subjects.map((s: { subject: string }) => s.subject),
		levels: levels.map((l: { level: string }) => l.level),
	};
}

export async function getResourceBySlug(db: DrizzleDB, slug: string) {
	const rows = await db
		.select({
			id: resources.id,
			slug: resources.slug,
			externalId: resources.externalId,
			sourceUri: resources.sourceUri,
			title: resources.title,
			description: resources.description,
			language: resources.language,
			license: resources.license,
			resourceType: resources.resourceType,
			keywords: resources.keywords,
			author: resources.author,
			publisher: resources.publisher,
			createdBy: resources.createdBy,
			createdByName: user.name,
			editorialStatus: resources.editorialStatus,
			assignedCuratorId: resources.assignedCuratorId,
			curatedAt: resources.curatedAt,
			deletedAt: resources.deletedAt,
			createdAt: resources.createdAt,
			updatedAt: resources.updatedAt,
		})
		.from(resources)
		.leftJoin(user, eq(resources.createdBy, user.id))
		.where(and(eq(resources.slug, slug), isNull(resources.deletedAt)))
		.limit(1);

	const resource = rows[0];
	if (!resource) return null;

	const subjects = await db
		.select({ subject: resourceSubjects.subject })
		.from(resourceSubjects)
		.where(eq(resourceSubjects.resourceId, resource.id));

	const levels = await db
		.select({ level: resourceLevels.level })
		.from(resourceLevels)
		.where(eq(resourceLevels.resourceId, resource.id));

	return {
		...resource,
		subjects: subjects.map((s: { subject: string }) => s.subject),
		levels: levels.map((l: { level: string }) => l.level),
	};
}

export async function createResource(
	db: DrizzleDB,
	data: {
		title: string;
		description: string;
		language: string;
		license: string;
		resourceType: string;
		keywords?: string;
		author?: string;
		publisher?: string;
		subjects?: string[];
		levels?: string[];
		createdBy?: string;
	},
) {
	const id = crypto.randomUUID();
	const baseSlug = data.title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	const slug = `${baseSlug}-${id.slice(0, 8)}`;
	const now = new Date();

	await db.insert(resources).values({
		id,
		slug,
		title: data.title,
		description: data.description,
		language: data.language,
		license: data.license,
		resourceType: data.resourceType,
		keywords: data.keywords ?? null,
		author: data.author ?? null,
		publisher: data.publisher ?? null,
		createdBy: data.createdBy ?? null,
		editorialStatus: "draft",
		createdAt: now,
		updatedAt: now,
	});

	if (data.subjects?.length) {
		for (const subject of data.subjects) {
			await db
				.insert(resourceSubjects)
				.values({ resourceId: id, subject });
		}
	}

	if (data.levels?.length) {
		for (const level of data.levels) {
			await db.insert(resourceLevels).values({ resourceId: id, level });
		}
	}

	return { id, slug };
}

export async function updateResource(
	db: DrizzleDB,
	id: string,
	data: Partial<{
		title: string;
		description: string;
		language: string;
		license: string;
		resourceType: string;
		keywords: string;
		author: string;
		publisher: string;
	}>,
) {
	await db
		.update(resources)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(resources.id, id), isNull(resources.deletedAt)));
}

export async function deleteResource(db: DrizzleDB, id: string) {
	await db
		.update(resources)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(and(eq(resources.id, id), isNull(resources.deletedAt)));
}

export async function updateEditorialStatus(
	db: DrizzleDB,
	id: string,
	status: string,
	curatorId: string,
) {
	const updates: Record<string, unknown> = {
		editorialStatus: status,
		assignedCuratorId: curatorId,
		updatedAt: new Date(),
	};
	if (status === "published" || status === "archived") {
		updates.curatedAt = new Date();
	}

	await db
		.update(resources)
		.set(updates)
		.where(and(eq(resources.id, id), isNull(resources.deletedAt)));
}

export async function listUsers(
	db: DrizzleDB,
	opts: { limit?: number; offset?: number; search?: string; role?: string; id?: string } = {},
) {
	const limit = Math.min(opts.limit ?? 20, 100);
	const offset = opts.offset ?? 0;
	const conditions = [];

	if (opts.search) {
		const term = `%${opts.search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}%`;
		conditions.push(
			sql`(${normalizeSearch(user.name)} LIKE ${term} OR ${normalizeSearch(user.email)} LIKE ${term})`,
		);
	}
	if (opts.role) conditions.push(eq(user.role, opts.role));
	if (opts.id) conditions.push(eq(user.id, opts.id));

	const where = conditions.length ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;

	const query = db
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			isActive: user.isActive,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})
		.from(user)
		.limit(limit)
		.offset(offset)
		.orderBy(asc(user.name), asc(user.email));
	const rows = where ? await query.where(where) : await query;

	const countQuery = db.select({ count: sql<number>`count(*)` }).from(user);
	const countRows = where ? await countQuery.where(where) : await countQuery;

	return { data: rows, total: countRows[0]?.count ?? 0, limit, offset };
}

export async function getUserById(db: DrizzleDB, id: string) {
	const rows = await db
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			isActive: user.isActive,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})
		.from(user)
		.where(eq(user.id, id))
		.limit(1);

	return rows[0] ?? null;
}

export async function ensureUser(
	db: DrizzleDB,
	data: { id: string; email: string; name?: string | null; role?: string },
) {
	const existing = await getUserById(db, data.id);
	if (existing) return existing;

	await db.insert(user).values({
		id: data.id,
		email: data.email,
		name: data.name ?? null,
		role: data.role ?? "reader",
		emailVerified: true,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return getUserById(db, data.id);
}

export async function updateUser(
	db: DrizzleDB,
	id: string,
	data: Partial<{ name: string | null; role: string; isActive: boolean }>,
) {
	await db
		.update(user)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(user.id, id));
}

export async function listCollections(
	db: DrizzleDB,
	opts: { limit?: number; offset?: number; search?: string; curatorId?: string } = {},
) {
	const limit = Math.min(opts.limit ?? 20, 100);
	const offset = opts.offset ?? 0;
	const conditions = [];

	if (opts.search) {
		const term = `%${opts.search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}%`;
		conditions.push(
			sql`(${normalizeSearch(collections.title)} LIKE ${term} OR ${normalizeSearch(collections.description)} LIKE ${term})`,
		);
	}
	if (opts.curatorId) {
		conditions.push(eq(collections.curatorId, opts.curatorId));
	}

	const where = conditions.length ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;

	const query = db
		.select({
			id: collections.id,
			slug: collections.slug,
			title: collections.title,
			description: collections.description,
			editorialStatus: collections.editorialStatus,
			curatorId: collections.curatorId,
			createdAt: collections.createdAt,
			updatedAt: collections.updatedAt,
		})
		.from(collections)
		.limit(limit)
		.offset(offset)
		.orderBy(desc(collections.updatedAt));
	const rows = where ? await query.where(where) : await query;

	const countQuery = db.select({ count: sql<number>`count(*)` }).from(collections);
	const countRows = where ? await countQuery.where(where) : await countQuery;

	return { data: rows, total: countRows[0]?.count ?? 0, limit, offset };
}

export async function getCollectionById(db: DrizzleDB, id: string) {
	const rows = await db
		.select({
			id: collections.id,
			slug: collections.slug,
			title: collections.title,
			description: collections.description,
			editorialStatus: collections.editorialStatus,
			curatorId: collections.curatorId,
			isOrdered: collections.isOrdered,
			createdAt: collections.createdAt,
			updatedAt: collections.updatedAt,
		})
		.from(collections)
		.where(eq(collections.id, id))
		.limit(1);

	return rows[0] ?? null;
}

export async function createCollection(
	db: DrizzleDB,
	data: {
		title: string;
		description: string;
		curatorId: string;
		editorialStatus?: string;
		isOrdered?: number;
	},
) {
	const id = crypto.randomUUID();
	const baseSlug = data.title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	const slug = `${baseSlug}-${id.slice(0, 8)}`;
	const now = new Date();

	await db.insert(collections).values({
		id,
		slug,
		title: data.title,
		description: data.description,
		curatorId: data.curatorId,
		editorialStatus: data.editorialStatus ?? "draft",
		isOrdered: data.isOrdered ?? 0,
		createdAt: now,
		updatedAt: now,
	});

	return { id, slug };
}

export async function updateCollection(
	db: DrizzleDB,
	id: string,
	data: Partial<{ title: string; description: string; editorialStatus: string; isOrdered: number }>,
) {
	await db
		.update(collections)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(collections.id, id));
}

export async function deleteCollection(db: DrizzleDB, id: string) {
	await db.delete(collections).where(eq(collections.id, id));
}

export async function listTaxonomies(
	db: DrizzleDB,
	opts: { limit?: number; offset?: number; search?: string; type?: string } = {},
) {
	const limit = Math.min(opts.limit ?? 20, 100);
	const offset = opts.offset ?? 0;
	const conditions = [];

	if (opts.search) {
		const term = `%${opts.search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}%`;
		conditions.push(
			sql`(${normalizeSearch(taxonomies.name)} LIKE ${term} OR ${normalizeSearch(taxonomies.slug)} LIKE ${term})`,
		);
	}
	if (opts.type) {
		conditions.push(eq(taxonomies.type, opts.type));
	}

	const where = conditions.length ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;

	const query = db
		.select({
			id: taxonomies.id,
			slug: taxonomies.slug,
			name: taxonomies.name,
			type: taxonomies.type,
			parentId: taxonomies.parentId,
			createdAt: taxonomies.createdAt,
			updatedAt: taxonomies.updatedAt,
		})
		.from(taxonomies)
		.limit(limit)
		.offset(offset)
		.orderBy(asc(taxonomies.type), asc(taxonomies.name));
	const rows = where ? await query.where(where) : await query;

	const countQuery = db.select({ count: sql<number>`count(*)` }).from(taxonomies);
	const countRows = where ? await countQuery.where(where) : await countQuery;

	return { data: rows, total: countRows[0]?.count ?? 0, limit, offset };
}

export async function getTaxonomyById(db: DrizzleDB, id: string) {
	const rows = await db
		.select({
			id: taxonomies.id,
			slug: taxonomies.slug,
			name: taxonomies.name,
			type: taxonomies.type,
			parentId: taxonomies.parentId,
			createdAt: taxonomies.createdAt,
			updatedAt: taxonomies.updatedAt,
		})
		.from(taxonomies)
		.where(eq(taxonomies.id, id))
		.limit(1);

	return rows[0] ?? null;
}

export async function createTaxonomy(
	db: DrizzleDB,
	data: { name: string; slug?: string; type?: string; parentId?: string | null },
) {
	const id = crypto.randomUUID();
	const baseSlug = (data.slug ?? data.name)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	const slug = `${baseSlug}-${id.slice(0, 8)}`;
	const now = new Date();

	await db.insert(taxonomies).values({
		id,
		slug,
		name: data.name,
		type: data.type ?? "category",
		parentId: data.parentId ?? null,
		createdAt: now,
		updatedAt: now,
	});

	return { id, slug };
}

export async function updateTaxonomy(
	db: DrizzleDB,
	id: string,
	data: Partial<{ name: string; slug: string; type: string; parentId: string | null }>,
) {
	await db
		.update(taxonomies)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(taxonomies.id, id));
}

export async function deleteTaxonomy(db: DrizzleDB, id: string) {
	await db.delete(taxonomies).where(eq(taxonomies.id, id));
}
