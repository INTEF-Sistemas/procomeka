import { Hono } from "hono";

/**
 * Rutas públicas — sin autenticación requerida.
 * Vista pública de la plataforma: búsqueda, consulta de recursos y colecciones.
 */
const publicRoutes = new Hono();

publicRoutes.get("/resources", (c) =>
	c.json({ data: [], total: 0, message: "Listado de recursos (pendiente)" }),
);

publicRoutes.get("/resources/:slug", (c) => {
	const { slug } = c.req.param();
	return c.json({ slug, message: "Detalle de recurso (pendiente)" });
});

publicRoutes.get("/collections", (c) =>
	c.json({
		data: [],
		total: 0,
		message: "Listado de colecciones (pendiente)",
	}),
);

publicRoutes.get("/collections/:slug", (c) => {
	const { slug } = c.req.param();
	return c.json({ slug, message: "Detalle de colección (pendiente)" });
});

export { publicRoutes };
