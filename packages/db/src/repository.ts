/**
 * Funciones de repositorio reutilizables.
 * Aceptan una instancia Drizzle como parámetro para funcionar
 * tanto en el servidor (API) como en el navegador (preview).
 */
import { eq, like, sql, desc, isNull, and } from "drizzle-orm";
import {
	resources,
	resourceSubjects,
	resourceLevels,
} from "./schema/resources.ts";

type DrizzleDB = {
	select: (...args: unknown[]) => unknown;
	insert: (...args: unknown[]) => unknown;
	update: (...args: unknown[]) => unknown;
	// biome-ignore lint: generic drizzle db type
	[key: string]: any;
};

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
	},
) {
	const limit = Math.min(opts.limit ?? 20, 100);
	const offset = opts.offset ?? 0;

	const conditions = [isNull(resources.deletedAt)];
	if (opts.search) {
		conditions.push(like(resources.title, `%${opts.search}%`));
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

	const where = conditions.reduce((a, b) => sql`${a} AND ${b}`);

	const rows = await db
		.select()
		.from(resources)
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
		.select()
		.from(resources)
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
		.select()
		.from(resources)
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
