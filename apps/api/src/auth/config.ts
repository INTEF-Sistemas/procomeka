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
const usePostgres = !!process.env.DATABASE_URL;

/**
 * En desarrollo (sin DATABASE_URL): SQLite local vía bun:sqlite + Drizzle.
 * En producción (con DATABASE_URL): PostgreSQL vía bun:sql + Drizzle.
 *
 * Cada entorno usa su propio schema Drizzle (pgTable vs sqliteTable)
 * porque Drizzle requiere tipos de tabla específicos por dialecto.
 */
function createDrizzleAdapter() {
	if (usePostgres) {
		// biome-ignore lint/style/noCommaOperator: dynamic import workaround
		const { drizzle } = require("drizzle-orm/bun-sql");
		const pgSchema = require("@procomeka/db/schema");
		const db = drizzle(process.env.DATABASE_URL, { schema: pgSchema });
		return drizzleAdapter(db, { provider: "pg", schema: pgSchema });
	}

	const { drizzle } = require("drizzle-orm/bun-sqlite");
	const { Database } = require("bun:sqlite");
	const dbPath = `${import.meta.dir}/../../../../local.db`;
	const sqlite = new Database(dbPath, { create: true });

	// Schema SQLite para Better Auth — ruta relativa desde apps/api/src/auth/
	const sqliteSchema = require("../../../../packages/db/src/schema/auth-sqlite.ts");
	const db = drizzle(sqlite, { schema: sqliteSchema });
	return drizzleAdapter(db, { provider: "sqlite", schema: sqliteSchema });
}

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
	trustedOrigins: [frontendUrl],
	database: createDrizzleAdapter(),
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
