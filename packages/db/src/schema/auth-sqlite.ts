import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Tablas de autenticación para SQLite (desarrollo local).
 * Los campos de fecha usan integer con mode timestamp
 * para que Drizzle convierta Date <-> number automáticamente.
 */

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	name: text("name"),
	image: text("image"),
	role: text("role").notNull().default("reader"),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	banned: integer("banned", { mode: "boolean" }).default(false),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
	lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});
