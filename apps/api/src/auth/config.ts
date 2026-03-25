import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { genericOAuth } from "better-auth/plugins";
import {
	ac,
	admin,
	author,
	curator,
	reader,
} from "./permissions.ts";

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4321";
const oidcEnabled = process.env.OIDC_ENABLED === "true";

/**
 * En desarrollo (sin DATABASE_URL): SQLite local vía bun:sqlite + Drizzle.
 * En producción (con DATABASE_URL): PostgreSQL vía bun:sql + Drizzle.
 */
function createDatabase() {
	if (process.env.DATABASE_URL) {
		const { drizzle } = require("drizzle-orm/bun-sql");
		return {
			db: drizzle(process.env.DATABASE_URL),
			provider: "pg" as const,
		};
	}

	const { drizzle } = require("drizzle-orm/bun-sqlite");
	const { Database } = require("bun:sqlite");
	const dbPath = `${import.meta.dir}/../../../../local.db`;
	const sqlite = new Database(dbPath, { create: true });
	return {
		db: drizzle(sqlite),
		provider: "sqlite" as const,
	};
}

const { db, provider } = createDatabase();

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
	trustedOrigins: [frontendUrl],
	database: drizzleAdapter(db, { provider }),
	basePath: "/api/auth",
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 días
		updateAge: 60 * 60 * 24, // refrescar diariamente
	},
	plugins: [
		adminPlugin({
			ac,
			roles: {
				admin,
				curator,
				author,
				reader,
			},
			defaultRole: "reader",
		}),
		...(oidcEnabled
			? [
					genericOAuth({
						config: [
							{
								providerId: "oidc",
								clientId: process.env.OIDC_CLIENT_ID ?? "",
								clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
								discoveryUrl: process.env.OIDC_ISSUER
									? `${process.env.OIDC_ISSUER}/.well-known/openid-configuration`
									: "",
								scopes: ["openid", "email", "profile"],
							},
						],
					}),
				]
			: []),
	],
});

export type Auth = typeof auth;
