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
