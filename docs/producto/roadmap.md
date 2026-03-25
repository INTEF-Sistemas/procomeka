# Roadmap

## Estado: Fase 1 — MVP de catálogo

Estructura base del monorepo implementada. Primera iteración de código en marcha.

---

## Fase 0 — Fundación del sistema ✅

**Objetivo**: establecer las bases técnicas, documentales y de arquitectura antes de escribir código de negocio.

| Hito | Estado |
|------|--------|
| AGENTS.md y sistema de skills definido | Completado |
| Visión y mapa de capacidades | Completado |
| ADR stack base (TypeScript + Bun) | Completado — ADR-0001 |
| ADR capa API | Completado — ADR-0003 (Hono) |
| ADR capa frontend | Completado — ADR-0004 (Astro) |
| ADR base de datos principal | Completado — ADR-0005 (PostgreSQL) |
| ADR ORM y capa de acceso a datos | Completado — ADR-0006 (Drizzle ORM) |
| Modelo de dominio v0 | Completado — borrador en `docs/producto/modelo-de-dominio.md` |

---

## Fase 1 — MVP de catálogo

**Objetivo**: tener un catálogo funcional con recursos, metadatos básicos, búsqueda y API.

| Épica | Estado |
|-------|--------|
| Modelo de metadatos mínimo | No iniciada |
| Arquitectura base del sistema | Completado — monorepo, Hono, Astro, Drizzle, SQLite dev |
| Autenticación y autorización | Completado — Better Auth (password + OIDC), RBAC, CLI usuarios, login/dashboard |
| Flujo editorial de recursos | No iniciada |
| Búsqueda y facetas iniciales | No iniciada |
| API REST pública v1 | No iniciada |
| Importación piloto desde CSV | No iniciada |
| Frontend público mínimo | No iniciada |

---

## Fase 2 — Migración y calidad

**Objetivo**: migrar contenidos de Procomún legacy y mejorar la calidad del catálogo.

| Épica | Estado |
|-------|--------|
| Migración desde Procomún (análisis) | No iniciada |
| Pipeline de ingestión OAI-PMH | No iniciada |
| Flujo de curación y moderación | No iniciada |
| Mejora de relevancia en búsqueda | No iniciada |
| Panel editorial interno | No iniciada |

---

## Fase 3 — Descubrimiento avanzado y apertura

**Objetivo**: mejorar el descubrimiento y abrir la plataforma a otros sistemas.

| Épica | Estado |
|-------|--------|
| Colecciones e itinerarios | No iniciada |
| Recomendación de recursos | No iniciada |
| OAI-PMH servidor | No iniciada |
| Exportación bulk del catálogo | No iniciada |
| Analítica de uso y calidad | No iniciada |

---

## Fase 4 — Integraciones y sostenibilidad

**Objetivo**: conectar con el ecosistema educativo y asegurar la operación a largo plazo.

| Épica | Estado |
|-------|--------|
| Integración LTI (Moodle) | No iniciada |
| SSO educativo | No iniciada |
| Observabilidad y alertas | No iniciada |
| Documentación para operadores | No iniciada |
