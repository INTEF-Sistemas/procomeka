import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth/config.ts";
import { type AuthEnv, sessionMiddleware } from "./auth/middleware.ts";
import { publicRoutes } from "./routes/public.ts";
import { adminRoutes } from "./routes/admin.ts";

const app = new Hono<AuthEnv>();

app.use(
	"/api/*",
	cors({
		origin: process.env.FRONTEND_URL ?? "http://localhost:4321",
		credentials: true,
	}),
);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Sesión solo en rutas admin
app.use("/api/admin/*", sessionMiddleware);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/", (c) =>
	c.json({
		name: "Procomeka API",
		version: "0.1.0",
	}),
);

app.get("/api/v1/config", (c) =>
	c.json({
		oidcEnabled: process.env.OIDC_ENABLED === "true",
		oidcEndSessionUrl: process.env.OIDC_ISSUER
			? `${process.env.OIDC_ISSUER}/connect/endsession`
			: null,
	}),
);

app.route("/api/v1", publicRoutes);
app.route("/api/admin", adminRoutes);

export default {
	port: Number(process.env.PORT ?? 3000),
	fetch: app.fetch,
};

export { app };
