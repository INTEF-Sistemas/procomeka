# Design — Épica 001: MVP de recursos y metadatos mínimos

## Fecha
2026-03-25

## Decisiones de diseño
- Backend sobre Hono + Bun (ADRs 0003, 0007, 0008).
- Persistencia con Drizzle ORM (ADR-0006) y PostgreSQL como principal (ADR-0005).
- Modelo mínimo unificado en tabla `resources` con campos obligatorios y estado editorial.
- API separada en:
  - `/api/admin/resources` (CRUD protegido)
  - `/api/v1/resources` (lectura pública)

## Modelo de datos propuesto (MVP)
Tabla `resources`:
- `id` (uuid, pk)
- `slug` (unique)
- `title` (text, not null)
- `description` (text, not null)
- `language` (varchar 10)
- `license` (varchar 64)
- `resource_type` (varchar 32)
- `educational_stage` (json/text serializado)
- `author` (text)
- `status` (enum: draft/review/published/archived)
- `created_at`
- `updated_at`
- `deleted_at` (nullable, soft delete)

## Contratos API (propuesta)
### Admin (RBAC author+)
- `POST /api/admin/resources`
- `GET /api/admin/resources`
- `GET /api/admin/resources/:id`
- `PATCH /api/admin/resources/:id`
- `DELETE /api/admin/resources/:id`

### Pública
- `GET /api/v1/resources`
- `GET /api/v1/resources/:slug`

## Validación mínima
- Campos obligatorios: `title`, `description`, `language`, `license`, `resourceType`.
- `slug` generado automáticamente si no se envía.
- `status` por defecto `draft`.
- Rechazo con `400` y detalle de errores.

## Impacto en búsqueda/metadatos/moderación
- Búsqueda: habilita la base indexable (`title`, `description`, `resource_type`, `educational_stage`).
- Metadatos: primer perfil mínimo consistente y trazable.
- Moderación: permite transición inicial de estados sin workflow complejo.

## Riesgos técnicos
- Riesgo de lock-in bajo: stack OSS estándar y contratos REST.
- Riesgo principal: definir demasiado corto el perfil mínimo y generar deuda semántica.
- Mitigación: versionar perfil y abrir ADR específica de metadatos en siguiente iteración.
