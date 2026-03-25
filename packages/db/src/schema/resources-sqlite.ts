import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-sqlite.ts";

export const resources = sqliteTable("resources", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	externalId: text("external_id"),
	sourceUri: text("source_uri"),

	title: text("title").notNull(),
	description: text("description").notNull(),
	language: text("language").notNull(),
	license: text("license").notNull(),
	resourceType: text("resource_type").notNull(),
	keywords: text("keywords"),
	author: text("author"),
	publisher: text("publisher"),
	duration: integer("duration"),

	accessibilityFeatures: text("accessibility_features"),
	accessibilityHazards: text("accessibility_hazards"),
	accessMode: text("access_mode"),

	editorialStatus: text("editorial_status").notNull().default("borrador"),
	assignedCuratorId: text("assigned_curator_id").references(() => user.id),
	curatedAt: integer("curated_at", { mode: "timestamp" }),
	featuredAt: integer("featured_at", { mode: "timestamp" }),

	importedAt: integer("imported_at", { mode: "timestamp" }),
	importSource: text("import_source"),

	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const mediaItems = sqliteTable("media_items", {
	id: text("id").primaryKey(),
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	mimeType: text("mime_type"),
	url: text("url").notNull(),
	fileSize: integer("file_size"),
	filename: text("filename"),
	isPrimary: integer("is_primary").notNull().default(0),
});

export const resourceSubjects = sqliteTable("resource_subjects", {
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	subject: text("subject").notNull(),
});

export const resourceLevels = sqliteTable("resource_levels", {
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	level: text("level").notNull(),
});

export const resourcesRelations = relations(resources, ({ one, many }) => ({
	curator: one(user, {
		fields: [resources.assignedCuratorId],
		references: [user.id],
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
