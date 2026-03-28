import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const taxonomies = pgTable("taxonomies", {
	id: text("id").primaryKey(),
	slug: varchar("slug", { length: 255 }).notNull().unique(),
	name: text("name").notNull(),
	type: varchar("type", { length: 100 }).notNull().default("category"),
	parentId: text("parent_id").references((): AnyPgColumn => taxonomies.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
