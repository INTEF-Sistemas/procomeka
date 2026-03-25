# ADR-0009 Perfil mínimo de metadatos para recursos educativos

* Estado: Aceptado
* Fecha: 2026-03-25
* Agentes Implicados: [@.agents/skills/metadatos-y-curacion], [@.agents/skills/backend-api-servicios]

## Contexto y Problema

La plataforma necesita un conjunto base de metadatos para describir recursos educativos de forma consistente. Este perfil mínimo debe equilibrar utilidad inmediata con simplicidad, siendo compatible con evolución futura hacia perfiles LRMI/Dublin Core.

Sin un perfil definido, cada recurso podría describirse de forma inconsistente, dificultando búsqueda, filtrado, interoperabilidad y curación editorial.

## Opciones Consideradas

* Perfil LRMI completo desde el inicio (20+ campos obligatorios)
* Perfil Dublin Core estricto (15 elementos base)
* Perfil mínimo pragmático con campos esenciales + opcionales evolutivos

## Decisión

Se adopta un **perfil mínimo pragmático** con 5 campos obligatorios y campos opcionales, diseñado para ser ampliable sin romper compatibilidad.

### Campos obligatorios
| Campo | Tipo | Restricción |
|-------|------|------------|
| `title` | text | 1-500 caracteres |
| `description` | text | 1-5000 caracteres |
| `language` | varchar(10) | ISO 639-1: es, en, ca, eu, gl, fr, pt, de, it |
| `license` | varchar(64) | cc-by, cc-by-sa, cc-by-nc, cc-by-nc-sa, cc-by-nc-nd, cc-by-nd, cc0 |
| `resourceType` | varchar(100) | texto libre (documento, video, etc.) |

### Campos opcionales
- `author` (text, máx 500)
- `keywords` (text, máx 1000)
- `publisher` (text)
- `subjects` (relación many-to-many)
- `levels` (relación many-to-many)
- `duration` (integer, segundos)

### Campos de sistema (automáticos)
- `id` (UUID), `slug` (unique, auto-generado)
- `editorialStatus`: draft | review | published | archived
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- `assignedCuratorId`, `curatedAt`

### Valores de estado editorial
Se adoptan valores en **inglés** (`draft`, `review`, `published`, `archived`) por coherencia con estándares internacionales y compatibilidad LRMI/DC.

## Consecuencias

### Positivas
* Permite crear recursos útiles con mínimo esfuerzo descriptivo
* Compatible con evolución a LRMI (title→name, description→description, etc.)
* Validación clara y predecible por campo
* Estados editoriales en inglés facilitan interoperabilidad

### Negativas / Riesgos
* Perfil puede ser insuficiente para interoperabilidad avanzada (OAI-PMH)
* `resourceType` como texto libre puede generar inconsistencia; se mitigará con vocabulario controlado en siguiente iteración
* Migración de valores de estado de español a inglés en datos existentes (irrelevante en MVP sin datos de producción)

## Notas de Implementación

- Validación implementada en `apps/api/src/resources/validation.ts` como funciones puras
- Schema Drizzle en `packages/db/src/schema/resources.ts` (PG) y `resources-sqlite.ts`
- API devuelve errores 400 con detalle por campo: `{ error, details: [{field, message}] }`
- Siguiente iteración: vocabulario controlado para `resourceType`, campos de accesibilidad obligatorios
