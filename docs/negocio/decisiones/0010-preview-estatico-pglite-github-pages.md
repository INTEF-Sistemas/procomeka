# ADR-0010 Preview estático de PRs con PGlite y GitHub Pages

* Estado: Aceptado
* Fecha: 2026-03-25
* Supersede: ADR-0002
* Agentes Implicados: [@.agents/skills/evaluacion-tecnologica/SKILL.md, @.agents/skills/frontend-ux-accesibilidad/SKILL.md, @.agents/skills/devops-sre/SKILL.md]

## Contexto y Problema

ADR-0002 estableció el concepto de preview estático para PRs, proponiendo sql.js (SQLite WASM) y Cloudflare Pages. Durante la implementación, se identificaron problemas:

1. **Duplicación de esquemas**: Mantener schemas PostgreSQL (`pgTable`) y SQLite (`sqliteTable`) en paralelo era costoso y propenso a errores.
2. **Divergencia de runtime**: El comportamiento de SQLite difiere de PostgreSQL en tipos, timestamps y restricciones.
3. **Complejidad innecesaria**: El codebase mantenía tres modos de base de datos (PostgreSQL, Bun SQLite, sql.js browser) con branching condicional.

PGlite (PostgreSQL compilado a WASM) elimina estos problemas al usar PostgreSQL tanto en producción como en desarrollo local y preview en navegador.

## Opciones Consideradas

* **Opción 1**: Mantener ADR-0002 (sql.js + Cloudflare Pages + esquemas SQLite duplicados).
* **Opción 2**: PGlite en navegador para preview + GitHub Pages + unificación de esquemas PostgreSQL.
* **Opción 3**: PGlite en navegador + PGlite en desarrollo local + GitHub Pages (máxima simplificación).

## Decisión

Elegimos la **Opción 3**: PGlite en todo excepto producción.

- **Producción**: PostgreSQL real vía `DATABASE_URL`.
- **Desarrollo local**: PGlite (file-backed en `local-data/`). No requiere instalar PostgreSQL.
- **Preview navegador**: PGlite WASM (IndexedDB-backed). Cero servidor.

Todos los entornos usan los mismos esquemas `pgTable` de Drizzle ORM. Un solo repositorio de queries compartido en `packages/db/src/repository.ts`.

Se usa GitHub Pages con `rossjrw/pr-preview-action` para publicar previews automáticos por PR.

## Consecuencias

### Positivas
* **Un solo esquema**: Se eliminan `auth-sqlite.ts` y `resources-sqlite.ts` (~250 líneas de código duplicado).
* **Un solo repositorio de queries**: Las funciones de acceso a datos se reutilizan entre API, CLI y preview.
* **Onboarding simplificado**: `make up` arranca todo sin PostgreSQL externo.
* **Preview fiel**: El preview usa exactamente el mismo motor SQL que producción.
* **Coste cero**: GitHub Pages es gratuito para repositorios públicos.

### Negativas / Riesgos
* **Bundle size**: PGlite WASM añade ~3-4MB al preview (aceptable para un entorno de revisión).
* **PGlite no es producción**: El preview no valida rendimiento, concurrencia ni configuración de red. Siguen siendo necesarios tests E2E y staging real.
* **Dependencia de PGlite**: Proyecto relativamente nuevo. Drizzle ORM lo soporta oficialmente desde 0.44.

## Notas de Implementación

* **ApiClient**: Interfaz `ApiClient` con dos implementaciones: `HttpApiClient` (servidor) y `PreviewApiClient` (PGlite en navegador).
* **Base path**: Astro config usa `PREVIEW_BASE` para subpath de GitHub Pages (`/procomeka/pr-preview/pr-{N}/`).
* **Auth en preview**: Usuarios demo con selector de rol. Sin Better Auth.
* **Seed data**: JSON estático en `apps/frontend/public/preview/seed.json`.
* **GitHub Actions**: `.github/workflows/preview.yml` con `rossjrw/pr-preview-action`.
* **Makefile**: `make up-static` para probar el preview localmente.
