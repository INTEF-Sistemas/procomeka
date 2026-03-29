import { faker } from "@faker-js/faker/locale/es";
import {
	resources,
	resourceSubjects,
	resourceLevels,
	mediaItems,
} from "./schema/resources.ts";
import { elpxProjects } from "./schema/elpx.ts";
import { uploadSessions } from "./schema/uploads.ts";
import { user } from "./schema/auth.ts";
import {
	VALID_LANGUAGES,
	VALID_LICENSES,
	VALID_STATUSES,
} from "./validation.ts";
import { eq, inArray, sql } from "drizzle-orm";

const RESOURCE_TYPES = [
	"secuencia-didactica",
	"actividad-interactiva",
	"ejercicio",
	"proyecto",
	"video",
	"podcast",
	"infografia",
	"guia-docente",
];

const SUBJECTS = [
	"matematicas",
	"lengua-castellana",
	"ciencias-naturales",
	"ciencias-sociales",
	"ingles",
	"educacion-fisica",
	"educacion-artistica",
	"informatica",
	"filosofia",
	"geografia",
	"historia",
];

const LEVELS = [
	"educacion-infantil",
	"educacion-primaria",
	"educacion-secundaria-obligatoria",
	"bachillerato",
	"formacion-profesional",
	"universidad",
];

export interface ElpxSeedConfig {
	/** Absolute paths to .elpx fixture files */
	fixtures: string[];
	/** Base storage dir (e.g. local-data/uploads) */
	storageDir: string;
	/** Function to process an .elpx file; returns hash, extractPath, hasPreview, metadata */
	processElpx: (filePath: string, storageDir: string) => Promise<{
		hash: string;
		extractPath: string;
		hasPreview: boolean;
		metadata: Record<string, string>;
	}>;
}

export async function seedRandomResources(
	// biome-ignore lint: generic drizzle db type
	db: any,
	count: number,
	options: { clean?: boolean; elpx?: ElpxSeedConfig } = {},
) {
	if (options.clean) {
		// Borrar recursos generados (identificados por un prefijo en el externalId o similar)
		// Para simplificar, si se pide clean, borramos los que tengan externalId con prefijo 'seed-'

		// PGlite a veces tiene problemas con inArray y subconsultas complejas,
		// así que lo hacemos en dos pasos si es necesario, o usamos una forma más simple.
		const seedResourceIds = await db
			.select({ id: resources.id })
			.from(resources)
			.where(sql`${resources.externalId} LIKE 'seed-%'`);

		const ids = seedResourceIds.map((r: { id: string }) => r.id);

		if (ids.length > 0) {
			await db.delete(elpxProjects).where(inArray(elpxProjects.resourceId, ids));
			await db.delete(resourceSubjects).where(inArray(resourceSubjects.resourceId, ids));
			await db.delete(resourceLevels).where(inArray(resourceLevels.resourceId, ids));
			await db.delete(resources).where(inArray(resources.id, ids));
		}
	}

	const users = await db.select({ id: user.id }).from(user).limit(10);
	const userIds = users.map((u: { id: string }) => u.id);

	if (userIds.length === 0) {
		throw new Error(
			"No hay usuarios en la base de datos para asignar los recursos. Ejecuta primero el seed de usuarios.",
		);
	}

	const startTime = Date.now();
	const batchSize = 100;
	let createdCount = 0;

	for (let i = 0; i < count; i += batchSize) {
		const currentBatchSize = Math.min(batchSize, count - i);
		const resourcesToInsert = [];
		const subjectsToInsert = [];
		const levelsToInsert = [];

		for (let j = 0; j < currentBatchSize; j++) {
			const id = crypto.randomUUID();
			const title = faker.commerce.productName();
			const baseSlug = title
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");
			const slug = `${baseSlug}-${id.slice(0, 8)}`;

			const createdAt = faker.date.past({ years: 1 });
			const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

			resourcesToInsert.push({
				id,
				slug,
				externalId: `seed-${faker.string.alphanumeric(10)}`,
				title,
				description: faker.commerce.productDescription(),
				language: faker.helpers.arrayElement(VALID_LANGUAGES),
				license: faker.helpers.arrayElement(VALID_LICENSES),
				resourceType: faker.helpers.arrayElement(RESOURCE_TYPES),
				keywords: faker.lorem.words(5).split(" ").join(","),
				author: faker.person.fullName(),
				publisher: faker.company.name(),
				createdBy: faker.helpers.arrayElement(userIds),
				editorialStatus: faker.helpers.arrayElement(VALID_STATUSES),
				createdAt,
				updatedAt,
			});

			const numSubjects = faker.number.int({ min: 1, max: 3 });
			const selectedSubjects = faker.helpers.arrayElements(
				SUBJECTS,
				numSubjects,
			);
			for (const s of selectedSubjects) {
				subjectsToInsert.push({ resourceId: id, subject: s });
			}

			const numLevels = faker.number.int({ min: 1, max: 2 });
			const selectedLevels = faker.helpers.arrayElements(LEVELS, numLevels);
			for (const l of selectedLevels) {
				levelsToInsert.push({ resourceId: id, level: l });
			}
		}

		await db.insert(resources).values(resourcesToInsert);
		if (subjectsToInsert.length > 0) {
			await db.insert(resourceSubjects).values(subjectsToInsert);
		}
		if (levelsToInsert.length > 0) {
			await db.insert(resourceLevels).values(levelsToInsert);
		}

		// Randomly attach .elpx fixtures to ~40% of resources in the batch
		if (options.elpx && options.elpx.fixtures.length > 0) {
			const candidates = resourcesToInsert.filter(() => Math.random() < 0.4);
			for (const res of candidates) {
				try {
					const fixture = faker.helpers.arrayElement(options.elpx.fixtures);
					const result = await options.elpx.processElpx(fixture, options.elpx.storageDir);

					const uploadId = crypto.randomUUID();
					const filename = fixture.split("/").pop() ?? "resource.elpx";

					await db.insert(mediaItems).values({
						id: crypto.randomUUID(),
						resourceId: res.id,
						type: "file",
						mimeType: "application/zip",
						url: `/api/v1/uploads/${uploadId}/content`,
						fileSize: null,
						filename,
						isPrimary: 1,
					});

					await db.insert(elpxProjects).values({
						id: crypto.randomUUID(),
						resourceId: res.id,
						hash: result.hash,
						extractPath: result.extractPath,
						originalFilename: filename,
						uploadSessionId: null,
						version: 3,
						hasPreview: result.hasPreview ? 1 : 0,
						elpxMetadata: JSON.stringify(result.metadata),
						createdAt: new Date(),
						updatedAt: new Date(),
					});
				} catch (err) {
					// Skip this resource if elpx processing fails
					console.error(`[seed] Error processing elpx for ${res.id}:`, err);
				}
			}
		}

		createdCount += currentBatchSize;
	}

	const duration = Date.now() - startTime;
	return {
		count: createdCount,
		durationMs: duration,
	};
}
