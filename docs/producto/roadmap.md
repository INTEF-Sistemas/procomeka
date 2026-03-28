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
| Modelo de metadatos mínimo | Completado — ADR-0009 aceptada, validación mínima y CRUD real de recursos entregados |
| Arquitectura base del sistema | Completado — monorepo, Hono, Astro, Drizzle, PGlite dev |
| Autenticación y autorización | Completado — Better Auth (password + OIDC), RBAC, CLI usuarios, login/dashboard |
| Flujo editorial de recursos | Completado — stepper visual, transiciones por rol (author→review, curator→publish), campo createdBy, colores semafóricos |
| Búsqueda y facetas iniciales | En desarrollo — búsqueda por texto, paginación e interfaz de filtros básicos por tipo, idioma y licencia |
| API REST pública v1 | En desarrollo — listado y detalle de recursos publicados, paginación y filtros básicos; colecciones siguen en placeholder |
| Importación piloto desde CSV | No iniciada |
| Frontend público mínimo | En desarrollo — catálogo público, ficha de recurso, paginación y filtros básicos; faltan colecciones y refinamientos de descubrimiento |

---

## Fase 2 — Migración y calidad

**Objetivo**: migrar contenidos de Procomún legacy y mejorar la calidad del catálogo.

| Épica | Estado |
|-------|--------|
| Migración desde Procomún (análisis) | En progreso — contexto legacy documentado en `docs/casos/contexto-procomun-legacy/` (estado del arte, requisitos funcionales, info contractual); pendiente obtener PPT y diseñar ETL |
| Pipeline de ingestión OAI-PMH | No iniciada |
| Flujo de curación y moderación | No iniciada |
| Mejora de relevancia en búsqueda | No iniciada |
| Panel editorial interno | En desarrollo — backoffice con sidebar, CRUD mínimos y uploader resumable multiarchivo para adjuntos de recursos |

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

## Actualización de trazabilidad — 2026-03-25 (Épica 001 preparada)

- Se formaliza la primera épica real del MVP en `docs/epics/epic-001-mvp-recursos-metadatos-minimos/`.
- Alcance inicial: metadatos mínimos + CRUD real de recursos + validación mínima + base para búsqueda posterior.
- Estado de la épica: **En planificación activa**, con tareas ejecutables por dominios (documentación, backend, BD, frontend, testing).
- Dependencia explícita para próxima iteración: ADR de perfil mínimo de metadatos y ejecución del CRUD persistente.

## Actualización de estado — 2026-03-26

### Confirmado en repositorio

- El catálogo público ya ofrece listado de recursos publicados, ficha de detalle y búsqueda por texto libre.
- La búsqueda pública ya soporta paginación navegable con historial del navegador.
- La búsqueda pública ya soporta filtros básicos por `resourceType`, `language` y `license`.
- El contrato público `/api/v1/resources` acepta `q`, `limit`, `offset`, `resourceType`, `language` y `license`.
- La suite estándar permanece en verde con cobertura por encima del umbral.

### Lectura ejecutiva

El MVP base de catálogo ya no está en fase de mera preparación. La plataforma dispone de CRUD real de recursos, lectura pública de recursos publicados y una primera experiencia de descubrimiento usable para el catálogo. El principal hueco funcional pasa a ser el flujo editorial de recursos y la evolución de búsqueda hacia facetas más ricas.

### Siguiente tramo recomendado

1. Profundizar búsqueda pública con filtros de nivel/materia o facetas contadas.
2. Sustituir placeholders de colecciones públicas por persistencia real.
3. Importación piloto desde CSV.

## Actualización de estado — 2026-03-26 (Flujo editorial)

### Confirmado en repositorio

- Flujo editorial implementado end-to-end: draft → review → published → archived.
- Reglas de transición por rol: author puede enviar a revisión, curator puede aprobar/rechazar/archivar.
- Stepper visual en la página de edición con colores semafóricos (rojo/naranja/verde).
- Campo `createdBy` en recursos, con resolución del nombre del creador vía LEFT JOIN.
- Nombre del creador visible en listado público, dashboard, ficha de recurso y vista de edición.
- Botón "Editar" visible en ficha pública para usuarios autenticados con rol author+.
- Backoffice con sidebar responsive, navegación por rol y CRUD mínimos para recursos, usuarios, categorías y colecciones.
- 159 tests pasando, 91.13% cobertura de líneas.

### Lectura ejecutiva

El flujo editorial de recursos queda completo como experiencia de producto y ya existe una primera base de backoffice para la gestión interna. Los autores pueden crear recursos y enviarlos a revisión; los curadores pueden aprobar, rechazar o archivar. El siguiente foco de Fase 1 es profundizar búsqueda pública y elevar el backoffice desde CRUD mínimo a experiencia editorial más completa.
