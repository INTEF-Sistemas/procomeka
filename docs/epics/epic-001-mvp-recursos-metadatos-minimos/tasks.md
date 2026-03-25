# Tasks — Épica 001: MVP de recursos y metadatos mínimos

## Fecha
2026-03-25

## Estado de la épica
En desarrollo

## Documentación
- [x] Crear artefactos base de la épica (`requirements.md`, `design.md`, `tasks.md`, `validation.md`).
- [x] Crear ADR de perfil mínimo de metadatos usando plantilla `.templates/adr-template.md`.
- [ ] Alinear `docs/producto/roadmap.md` con fecha de inicio de la épica.

## Backend
- [x] Implementar servicio `resourcesService` con operaciones CRUD.
- [x] Sustituir placeholders de rutas `/api/admin/resources` por persistencia real.
- [x] Exponer lectura pública de recursos publicados en `/api/v1/resources`.
- [x] Añadir validación de payload y códigos de error consistentes.

## Base de datos
- [x] Definir esquema Drizzle para `resources` y migración inicial.
- [x] Añadir índices para `slug`, `status` y `resource_type`.
- [x] Implementar soft delete (`deleted_at`) y auditoría mínima (`created_at`, `updated_at`).

## Frontend
- [x] Crear vista editorial mínima para crear/editar recurso.
- [x] Mostrar errores de validación accesibles en formulario.
- [x] Añadir listado mínimo de recursos en dashboard.

## Testing
- [x] Corregir configuración para que `bun test` no ejecute accidentalmente Playwright E2E.
- [x] Añadir test automatizado TypeScript para validar separación unit/e2e.
- [x] Añadir tests unitarios de servicio de recursos (casos válidos e inválidos).
- [x] Añadir tests de rutas admin/públicas con persistencia real (mock DB o SQLite test).
- [x] Ejecutar `bun test` en cada cambio de feature y registrar resultados.

## Trazabilidad de ejecución
- 2026-03-25: se prepara la épica y se corrige la separación de tests unitarios vs E2E.
- 2026-03-25: implementación completa de Épica 001:
  - Schema: añadido `deleted_at` a tablas PG y SQLite, cambiado default status a `draft`, añadidos índices.
  - Validación: módulo `validation.ts` con funciones puras (26 tests).
  - Repository: soft delete, filtro `deleted_at IS NULL`, `getResourceById`, status en inglés.
  - Rutas admin: GET list/detail, POST con validación por campo, PATCH, soft DELETE.
  - Rutas públicas: filtrado exclusivo de recursos `published` no eliminados.
  - Frontend: formularios con accesibilidad WCAG AA (aria-describedby, aria-invalid, role=alert), vista de edición, listado en dashboard.
  - Tests: 73 tests pasando (validación, admin CRUD+RBAC, integración pública, filtrado).
  - ADR-0009: perfil mínimo de metadatos documentado.
