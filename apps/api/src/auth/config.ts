import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { genericOAuth } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "@procomeka/db/schema";
import {
	ac,
	admin,
	author,
	curator,
	reader,
} from "./permissions.ts";

const db = drizzle(process.env.DATABASE_URL ?? "postgres://localhost:5432/procomeka", { schema });

const oidcEnabled = process.env.OIDC_ENABLED === "true";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
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
