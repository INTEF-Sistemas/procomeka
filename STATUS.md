# Tablero de Estado Global (Agents Memory)

**⚠️ IMPORTANTE PARA TODOS LOS AGENTES:**
Debéis leer este archivo antes de comenzar cualquier tarea para entender el contexto global y el progreso del proyecto. Al finalizar una tarea, debéis actualizar vuestro progreso aquí.

## Fase Actual: Fase 1 — MVP de catálogo

- **Épica activa:** Catálogo MVP operativo en desarrollo; flujo editorial completado; siguiente foco recomendado: búsqueda avanzada/facetas + colecciones reales
- **Agente en turno:** @.agents/skills/documentacion-y-roadmap/SKILL.md

## ADRs Bloqueantes (Prioridad Alta)

Antes de escribir código de negocio, se deben resolver las siguientes decisiones arquitectónicas:

- [x] **ADR-0003**: Framework HTTP para API (`docs/negocio/decisiones/0003-framework-http-api.md`)
- [x] **ADR-0004**: Framework Frontend (`docs/negocio/decisiones/0004-framework-frontend.md`)
- [x] **ADR-0005**: Base de datos principal (`docs/negocio/decisiones/0005-base-de-datos-principal.md`)
- [x] **ADR-0006**: ORM y capa de acceso a datos (`docs/negocio/decisiones/0006-orm-y-capa-acceso-datos.md`)
- [x] **ADR-0007**: Autenticación y gestión de sesiones (`docs/negocio/decisiones/0007-autenticacion-y-sesiones.md`)
- [x] **ADR-0008**: Modelo de autorización (`docs/negocio/decisiones/0008-modelo-de-autorizacion.md`)
- [ ] **ADR pendiente**: Motor de búsqueda para catálogo y relevancia (todavía no documentada)

## Registro de Tareas Recientes

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| - | `Director de Producto` | Definición de visión y mapa de capacidades | Completado |
| - | `Project Manager` | Revisión de estructura y setup de entorno de agentes | Completado |

## Reglas de Actualización de este Tablero

1. Nunca borrar historial antiguo, solo añadir nuevas filas al registro.
2. Actualizar siempre la "Fase Actual" y el "Agente en turno" al traspasar responsabilidad.
3. Marcar las ADRs como `[x]` cuando sean aceptadas e incluir el enlace al archivo markdown.

| 2026-03-25 | `evaluacion-tecnologica + direccion-de-plataforma + backend-api-servicios` | ADR-0005 de base de datos principal completada: PostgreSQL (principal) + SQLite (preview PR) en `docs/negocio/decisiones/0005-base-de-datos-principal.md` | Completado |

## Actualización de ADRs Bloqueantes (2026-03-25)

- [x] **ADR-0005**: Base de datos principal (resuelta en `docs/negocio/decisiones/0005-base-de-datos-principal.md`)
- [ ] **Nota**: el tablero histórico listaba numeración distinta para "base de datos" y "motor de búsqueda"; se mantiene el historial y se alinea numeración a la solicitud vigente del usuario.
## Actualización 2026-03-25 (Evaluación tecnológica frontend)

- Se completa la decisión de framework frontend en `docs/negocio/decisiones/0004-framework-frontend.md`.
- Resultado: Astro aceptado como framework frontend base (Fase 0), con enfoque de islas y guardrails de mantenibilidad/lock-in.
- Traspaso sugerido: `@.agents/skills/documentacion-y-roadmap/SKILL.md` para alinear numeración y estado de ADRs bloqueantes en este tablero.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-25 | `@.agents/skills/evaluacion-tecnologica` + `@.agents/skills/direccion-de-plataforma` | ADR-0004 Framework Frontend creada y aceptada | Completado |

## Actualización 2026-03-25 (Evaluación Tecnológica)

- **Agente en turno:** `@.agents/skills/evaluacion-tecnologica/SKILL.md`
- **Acción realizada:** Se completa propuesta ADR de framework HTTP para API backend en `docs/negocio/decisiones/0003-framework-http-api.md`.
- **Estado del entregable:** Propuesto (pendiente de aceptación por usuario/PM).
- **Riesgos abiertos:**
  - Validar benchmark en caso real de dominio antes de congelar plantilla de servicio.
  - Confirmar si el tablero global renumera ADRs bloqueantes (el encargo actual usa ADR-0003 para HTTP).
