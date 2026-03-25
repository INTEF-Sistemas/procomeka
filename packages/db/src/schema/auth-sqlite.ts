import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Tablas de autenticación para SQLite (desarrollo local).
 * Espejo de auth.ts (PostgreSQL) pero con tipos SQLite.
 */

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified").notNull().default(0),
	name: text("name").notNull(),
	image: text("image"),
	role: text("role").notNull().default("reader"),
	isActive: integer("is_active").notNull().default(1),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	lastLoginAt: text("last_login_at"),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	expiresAt: text("expires_at").notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
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
	accessTokenExpiresAt: text("access_token_expires_at"),
	refreshTokenExpiresAt: text("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: text("expires_at").notNull(),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
});
