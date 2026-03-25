import { Hono } from "hono";

/**
 * Mock OIDC Provider para desarrollo local.
 * Implementa el mínimo de OpenID Connect para que Better Auth
 * pueda completar el flujo authorization_code.
 *
 * Usuario de prueba: testuser / password
 */

const MOCK_USER = {
	sub: "oidc-test-user-1",
	name: "Test OIDC User",
	email: "oidc@educacion.gob.es",
};

// Códigos de autorización pendientes (en memoria, solo dev)
const pendingCodes = new Map<string, { redirectUri: string; state: string }>();

const mockOidc = new Hono();

// Discovery endpoint
mockOidc.get("/.well-known/openid-configuration", (c) => {
	const issuer = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/mock-oidc`;
	return c.json({
		issuer,
		authorization_endpoint: `${issuer}/authorize`,
		token_endpoint: `${issuer}/token`,
		userinfo_endpoint: `${issuer}/userinfo`,
		jwks_uri: `${issuer}/jwks`,
		response_types_supported: ["code"],
		subject_types_supported: ["public"],
		id_token_signing_alg_values_supported: ["RS256"],
		scopes_supported: ["openid", "email", "profile"],
		token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
	});
});

// Authorization endpoint — muestra formulario de login
mockOidc.get("/authorize", (c) => {
	const redirectUri = c.req.query("redirect_uri") ?? "";
	const state = c.req.query("state") ?? "";
	const clientId = c.req.query("client_id") ?? "";

	return c.html(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Mock OIDC Login</title>
<style>
	body { font-family: system-ui; max-width: 400px; margin: 4rem auto; padding: 1rem; }
	input { width: 100%; padding: .5rem; margin: .25rem 0 1rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
	button { width: 100%; padding: .75rem; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; }
	.info { background: #f3f4f6; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; font-size: .85rem; }
</style></head>
<body>
	<h2>Mock OIDC — Login Institucional</h2>
	<div class="info">
		<strong>Servidor de prueba</strong><br>
		Usuario: <code>testuser</code> / Contraseña: <code>password</code><br>
		Client: <code>${clientId}</code>
	</div>
	<form method="POST" action="/mock-oidc/authorize">
		<input type="hidden" name="redirect_uri" value="${redirectUri}">
		<input type="hidden" name="state" value="${state}">
		<label>Usuario</label>
		<input name="username" value="testuser" required>
		<label>Contraseña</label>
		<input type="password" name="password" value="password" required>
		<button type="submit">Iniciar sesión</button>
	</form>
</body></html>`);
});

// Authorization POST — valida credenciales y redirige con code
mockOidc.post("/authorize", async (c) => {
	const body = await c.req.parseBody();
	const username = body.username as string;
	const password = body.password as string;
	const redirectUri = body.redirect_uri as string;
	const state = body.state as string;

	if (username !== "testuser" || password !== "password") {
		return c.html("<h2>Credenciales incorrectas</h2><a href='javascript:history.back()'>Volver</a>", 401);
	}

	const code = crypto.randomUUID();
	pendingCodes.set(code, { redirectUri, state });

	// Limpiar códigos viejos (>5 min)
	setTimeout(() => pendingCodes.delete(code), 5 * 60 * 1000);

	const url = new URL(redirectUri);
	url.searchParams.set("code", code);
	if (state) url.searchParams.set("state", state);

	return c.redirect(url.toString());
});

// Token endpoint — intercambia code por tokens
mockOidc.post("/token", async (c) => {
	const body = await c.req.parseBody();
	const code = body.code as string;

	const pending = pendingCodes.get(code);
	if (!pending) {
		return c.json({ error: "invalid_grant" }, 400);
	}
	pendingCodes.delete(code);

	// JWT mínimo sin firma real (solo para dev)
	const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
	const now = Math.floor(Date.now() / 1000);
	const payload = btoa(JSON.stringify({
		iss: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/mock-oidc`,
		sub: MOCK_USER.sub,
		aud: "procomeka",
		exp: now + 3600,
		iat: now,
		email: MOCK_USER.email,
		name: MOCK_USER.name,
	}));
	const idToken = `${header}.${payload}.`;

	return c.json({
		access_token: `mock-access-${code}`,
		token_type: "Bearer",
		expires_in: 3600,
		id_token: idToken,
		scope: "openid email profile",
	});
});

// UserInfo endpoint
mockOidc.get("/userinfo", (c) => {
	return c.json(MOCK_USER);
});

// JWKS vacío (usamos alg: none para dev)
mockOidc.get("/jwks", (c) => {
	return c.json({ keys: [] });
});

export { mockOidc };