- **Traspaso de turno sugerido:** `@.agents/skills/direccion-de-plataforma/SKILL.md` para aceptación/rechazo de ADR y orden de implementación.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-25 | `@.agents/skills/evaluacion-tecnologica/SKILL.md` | ADR-0003 framework HTTP API (`docs/negocio/decisiones/0003-framework-http-api.md`) | Propuesto |

## Actualización 2026-03-25 (Alineación documental de estado)

- **Resumen ejecutivo:**
  - El repositorio ya no está en fase de inicialización.
  - Están presentes y aceptadas las ADR-0001 a ADR-0008.
  - La base técnica existe en código: `apps/api`, `apps/frontend`, `apps/cli` y `packages/db`.
  - La autenticación y autorización tienen implementación inicial con tests unitarios pasando.
  - El núcleo funcional del catálogo sigue pendiente: metadatos mínimos, persistencia real de recursos, búsqueda y flujo editorial.
- **Validación actual:**
  - `bun test` en raíz no está verde todavía.
  - Resultado observado el 2026-03-25: tests unitarios de API/auth/RBAC pasan, pero la ejecución global falla al intentar cargar `e2e/example.spec.ts` desde Bun en vez de Playwright.
- **Bloqueos reales actuales:**
  - Ya no bloquean ADRs de framework HTTP, frontend ni base de datos.
  - El bloqueo práctico es de implementación funcional y de disciplina de testing.
- **Traspaso sugerido:**
  - `@.agents/skills/metadatos-y-curacion/SKILL.md` para cerrar modelo mínimo de metadatos.
  - `@.agents/skills/backend-api-servicios/SKILL.md` para reemplazar placeholders por persistencia real.
  - `@.agents/skills/qa-validacion/SKILL.md` para dejar separación limpia entre unit/e2e.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-25 | `@.agents/skills/documentacion-y-roadmap/SKILL.md` | Roadmap y tablero global alineados con el estado real de código, ADRs y validación | Completado |

## Actualización 2026-03-25 (Coordinación PM + Documentación: alineación y preparación de Épica 001)

- **Fase actual corregida:** Fase 1 — MVP de catálogo (sin cambio de fase, se confirma estado real).
- **Épica activa corregida:** `epic-001-mvp-recursos-metadatos-minimos` (nueva épica creada en `docs/epics/`).
- **Agente en turno corregido:** `@.agents/skills/project-manager/SKILL.md` + `@.agents/skills/documentacion-y-roadmap/SKILL.md`.
- **ADRs resueltas confirmadas:** ADR-0001 a ADR-0008 aceptadas; pendiente ADR de motor de búsqueda/relevancia para fases posteriores.

### Desajustes detectados y alineación
1. El estado documental indicaba avance técnico correcto, pero no existía aún una primera épica real estructurada en `docs/epics/`.
2. `bun test` incluía accidentalmente `e2e/example.spec.ts` (Playwright), rompiendo la validación unitaria en raíz.
3. El roadmap ya reflejaba prioridades correctas, pero faltaba trazabilidad operativa de tareas ejecutables para la primera épica.

### Acciones realizadas
- Se crea la Épica 001 con artefactos mínimos: `requirements.md`, `design.md`, `tasks.md`, `validation.md`.
- Se corrige separación unit/e2e en testing:
  - test E2E renombrado a `e2e/example.e2e.ts`.
  - `playwright.config.ts` añadido para `testMatch: **/*.e2e.ts`.
  - scripts de test en raíz acotados a `tests/` para evitar ejecución accidental de E2E en `bun test`.
  - test automatizado agregado para verificar esta separación.

### Riesgos abiertos
- Persisten dependencias de negocio sin validar end-to-end (CRUD real aún no implementado en rutas placeholder).
- ADR de motor de búsqueda y ADR de perfil mínimo de metadatos siguen pendientes de formalización.
- Se necesita ampliar cobertura con tests de servicios de recursos y persistencia real.

