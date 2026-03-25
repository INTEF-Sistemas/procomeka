# Tablero de Estado Global (Agents Memory)

**⚠️ IMPORTANTE PARA TODOS LOS AGENTES:**
Debéis leer este archivo antes de comenzar cualquier tarea para entender el contexto global y el progreso del proyecto. Al finalizar una tarea, debéis actualizar vuestro progreso aquí.

## Fase Actual: Fase 1 — MVP de catálogo

- **Épica activa:** Transversal de plataforma base completada; siguiente foco recomendado: modelo de metadatos mínimo + recursos persistidos
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
