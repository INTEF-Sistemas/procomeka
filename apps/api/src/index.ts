import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth/config.ts";
import { type AuthEnv, sessionMiddleware } from "./auth/middleware.ts";
import { publicRoutes } from "./routes/public.ts";
import { adminRoutes } from "./routes/admin.ts";
import { mockOidc } from "./routes/mock-oidc.ts";

const app = new Hono<AuthEnv>();

// CORS para rutas API (no necesario en /health)
app.use(
	"/api/*",
	cors({
		origin: process.env.FRONTEND_URL ?? "http://localhost:4321",
		credentials: true,
	}),
);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Sesión solo en rutas que la necesitan (admin + session endpoint)
app.use("/api/admin/*", sessionMiddleware);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/api/v1/config", (c) =>
	c.json({ oidcEnabled: process.env.OIDC_ENABLED === "true" }),
);

app.get("/", (c) =>
	c.json({
		name: "Procomeka API",
		version: "0.1.0",
	}),
);

app.route("/api/v1", publicRoutes);
app.route("/api/admin", adminRoutes);

// Mock OIDC provider para desarrollo (solo si no hay IdP externo)
if (!process.env.DATABASE_URL) {
	app.route("/mock-oidc", mockOidc);
}

export default {
	port: Number(process.env.PORT ?? 3000),
	fetch: app.fetch,
};

export { app };
