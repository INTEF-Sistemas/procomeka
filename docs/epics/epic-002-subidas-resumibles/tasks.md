# Tasks — Épica 002: subidas resumibles y adjuntos

## Estado
En desarrollo

## Backend
- [x] Añadir `upload_sessions` al esquema compartido y setup de tablas.
- [x] Integrar rutas `/api/uploads` con protocolo resumable.
- [x] Persistir estado de upload y crear `media_items` al completar.
- [x] Exponer endpoints admin para config, uploads recientes, adjuntos y descarga autenticada.

## Frontend
- [x] Extender `ApiClient` con contratos de uploads.
- [x] Añadir panel de uploads en edición de recursos.
- [x] Soportar cola multiarchivo, progreso, cancelación y listado de adjuntos.
- [x] Redirigir la creación de recurso al editor para adjuntar archivos.

## Documentación
- [x] Registrar ADR de subidas resumibles.
- [x] Documentar variables de entorno y operación básica en README.
- [x] Actualizar `STATUS.md` con el estado de la entrega.

## Validación
- [x] Tests unitarios de configuración de uploads.
- [x] Tests de integración del flujo `tus` básico (crear, completar, cancelar).
- [x] `env -u DATABASE_URL bun run check-coverage`