### Traspaso recomendado
- Siguiente agente: `@.agents/skills/metadatos-y-curacion/SKILL.md` para cerrar perfil mínimo de metadatos + ADR.
- Después: `@.agents/skills/backend-api-servicios/SKILL.md` y `@.agents/skills/data-db-architect/SKILL.md` para CRUD real y migraciones.
- QA de cierre de tramo: `@.agents/skills/qa-validacion/SKILL.md`.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-25 | `@.agents/skills/project-manager` + `@.agents/skills/documentacion-y-roadmap` | Creación de Épica 001, alineación de trazabilidad y corrección de separación `bun test` vs Playwright E2E | Completado |

## Actualización 2026-03-26 (QA/Tooling: endurecimiento de `make test`)

- **Agente en turno:** `@.agents/skills/qa-validacion/SKILL.md`
- **Acción realizada:** Se endurece la orquestación de pruebas para que `make test` ejecute solo la suite estándar reproducible, sin globs frágiles ni `|| true`.
- **Cambios aplicados:**
  - `Makefile` alineado con `package.json`: `test` pasa a ejecutar suite estándar + coverage; `test-all` agrega E2E.
  - Nuevo descubrimiento explícito de suites unitarias e integración mediante `scripts/run-bun-suite.ts`.
  - Preflight de Playwright añadido con `scripts/check-e2e-env.ts` para fallos de entorno más claros.
  - Tests automatizados añadidos para validar descubrimiento de suites y mensajes de preflight E2E.
- **Riesgos abiertos:**
  - No hay tests de integración reales todavía; el target los informa como omitidos en lugar de fingir ejecución.
  - Los targets E2E siguen requiriendo un entorno con permisos de navegador.
- **Traspaso recomendado:** `@.agents/skills/backend-api-servicios/SKILL.md` o `@.agents/skills/qa-validacion/SKILL.md` para introducir la primera suite de integración real cuando exista persistencia/servicios que lo justifiquen.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-26 | `@.agents/skills/qa-validacion` | Endurecimiento de `Makefile` y scripts de test; `make test` separado de E2E y validado con tests automatizados | Completado |

## Actualización 2026-03-26 (Auth/config: URL pública canónica en local)

- **Agente en turno:** `@.agents/skills/qa-validacion/SKILL.md` + `@.agents/skills/documentacion-y-roadmap/SKILL.md`
- **Acción realizada:** Se alinea la configuración de Better Auth con la URL pública real de desarrollo local.
- **Cambios aplicados:**
  - El fallback de `BETTER_AUTH_URL` pasa a usar `http://localhost:4321` como URL pública canónica en local.
  - Se añaden helpers testeables en `apps/api/src/auth/config.ts` para fijar semántica de `FRONTEND_URL` y `BETTER_AUTH_URL`.
  - Se añade test automatizado para evitar regresiones en defaults de auth.
  - Se actualizan `.env.example` y `README.md` para explicar que Astro expone la app en `4321` y proxya `/api` al backend `3000`.
- **Riesgos abiertos:**
  - Conviene validar manualmente el inicio de flujo OIDC con proveedor demo tras cambios en `BETTER_AUTH_URL`.
  - La documentación global de roadmap sigue parcialmente desalineada respecto al estado real de varias épicas.
- **Traspaso recomendado:** `@.agents/skills/documentacion-y-roadmap/SKILL.md` para seguir corrigiendo desalineaciones de estado y roadmap tras consolidar validación funcional.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-26 | `@.agents/skills/qa-validacion` + `@.agents/skills/documentacion-y-roadmap` | Alineación de `BETTER_AUTH_URL` con la URL pública local (`4321`) y documentación asociada | Completado |

## Actualización 2026-03-26 (Frontend: historial navegable en paginación)

- **Agente en turno:** `@.agents/skills/frontend-ux-accesibilidad/SKILL.md`
- **Acción realizada:** Se corrige la escritura de historial en listado para que la paginación cree entradas navegables de Back/Forward.
- **Cambios aplicados:**
  - Se introduce helper de historial/URL para listados (`buildListingUrl`, `writeListingStateToHistory`).
  - La búsqueda sigue usando `replaceState` para evitar ruido por tecleo.
  - Los botones de paginación (`Anterior`/`Siguiente`) pasan a usar `pushState`.
  - Se añaden tests unitarios del helper de historial.
