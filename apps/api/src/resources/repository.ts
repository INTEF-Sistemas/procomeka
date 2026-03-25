import { eq, like, sql, desc } from "drizzle-orm";
import { getDb } from "../db.ts";

// Importaciones dinámicas según el provider
function getSchema() {
	const { provider } = getDb();
	if (provider === "pg") {
		return require("@procomeka/db/schema");
	}
	return require("../../../../packages/db/src/schema/resources-sqlite.ts");
}

type ResourceRow = {
	id: string;
	slug: string;
	title: string;
	description: string;
	language: string;
	license: string;
	resourceType: string;
	keywords: string | null;
	author: string | null;
	publisher: string | null;
	editorialStatus: string;
	createdAt: unknown;
	updatedAt: unknown;
};

export async function listResources(opts: {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
}) {
	const { db } = getDb();
	const schema = getSchema();
	const { resources } = schema;
	const limit = Math.min(opts.limit ?? 20, 100);
	const offset = opts.offset ?? 0;

	const conditions = [];
	if (opts.search) {
		conditions.push(like(resources.title, `%${opts.search}%`));
	}
	if (opts.status) {
		conditions.push(eq(resources.editorialStatus, opts.status));
	}

	const where = conditions.length > 0
		? conditions.reduce((a, b) => sql`${a} AND ${b}`)
		: undefined;

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

export async function getResourceBySlug(slug: string) {
	const { db } = getDb();
	const schema = getSchema();
	const { resources, resourceSubjects, resourceLevels } = schema;

	const rows = await db
		.select()
		.from(resources)
		.where(eq(resources.slug, slug))
		.limit(1);

	const resource = rows[0] as ResourceRow | undefined;
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

export async function createResource(data: {
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
}) {
	const { db } = getDb();
	const schema = getSchema();
	const { resources, resourceSubjects, resourceLevels } = schema;

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
		editorialStatus: "borrador",
		createdAt: now,
		updatedAt: now,
	});

	if (data.subjects?.length) {
		for (const subject of data.subjects) {
			await db.insert(resourceSubjects).values({ resourceId: id, subject });
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
	const { db } = getDb();
	const schema = getSchema();
	const { resources } = schema;

	await db
		.update(resources)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(resources.id, id));
}

export async function deleteResource(id: string) {
	const { db } = getDb();
	const schema = getSchema();
	const { resources } = schema;

	await db.delete(resources).where(eq(resources.id, id));
}

export async function updateEditorialStatus(
	id: string,
	status: string,
	curatorId: string,
) {
	const { db } = getDb();
	const schema = getSchema();
	const { resources } = schema;

	const updates: Record<string, unknown> = {
		editorialStatus: status,
		assignedCuratorId: curatorId,
		updatedAt: new Date(),
	};
	if (status === "validado" || status === "destacado") {
		updates.curatedAt = new Date();
	}
	if (status === "destacado") {
		updates.featuredAt = new Date();
	}

	await db.update(resources).set(updates).where(eq(resources.id, id));
}
