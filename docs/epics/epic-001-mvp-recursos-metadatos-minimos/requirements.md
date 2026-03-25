# Requirements — Épica 001: MVP de recursos y metadatos mínimos

## Fecha
2026-03-25

## Problema público/educativo
Actualmente la plataforma no permite alta, edición, consulta y persistencia real de recursos educativos con metadatos mínimos consistentes. Sin este núcleo, no existe catálogo útil para docentes ni base fiable para búsqueda/reutilización.

## Usuario principal
- Docente autor/curador que necesita publicar y mantener recursos reutilizables.

## Objetivo de la épica
Entregar una primera capacidad funcional end-to-end para gestionar recursos con metadatos mínimos, validación básica y persistencia real, habilitando la base para relevancia y búsqueda posterior.

## Alcance funcional (MVP)
1. Modelo de metadatos mínimo para recursos.
2. CRUD real de recursos en API admin.
3. Lectura pública básica de recursos publicados.
4. Validación mínima de payloads.
5. Trazabilidad de cambios y estado editorial inicial.

## Requisitos funcionales mínimos
- RF-001: Crear recurso con campos mínimos obligatorios.
- RF-002: Editar recurso existente.
- RF-003: Eliminar (soft delete) recurso.
- RF-004: Listar recursos con filtros básicos por estado y tipo.
- RF-005: Consultar detalle público por identificador/slug para recursos publicados.
- RF-006: Validar campos obligatorios antes de persistir.

## Datos mínimos del recurso
- `id`
- `slug`
- `title`
- `description`
- `language`
- `license`
- `resourceType`
- `educationalStage` (mínimo uno)
- `author` (texto libre en MVP)
- `status` (`draft`, `review`, `published`, `archived`)
- `createdAt`, `updatedAt`

## Requisitos no funcionales
- Accesibilidad: formularios y mensajes de error compatibles con WCAG AA.
- Rendimiento: operaciones CRUD con respuesta < 300ms en entorno local para dataset pequeño.
- Seguridad: endpoints admin con sesión + RBAC.
- Mantenibilidad: contratos tipados en TypeScript strict + tests automatizados.
- Interoperabilidad: diseño de campos compatible con evolución a perfil LRMI/DC.

## Fuera de alcance (esta épica)
- Búsqueda con ranking/facetas avanzadas.
- Moderación avanzada multi-paso.
- Importación masiva OAI-PMH/CSV.
- Recomendación automática.
