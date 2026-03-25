import type { Context, Next } from "hono";
import { auth } from "./config.ts";

type AuthUser = typeof auth.$Infer.Session.user;
type AuthSession = typeof auth.$Infer.Session.session;

export type AuthEnv = {
	Variables: {
		user: AuthUser | null;
		session: AuthSession | null;
	};
};

/**
 * Middleware que carga la sesión del usuario en el contexto de Hono.
 * Se ejecuta en todas las rutas; no bloquea si no hay sesión.
 */
export async function sessionMiddleware(c: Context<AuthEnv>, next: Next) {
	const result = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!result) {
		c.set("user", null);
		c.set("session", null);
		await next();
		return;
	}

	c.set("user", result.user);
	c.set("session", result.session);
	await next();
}

/**
 * Guard que requiere autenticación. Devuelve 401 si no hay sesión.
 */
export async function requireAuth(c: Context<AuthEnv>, next: Next) {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "No autenticado" }, 401);
	}
	await next();
}

/**
 * Factory que crea un guard de rol mínimo.
 * Ejemplo: requireRole("curator") permite curator y admin.
 */
export function requireRole(...roles: string[]) {
	return async (c: Context<AuthEnv>, next: Next) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ error: "No autenticado" }, 401);
		}

		const userRole = (user as AuthUser & { role?: string }).role ?? "reader";
		const roleHierarchy = ["reader", "author", "curator", "admin"];
		const userLevel = roleHierarchy.indexOf(userRole);
		const minLevel = Math.min(
			...roles.map((r) => roleHierarchy.indexOf(r)),
		);

		if (userLevel < minLevel) {
			return c.json({ error: "Permisos insuficientes" }, 403);
		}

		await next();
	};
}
