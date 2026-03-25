# Tasks — Épica 001: MVP de recursos y metadatos mínimos

## Fecha
2026-03-25

## Estado de la épica
En planificación

## Documentación
- [x] Crear artefactos base de la épica (`requirements.md`, `design.md`, `tasks.md`, `validation.md`).
- [ ] Crear ADR de perfil mínimo de metadatos usando plantilla `.templates/adr-template.md`.
- [ ] Alinear `docs/producto/roadmap.md` con fecha de inicio de la épica.

## Backend
- [ ] Implementar servicio `resourcesService` con operaciones CRUD.
- [ ] Sustituir placeholders de rutas `/api/admin/resources` por persistencia real.
- [ ] Exponer lectura pública de recursos publicados en `/api/v1/resources`.
- [ ] Añadir validación de payload y códigos de error consistentes.

## Base de datos
- [ ] Definir esquema Drizzle para `resources` y migración inicial.
- [ ] Añadir índices para `slug`, `status` y `resource_type`.
- [ ] Implementar soft delete (`deleted_at`) y auditoría mínima (`created_at`, `updated_at`).

## Frontend
- [ ] Crear vista editorial mínima para crear/editar recurso.
- [ ] Mostrar errores de validación accesibles en formulario.
- [ ] Añadir listado mínimo de recursos en dashboard.

## Testing
- [x] Corregir configuración para que `bun test` no ejecute accidentalmente Playwright E2E.
- [x] Añadir test automatizado TypeScript para validar separación unit/e2e.
- [ ] Añadir tests unitarios de servicio de recursos (casos válidos e inválidos).
- [ ] Añadir tests de rutas admin/públicas con persistencia real (mock DB o SQLite test).
- [ ] Ejecutar `bun test` en cada cambio de feature y registrar resultados.

## Trazabilidad de ejecución
- 2026-03-25: se prepara la épica y se corrige la separación de tests unitarios vs E2E.
