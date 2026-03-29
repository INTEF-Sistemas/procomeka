import { pgTable, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { resources } from "./resources.ts";

export const elpxProjects = pgTable("elpx_projects", {
	id: text("id").primaryKey(),
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" })
		.unique(),
	hash: varchar("hash", { length: 64 }).notNull().unique(),
	extractPath: text("extract_path").notNull(),
	originalFilename: text("original_filename").notNull(),
	uploadSessionId: text("upload_session_id"),
	version: integer("version").notNull().default(3),
	hasPreview: integer("has_preview").notNull().default(0),
	elpxMetadata: text("elpx_metadata"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const elpxProjectsRelations = relations(elpxProjects, ({ one }) => ({
	resource: one(resources, {
		fields: [elpxProjects.resourceId],
		references: [resources.id],
	}),
}));
