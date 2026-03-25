# Roadmap

## Estado: Fase 1 — MVP de catálogo

Base técnica y documental completada. API, auth y frontend editorial mínimo ya tienen primera implementación; el catálogo funcional todavía no.

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
| API REST pública v1 | En desarrollo — rutas base `/api/v1`, `health`, `config` y placeholders de recursos/colecciones |
| Importación piloto desde CSV | No iniciada |
| Frontend público mínimo | En desarrollo — landing, login y dashboard; catálogo público aún pendiente |

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

---

## Actualización de estado — 2026-03-25

### Confirmado en repositorio

- ADR-0001 a ADR-0008 presentes y aceptadas, incluyendo auth y autorización.
- Monorepo operativo con `apps/api`, `apps/frontend`, `apps/cli` y `packages/db`.
- API Hono con separación de rutas públicas (`/api/v1`) y admin (`/api/admin`).
- Better Auth integrado con login por email/password, soporte OIDC configurable y sesiones por cookie.
- RBAC implementado con roles `reader`, `author`, `curator`, `admin`.
- Frontend Astro con páginas `index`, `login` y `dashboard`.
- CLI para seed y gestión básica de usuarios.
- Cobertura unitaria existente en API/auth/rutas admin.

### Lectura ejecutiva

El proyecto ya superó la fase de mera fundación técnica. La base de plataforma está razonablemente asentada y la primera capacidad transversal relevante completada es autenticación/autorización. Lo que aún no existe es el núcleo del producto: modelo de metadatos mínimo cerrado, recursos persistidos de extremo a extremo, búsqueda/facetas, flujo editorial real e importación.

### Riesgos y ajustes inmediatos

- La regla de validación estricta todavía no se cumple a nivel raíz: `bun test` falla porque Bun intenta ejecutar `e2e/example.spec.ts` como si fuera un test unitario de Playwright.
- La API pública y admin siguen devolviendo respuestas placeholder; hay contratos iniciales pero no lógica de negocio de catálogo.
- `STATUS.md` estaba desalineado respecto al roadmap y a las ADRs; se corrige en paralelo para evitar decisiones sobre un estado obsoleto.

### Siguiente tramo recomendado

1. Cerrar la épica de modelo de metadatos mínimo.
2. Convertir recursos y colecciones de placeholders a persistencia real con Drizzle.
3. Separar correctamente tests unitarios y e2e para dejar `bun test` en verde.