- **Validación:** `bun test` en verde tras añadir suite nueva.
- **Traspaso recomendado:** `@.agents/skills/qa-validacion/SKILL.md` para ampliar cobertura con pruebas de integración UI (popstate + paginación + scroll).

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-26 | `@.agents/skills/frontend-ux-accesibilidad` | Paginación del listado usa `pushState` y mantiene `replaceState` para búsqueda; helper y tests unitarios añadidos | Completado |

## Actualización 2026-03-26 (Catálogo público: filtros básicos y alineación documental)

- **Agente en turno:** `@.agents/skills/frontend-ux-accesibilidad/SKILL.md` + `@.agents/skills/documentacion-y-roadmap/SKILL.md`
- **Acción realizada:** Se completa el siguiente tramo del catálogo público con filtros básicos por tipo, idioma y licencia, y se alinea la documentación de estado con la implementación real.
- **Cambios aplicados:**
  - Búsqueda pública ampliada con filtros por `resourceType`, `language` y `license`.
  - Estado del listado sincronizado en URL junto con búsqueda y paginación.
  - API pública y repositorio compartido alineados con el nuevo contrato de filtros.
  - Roadmap actualizado para reflejar que el catálogo público ya dispone de listado, ficha, paginación y filtros básicos.
  - Trazabilidad de Épica 001 ampliada para reflejar cierre documental y el estado real del MVP base.
- **Validación:**
  - `make test`
  - `bun run lint`
- **Riesgos abiertos:**
  - Colecciones públicas siguen en placeholder.
  - Flujo editorial de recursos sigue sin materializarse como experiencia completa de producto.
  - La búsqueda sigue siendo básica: sin facetas contadas, sin nivel/materia y sin ranking avanzado.
- **Traspaso recomendado:** `@.agents/skills/frontend-ux-accesibilidad/SKILL.md` + `@.agents/skills/backend-api-servicios/SKILL.md` para el siguiente tramo de flujo editorial o profundización de búsqueda.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-26 | `@.agents/skills/frontend-ux-accesibilidad` + `@.agents/skills/documentacion-y-roadmap` | Filtros básicos del catálogo público (tipo, idioma, licencia) y alineación de roadmap/estado con la implementación actual | Completado |

## Actualización 2026-03-27 (Hotfix: seed de recursos en dashboard)

- **Agente en turno:** `@.agents/skills/frontend-ux-accesibilidad/SKILL.md` + `@.agents/skills/backend-api-servicios/SKILL.md`
- **Acción realizada:** Se corrige el error del botón "Generar recursos aleatorios" que devolvía "Solo disponible en modo desarrollo" aun ejecutando la app en desarrollo.
- **Cambios aplicados:**
  - Se añade helper de entorno en API para resolver `NODE_ENV` desde `process.env` y `Bun.env`.
  - La ruta `POST /api/dev/seed-resources` pasa a usar esa utilidad en lugar de depender solo de `process.env.NODE_ENV`.
  - El script `apps/api` `dev` fija `NODE_ENV=development` al arrancar con Bun hot reload.
  - Se añaden tests unitarios del helper y cobertura del fallback `Bun.env.NODE_ENV`.
- **Validación:**
  - `bun test src/env.unit.test.ts src/routes/dev.unit.test.ts` en `apps/api`: verde.
- **Riesgos abiertos:**
  - `bun test` completo de `apps/api` sigue fallando por una incidencia previa ajena en `src/index.unit.test.ts` relacionada con una foreign key (`resources.assigned_curator_id -> user.id`) durante publicación de recursos.
- **Traspaso recomendado:** `@.agents/skills/backend-api-servicios/SKILL.md` o `@.agents/skills/qa-validacion/SKILL.md` para sanear la suite completa del API y cerrar el fallo previo de integridad de datos.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-27 | `@.agents/skills/frontend-ux-accesibilidad` + `@.agents/skills/backend-api-servicios` | Hotfix del endpoint dev de seed: detección robusta de entorno con Bun + tests unitarios específicos | Completado |

## Actualización 2026-03-27 (Backoffice: navegación y CRUD mínimos)

