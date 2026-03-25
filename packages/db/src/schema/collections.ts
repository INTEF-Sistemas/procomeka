import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { resources } from "./resources.ts";
import { user } from "./auth.ts";

export const collections = pgTable("collections", {
	id: text("id").primaryKey(),
	slug: varchar("slug", { length: 512 }).notNull().unique(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	coverImageUrl: text("cover_image_url"),
	isOrdered: integer("is_ordered").notNull().default(0),
	editorialStatus: varchar("editorial_status", { length: 50 })
		.notNull()
		.default("borrador"),
	curatorId: text("curator_id")
		.notNull()
		.references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collectionResources = pgTable("collection_resources", {
	collectionId: text("collection_id")
		.notNull()
		.references(() => collections.id, { onDelete: "cascade" }),
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	position: integer("position").notNull().default(0),
});

// Relaciones
export const collectionsRelations = relations(collections, ({ one, many }) => ({
	curator: one(user, {
		fields: [collections.curatorId],
		references: [user.id],
	}),
	resources: many(collectionResources),
}));

export const collectionResourcesRelations = relations(
	collectionResources,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionResources.collectionId],
			references: [collections.id],
		}),
		resource: one(resources, {
			fields: [collectionResources.resourceId],
			references: [resources.id],
		}),
	}),
);
