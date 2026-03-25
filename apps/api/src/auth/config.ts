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

// Cargar .env desde la raíz del proyecto (bun --filter ejecuta desde apps/api/)
const rootEnvPath = `${import.meta.dir}/../../../../.env`;
const rootEnv = Bun.file(rootEnvPath);
if (await rootEnv.exists()) {
	const text = await rootEnv.text();
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		const key = trimmed.slice(0, eqIdx).trim();
		const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
		if (!process.env[key]) process.env[key] = val;
	}
}

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4321";
const oidcEnabled = process.env.OIDC_ENABLED === "true";

/**
 * SQLite en dev (sin DATABASE_URL), PostgreSQL en prod (con DATABASE_URL).
 * Cada entorno usa su propio schema Drizzle (pgTable vs sqliteTable).
 */
function createDrizzleAdapter() {
	if (process.env.DATABASE_URL) {
		const { drizzle } = require("drizzle-orm/bun-sql");
		const pgSchema = require("@procomeka/db/schema");
		const db = drizzle(process.env.DATABASE_URL, { schema: pgSchema });
		return drizzleAdapter(db, { provider: "pg", schema: pgSchema });
	}

	const { drizzle } = require("drizzle-orm/bun-sqlite");
	const { Database } = require("bun:sqlite");
	const dbPath = process.env.DB_PATH ?? `${import.meta.dir}/../../../../local.db`;
	const sqlite = new Database(dbPath, { create: true });
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
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
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
								scopes: (process.env.OIDC_SCOPE ?? "openid email profile").split(" "),
								pkce: true,
							},
						],
					}),
				]
			: []),
	],
});

export type Auth = typeof auth;
