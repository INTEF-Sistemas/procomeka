import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	name: text("name").notNull(),
	role: varchar("role", { length: 50 }).notNull().default("reader"),
	isActive: integer("is_active").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	lastLoginAt: timestamp("last_login_at"),
});
