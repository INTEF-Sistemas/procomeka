import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { auth } from "./auth/config.ts";
import { type AuthEnv, sessionMiddleware } from "./auth/middleware.ts";
import { publicRoutes } from "./routes/public.ts";
import { adminRoutes } from "./routes/admin.ts";

const app = new Hono<AuthEnv>();

// CSRF protection en rutas de auth
app.use("/api/auth/*", csrf());

// Better Auth handler — gestiona login, registro, sesiones, OIDC
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Middleware de sesión en todas las rutas
app.use("*", sessionMiddleware);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Info de la API
app.get("/", (c) =>
	c.json({
		name: "Procomeka API",
		version: "0.1.0",
	}),
);

// Rutas públicas (sin auth)
app.route("/api/v1", publicRoutes);

// Rutas admin/editorial (auth + RBAC)
app.route("/api/admin", adminRoutes);

export default {
	port: Number(process.env.PORT ?? 3000),
	fetch: app.fetch,
};

export { app };