- **Agente en turno:** `@.agents/skills/frontend-ux-accesibilidad/SKILL.md` + `@.agents/skills/backend-api-servicios/SKILL.md` + `@.agents/skills/qa-validacion/SKILL.md`
- **Acción realizada:** Se implementa un backoffice navegable con sidebar persistente y CRUD mínimos para recursos, usuarios, categorías/taxonomías y colecciones, con visibilidad por rol y contratos reales de API/preview.
- **Cambios aplicados:**
  - Nuevo `AdminLayout` con navegación responsive y accesible por rol.
  - Nuevas vistas de backoffice: panel, listado de recursos, usuarios, categorías y colecciones.
  - Recursos mantienen alta/edición y añaden listado paginado y filtrado.
  - API admin ampliada con endpoints reales para usuarios, colecciones y taxonomías, más RBAC por rol y filtros de visibilidad para recursos.
  - `ApiClient`, `HttpApiClient` y `PreviewApiClient` ampliados para soportar el nuevo backoffice.
  - `packages/db` ampliado con esquema de taxonomías y repositorios para usuarios, colecciones y taxonomías.
  - Tests añadidos/actualizados para navegación del backoffice y rutas admin.
- **Validación:**
  - `cd apps/api && bun test src/routes/admin.unit.test.ts`
  - `cd apps/frontend && bun test src/lib/backoffice-nav.unit.test.ts`
  - `cd apps/frontend && bun run build`
- **Riesgos abiertos:**
  - Las vistas de usuarios, categorías y colecciones usan edición inline mínima; no existe aún un formulario dedicado por ruta para todas las entidades.
  - La búsqueda de recursos combina filtrado servidor para `q/status` con una UI todavía básica; faltan ordenación avanzada y filtros más ricos.
  - No se han añadido tests E2E del sidebar y de los flujos CRUD en navegador; la cobertura actual valida contratos y visibilidad base, no el recorrido visual completo.
- **Traspaso recomendado:** `@.agents/skills/qa-validacion/SKILL.md` para ampliar cobertura E2E y `@.agents/skills/documentacion-y-roadmap/SKILL.md` para reflejar el estado del backoffice en épicas/roadmap.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-27 | `@.agents/skills/frontend-ux-accesibilidad` + `@.agents/skills/backend-api-servicios` + `@.agents/skills/qa-validacion` | Backoffice con sidebar responsive y CRUD mínimos para recursos, usuarios, categorías y colecciones; API y clientes alineados | Completado |

## Actualización 2026-03-26 (Flujo editorial de recursos)

- **Agente en turno:** `@.agents/skills/backend-api-servicios/SKILL.md` + `@.agents/skills/frontend-ux-accesibilidad/SKILL.md`
- **Acción realizada:** Se implementa el flujo editorial completo de recursos como experiencia end-to-end.
- **Cambios aplicados:**
  - Reglas de transición editorial con validación por rol en `packages/db/src/validation.ts` (`TRANSITION_RULES`, `validateTransition`).
  - Endpoint `PATCH /api/admin/resources/:id/status` abierto a `author` con validación de transiciones (antes solo `curator`).
  - Campo `createdBy` en schema de recursos con resolución de nombre vía LEFT JOIN.
  - Stepper visual en `editar.astro` con 3 pasos (Borrador/En revisión/Aprobado) y colores semafóricos (rojo/naranja/verde).
  - Botones de acción dinámicos según estado y rol del usuario.
  - Nombre del creador visible en listado público, dashboard, ficha y vista de edición.
  - Botón "Editar" en ficha pública para usuarios autenticados (author+).
  - Badges de estado con colores semafóricos en todas las vistas.
  - Método `updateResourceStatus` añadido a `ApiClient`, `HttpApiClient` y `PreviewApiClient`.
- **Validación:**
  - `make test`: 132 tests, 94.57% cobertura.
  - `bun run lint`: limpio.
- **Riesgos abiertos:**
  - Colecciones públicas siguen en placeholder.
  - La búsqueda sigue siendo básica: sin facetas contadas, sin nivel/materia y sin ranking avanzado.
- **Traspaso recomendado:** `@.agents/skills/busqueda-y-descubrimiento/SKILL.md` para profundización de búsqueda o `@.agents/skills/backend-api-servicios/SKILL.md` para colecciones reales.

| Fecha | Agente | Acción / Entregable | Estado |
|-------|--------|---------------------|--------|
| 2026-03-26 | `@.agents/skills/backend-api-servicios` + `@.agents/skills/frontend-ux-accesibilidad` | Flujo editorial completo: transiciones por rol, stepper visual, campo createdBy, botón editar en ficha pública | Completado |
