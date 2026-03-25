import { defineConfig } from "drizzle-kit";

const dialect = process.env.DB_DIALECT === "sqlite" ? "sqlite" : "postgresql";

export default defineConfig({
	dialect,
	schema: "./src/schema/index.ts",
	out: "./migrations",
	...(dialect === "postgresql"
		? {
				dbCredentials: {
					url: process.env.DATABASE_URL ?? "postgres://localhost:5432/procomeka",
				},
			}
		: {
				dbCredentials: {
					url: process.env.DB_FILE_NAME ?? "local.db",
				},
			}),
	verbose: true,
	strict: true,
});
