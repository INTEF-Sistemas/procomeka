import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const resources = pgTable("resources", {
	id: text("id").primaryKey(),
	slug: varchar("slug", { length: 512 }).notNull().unique(),
	externalId: text("external_id"),
	sourceUri: text("source_uri"),

	// Metadatos descriptivos
	title: text("title").notNull(),
	description: text("description").notNull(),
	language: varchar("language", { length: 10 }).notNull(),
	license: varchar("license", { length: 50 }).notNull(),
	resourceType: varchar("resource_type", { length: 100 }).notNull(),
	keywords: text("keywords"),
	author: text("author"),
	publisher: text("publisher"),
	duration: integer("duration"),

	// Accesibilidad
	accessibilityFeatures: text("accessibility_features"),
	accessibilityHazards: text("accessibility_hazards"),
	accessMode: text("access_mode"),

	// Estado editorial
	editorialStatus: varchar("editorial_status", { length: 50 })
		.notNull()
		.default("borrador"),
	assignedCuratorId: text("assigned_curator_id").references(() => users.id),
	curatedAt: timestamp("curated_at"),
	featuredAt: timestamp("featured_at"),

	// Importación
	importedAt: timestamp("imported_at"),
	importSource: text("import_source"),

	// Sistema
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mediaItems = pgTable("media_items", {
	id: text("id").primaryKey(),
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	type: varchar("type", { length: 50 }).notNull(),
	mimeType: varchar("mime_type", { length: 255 }),
	url: text("url").notNull(),
	fileSize: integer("file_size"),
	filename: text("filename"),
	isPrimary: integer("is_primary").notNull().default(0),
});

// Tablas de unión para relaciones many-to-many
export const resourceSubjects = pgTable("resource_subjects", {
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	subject: varchar("subject", { length: 255 }).notNull(),
});

export const resourceLevels = pgTable("resource_levels", {
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	level: varchar("level", { length: 100 }).notNull(),
});

// Relaciones
export const resourcesRelations = relations(resources, ({ one, many }) => ({
	curator: one(users, {
		fields: [resources.assignedCuratorId],
		references: [users.id],
	}),
	mediaItems: many(mediaItems),
	subjects: many(resourceSubjects),
	levels: many(resourceLevels),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one }) => ({
	resource: one(resources, {
		fields: [mediaItems.resourceId],
		references: [resources.id],
	}),
}));

export const resourceSubjectsRelations = relations(
	resourceSubjects,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceSubjects.resourceId],
			references: [resources.id],
		}),
	}),
);

export const resourceLevelsRelations = relations(
	resourceLevels,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceLevels.resourceId],
			references: [resources.id],
		}),
	}),
);
