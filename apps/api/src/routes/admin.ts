import { Hono } from "hono";
import {
	type AuthEnv,
	requireAuth,
	requireRole,
} from "../auth/middleware.ts";

/**
 * Rutas admin/editorial — requieren autenticación y RBAC.
 * Vista de administración: creación, edición, curación y gestión.
 */
const adminRoutes = new Hono<AuthEnv>();

// Todas las rutas admin requieren autenticación
adminRoutes.use("*", requireAuth);

// Recursos — CRUD editorial
adminRoutes.post("/resources", requireRole("author"), (c) =>
	c.json({ message: "Crear recurso (pendiente)" }, 201),
);

adminRoutes.put("/resources/:id", requireRole("author"), (c) => {
	const { id } = c.req.param();
	return c.json({ id, message: "Actualizar recurso (pendiente)" });
});

adminRoutes.delete("/resources/:id", requireRole("admin"), (c) => {
	const { id } = c.req.param();
	return c.json({ id, message: "Eliminar recurso (pendiente)" });
});

adminRoutes.patch("/resources/:id/status", requireRole("curator"), (c) => {
	const { id } = c.req.param();
	return c.json({ id, message: "Cambiar estado editorial (pendiente)" });
});

// Usuarios — gestión (solo admin)
adminRoutes.get("/users", requireRole("admin"), (c) =>
	c.json({ data: [], total: 0, message: "Listado de usuarios (pendiente)" }),
);

adminRoutes.patch("/users/:id", requireRole("admin"), (c) => {
	const { id } = c.req.param();
	return c.json({ id, message: "Actualizar usuario (pendiente)" });
});

export { adminRoutes };
