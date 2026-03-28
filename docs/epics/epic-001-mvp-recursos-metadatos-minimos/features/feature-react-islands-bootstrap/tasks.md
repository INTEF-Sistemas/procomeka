# Tasks — Feature React Islands Bootstrap

## Fecha
2026-03-28

## Estado
En desarrollo

## Bootstrap
- [x] Añadir `@astrojs/react`, `react` y `react-dom` en `apps/frontend`.
- [x] Registrar la integración React en `astro.config.ts`.
- [x] Crear la frontera `src/islands/` para componentes React.

## Piloto de categorías
- [x] Sustituir el script inline de `admin/categorias` por una island React.
- [x] Crear primitives compartidas para feedback, confirmación y tabla CRUD.
- [x] Mantener alta, edición, borrado, filtro y paginación en la pantalla piloto.

## Testing
- [x] Añadir `@testing-library/react` al frontend.
- [x] Crear test TypeScript del piloto con `bun test`.
- [ ] Ejecutar build y suite de validación completa.

## Cierre de validación — 2026-03-28
- [x] Ejecutar build y suite de validación completa.

## Migración de colecciones — 2026-03-28
- [x] Sustituir el script inline de `admin/colecciones` por una island React.
- [x] Reutilizar la base compartida (`CrudTable`, `ConfirmDialog`, feedback accesible) en la pantalla de colecciones.
- [x] Cubrir alta, edición, borrado, búsqueda y paginación de colecciones con estado React.
- [x] Ejecutar validación completa tras la migración de `admin/colecciones`.

## Migración de usuarios — 2026-03-28
- [x] Sustituir el script inline de `admin/usuarios` por una island React.
- [x] Cubrir filtros, paginación, cambio de rol y activación/desactivación con estado React.
- [x] Añadir test TypeScript del shell inicial de la nueva island.
- [x] Ejecutar validación completa tras la migración de `admin/usuarios`.

## Migración de recursos index — 2026-03-28
- [x] Sustituir el script inline de `admin/recursos/index` por una island React.
- [x] Cubrir filtros, paginación, navegación a edición y borrado con confirmación desde estado React.
- [x] Añadir test TypeScript del shell inicial de la nueva island.
- [x] Ejecutar validación completa tras la migración de `admin/recursos/index`.

## Migración de formularios de recurso — 2026-03-28
- [x] Sustituir el script inline de `admin/recursos/nuevo` por una island React.
- [x] Sustituir el script inline de `admin/recursos/editar` por una island React.
- [x] Mantener el workflow editorial y el uploader existentes encapsulados dentro de la island de edición.
- [x] Añadir tests TypeScript del shell inicial de alta y edición.
- [x] Ejecutar validación completa tras la migración de formularios de recurso.

## Ajustes posteriores del editor de recurso — 2026-03-28
- [x] Cargar `resource-uploader` de forma diferida para no bloquear la hidratación inicial del editor.
- [x] Restaurar los estilos de `nuevo` y `editar` tras mover el marcado a React islands.
- [x] Corregir el warning de React por claves en el stepper editorial.
- [x] Revalidar frontend (`bun test` y `bun run build`) tras el ajuste.

## Migración del catálogo público y ficha de recurso — 2026-03-28
- [x] Sustituir el controlador imperativo de `index.astro` por React islands para buscador, filtros, vista y paginación.
- [x] Mantener la URL como fuente de verdad para búsqueda, filtros y paginación del catálogo.
- [x] Sustituir el script imperativo de `recurso.astro` por una React island para la ficha pública.
- [x] Añadir tests TypeScript del shell inicial de catálogo y ficha pública.
- [x] Revalidar frontend (`bun test` y `bun run build`) tras la migración pública.

## Migración de login y dashboard — 2026-03-28
- [x] Sustituir el script imperativo de `login.astro` por una React island para autenticación por correo y arranque OIDC.
- [x] Sustituir el script imperativo de `dashboard.astro` por una React island para resúmenes y herramientas de seed.
- [x] Mantener redirección a dashboard/login y visibilidad por rol dentro del flujo React.
- [x] Añadir tests TypeScript del shell inicial de login y dashboard.
- [x] Revalidar frontend (`bun test` y `bun run build`) tras esta migración.

## Migración de layouts y banner preview — 2026-03-28
- [x] Sustituir el script imperativo de `Base.astro` por una React island para el estado de sesión en navegación pública.
- [x] Sustituir el script imperativo de `AdminLayout.astro` por una React island para navegación y menú responsive del backoffice.
- [x] Sustituir el script imperativo de `PreviewBanner.astro` por una React island para cambio de rol y reset en preview.
- [x] Añadir tests TypeScript del shell inicial de estas islands de layout.
- [x] Revalidar frontend (`bun test` y `bun run build`) tras la migración del chrome compartido.
