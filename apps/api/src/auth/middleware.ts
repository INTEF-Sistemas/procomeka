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

const ROLE_HIERARCHY: Record<string, number> = {
	reader: 0,
	author: 1,
	curator: 2,
	admin: 3,
};

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

export async function requireAuth(c: Context<AuthEnv>, next: Next) {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "No autenticado" }, 401);
	}
	await next();
}

/**
 * Valida roles al construir el middleware (falla al arrancar, no en runtime).
 * Usa jerarquía: requireRole("curator") permite curator y admin.
 */
export function requireRole(...roles: string[]) {
	const minLevel = Math.min(
		...roles.map((r) => {
			const level = ROLE_HIERARCHY[r];
			if (level === undefined) {
				throw new Error(`requireRole: rol desconocido "${r}". Válidos: ${Object.keys(ROLE_HIERARCHY).join(", ")}`);
			}
			return level;
		}),
	);

	return async (c: Context<AuthEnv>, next: Next) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ error: "No autenticado" }, 401);
		}

		const userRole = (user as AuthUser & { role?: string }).role ?? "reader";
		const userLevel = ROLE_HIERARCHY[userRole] ?? -1;

		if (userLevel < minLevel) {
			return c.json({ error: "Permisos insuficientes" }, 403);
		}

		await next();
	};
}
