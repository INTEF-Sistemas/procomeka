# ADR-0013 Framework UI para islands interactivas en Astro

* Estado: Aceptado
* Fecha: 2026-03-28
* Agentes Implicados: [@.agents/skills/evaluacion-tecnologica/SKILL.md, @.agents/skills/frontend-ux-accesibilidad/SKILL.md, @.agents/skills/direccion-de-plataforma/SKILL.md]
* Issue: #50

## Contexto y Problema

ADR-0004 adoptó Astro como framework frontend base con estrategia de "islas" interactivas, mencionando la "posibilidad de usar React solo donde aporte valor claro". Sin embargo, no se evaluó formalmente qué framework UI usar para dichas islas.

El frontend actual (~3.200 LOC) implementa toda la interactividad con **vanilla JS imperativo** dentro de `<script>` en archivos `.astro`. Tras completar Epic-001 (MVP de recursos), los problemas de este enfoque son evidentes:

1. **Manipulación DOM imperativa**: `innerHTML`, `classList.toggle`, `querySelector` por todas partes — difícil de mantener y superficie de XSS si falla el escaping.
2. **Sin reactividad**: Cada cambio de estado requiere actualizar el DOM manualmente (ej. `catalog-controller.ts` con 227 líneas para coordinar filtros, paginación y renderizado).
3. **Sin componentización**: Patrones como paginación, filtros, tablas CRUD y modales se copian entre páginas (`categorias/index.astro` y `colecciones/index.astro` duplican el patrón de dialog CRUD).
4. **Estado disperso**: Variables locales en scripts, URL params, localStorage — sin modelo de estado coherente.
5. **Testing de UI limitado**: Los componentes no son testables unitariamente al ser HTML+script embebido.

### Patrones interactivos que debe resolver el framework elegido

| Patrón | Páginas afectadas | Complejidad |
|--------|-------------------|-------------|
| Formularios complejos (validación, campos condicionales, múltiples secciones) | `recursos/editar.astro` (670 LOC), `recursos/nuevo.astro` | Alta |
| Tablas CRUD (filtros, paginación, edición inline, modales) | `categorias/`, `colecciones/`, `usuarios/`, `recursos/` | Media-alta |
| Modales/Diálogos (`<dialog>` con formularios) | Todas las páginas admin | Media |
| Catálogo público (búsqueda debounce, filtros colapsables, grid/list, paginación) | `pages/index.astro` | Media-alta |
| Workflow editorial (stepper visual con transiciones por rol) | `recursos/editar.astro` | Media |
| Uploads resumibles (Uppy/TUS, progreso, cola) | `recursos/editar.astro` | Media |
| Feedback accesible (`aria-live`, `role="status"`, `role="alert"`) | Todas | Media |

### Requisitos obligatorios (de ADRs y épicas existentes)

- **WCAG AA**: Formularios, mensajes de error, navegación y feedback (ADR-0004, Epic-001).
- **Astro islands**: Hidratación parcial (`client:load`, `client:visible`, etc.).
- **TypeScript strict**: Todo el código del proyecto.
- **Rendimiento**: Output SSG, mínimo JS en cliente. Core Web Vitals prioritarios.
- **Sin lock-in**: Arquitectura reversible.
- **Monorepo Bun**: Debe funcionar con Bun como runtime y bundler.
- **Coexistencia con Uppy**: El framework debe coexistir con librerías externas de uploads.
- **Compatible con PGlite preview**: Modo preview in-browser (ADR-0010, ADR-0012).

## Opciones Consideradas

* AlpineJS
* React
* SolidJS
* Svelte 5
* Vue 3

### Matriz comparativa

Escala: 1 (peor) a 5 (mejor). En "Lock-in" y "Coste de integración", 5 = menor coste/riesgo.

#### Criterios del skill de evaluación tecnológica

| Criterio | Alpine | React | Solid | Svelte 5 | Vue 3 |
|----------|-------:|------:|------:|---------:|------:|
| Ajuste funcional | 2 | 5 | 4 | 4 | 5 |
| Compatibilidad Bun | 5 | 4 | 4 | 4 | 4 |
| Madurez | 4 | 5 | 3 | 4 | 5 |
| Rendimiento (islands) | 4 | 3 | 5 | 5 | 3 |
| Coste de integración | 5 | 3 | 3 | 4 | 4 |
| Lock-in | 5 | 2 | 4 | 3 | 3 |
| Licencia | 5 | 5 | 5 | 5 | 5 |
| Operación | 5 | 4 | 4 | 4 | 4 |
| **Subtotal base** | **35** | **31** | **32** | **33** | **33** |

#### Criterios específicos del proyecto (peso alto según issue #50)

| Criterio | Alpine | React | Solid | Svelte 5 | Vue 3 |
|----------|-------:|------:|------:|---------:|------:|
| Ecosistema WCAG AA | 1 | 5 | 3 | 3 | 4 |
| Bundle size (island) | 5 | 2 | 5 | 5 | 3 |
| TypeScript (calidad tipado) | 2 | 5 | 4 | 4 | 4 |
| Componentización | 1 | 5 | 4 | 5 | 5 |
| Formularios complejos | 2 | 5 | 3 | 4 | 4 |
| Tablas CRUD | 1 | 5 | 4 | 3 | 4 |
| Testing unitario UI | 1 | 5 | 3 | 4 | 4 |
| **Subtotal específico** | **13** | **32** | **26** | **28** | **28** |

#### Totales ponderados

| Framework | Base (×1) | Específico (×1.5) | **Total ponderado** |
|-----------|----------:|-------------------:|--------------------:|
| Alpine | 35 | 19.5 | **54.5** |
| React | 31 | 48.0 | **79.0** |
| Solid | 32 | 39.0 | **71.0** |
| Svelte 5 | 33 | 42.0 | **75.0** |
| Vue 3 | 33 | 42.0 | **75.0** |

### Evaluación cualitativa por opción

#### AlpineJS

**Pros**
- Mínimo overhead (~15 KB), se aplica sobre HTML existente.
- Migración incremental trivial desde vanilla JS.
- Sin build step adicional.

**Contras**
- No tiene sistema de componentes — solo directivas declarativas.
- Para las necesidades de Procomeka (formularios complejos, tablas CRUD, componentización) se seguiría con los mismos problemas fundamentales de vanilla JS pero con sintaxis más limpia.
- Sin ecosistema de componentes accesibles.
- Testing unitario prácticamente inviable.
- **Descartado**: no resuelve los problemas de fondo (componentización, testing, estado).

#### React

**Pros**
- **Mejor ecosistema de componentes accesibles**: React Aria (Adobe), Radix UI, Headless UI, Ark UI — las opciones más maduras y completas del mercado para WCAG AA.
- Formularios: React Hook Form, Tanstack Form — soluciones maduras y bien tipadas.
- Tablas: Tanstack Table — la referencia del mercado, soporte nativo React.
- Testing: React Testing Library + Vitest — el flujo más maduro y documentado.
- TypeScript: tipado completo de props, hooks, contexto.
- Mayor pool de documentación, tutoriales y recursos.

**Contras**
- Bundle más pesado (~40-45 KB min para react + react-dom) — el mayor de los candidatos.
- Riesgo de "SPA creep" que ADR-0004 advierte explícitamente.
- Modelo de re-renders puede llevar a optimizaciones prematuras (memo, useMemo, useCallback).
- Mayor lock-in al ecosistema React (hooks, contexto, estado).

#### SolidJS

**Pros**
- Rendimiento excepcional: reactividad de grano fino sin virtual DOM.
- Bundle mínimo (~7 KB) — ideal para islands.
- API similar a React (JSX) — curva familiar.
- Kobalte como primitivas accesibles (inspirado en Radix).

**Contras**
- Ecosistema pequeño: Kobalte tiene ~1.700 stars, última release 0.13.x (aún pre-1.0 a marzo 2026).
- Menos opciones maduras para formularios y tablas.
- Comunidad más reducida — menos recursos y soporte.
- Trampas de reactividad para desarrolladores nuevos (destructuring rompe reactividad).

#### Svelte 5

**Pros**
- Output compilado mínimo (~2-5 KB por componente) — el más eficiente por island.
- Svelte 5 con runes ($state, $derived) es moderno y potente.
- Sintaxis intuitiva y cercana a HTML — transición natural desde Astro `.astro`.
- Advertencias de accesibilidad integradas en compilador (a11y warnings).
- Bits UI + Melt UI: primitivas accesibles con soporte Svelte 5.

**Contras**
- Sintaxis propia (`.svelte`) — no es JSX/TSX estándar.
- Ecosistema medio: Bits UI es buena pero no al nivel de React Aria/Radix.
- Svelte 5 (runes) es relativamente reciente; algunas libs comunitarias aún migran.
- Tanstack Table para Svelte está en beta.

#### Vue 3

**Pros**
- Buen equilibrio entre ecosistema y rendimiento.
- Reka UI (ex-Radix Vue): ~6.100 stars, 590K+ descargas semanales — primitivas accesibles maduras, base de Nuxt UI.
- FormKit: solución de formularios completa y accesible.
- Tanstack Vue Table: soporte estable.
- Vitest fue creado por el equipo Vue — integración natural.
- Composition API es elegante y bien tipada.

**Contras**
- Bundle medio-pesado (~33 KB min).
- SFC es otra sintaxis propia (`.vue`).
- Puede sentirse over-engineered para islands pequeñas.
- Menor rendimiento como island que Solid/Svelte.

## Decisión

Se **adopta React como framework UI para islands interactivas en Astro**, con las siguientes condiciones:

### Justificación principal

1. **Ecosistema WCAG AA sin rival**: React Aria (Adobe) es la librería de componentes accesibles más completa y madura del mercado. Para un proyecto educativo público donde la accesibilidad es requisito base (ADR-0004, Epic-001), esto es determinante.

2. **Formularios y tablas resueltos**: React Hook Form + Tanstack Table cubren los dos patrones más complejos y repetidos del frontend actual, con TypeScript completo y documentación extensa.

3. **Testing maduro**: React Testing Library + Vitest permite testear unitariamente cada island — resolviendo directamente el problema #5 de vanilla JS.

4. **TypeScript**: El mejor soporte de tipado entre los candidatos — coherente con el requisito de TS strict del proyecto.

5. **ADR-0004 ya lo contemplaba**: La decisión original mencionaba "posibilidad de usar React solo donde aporte valor claro". Esta ADR concreta dónde y cómo.

### Mitigación de riesgos

| Riesgo | Mitigación |
|--------|------------|
| Bundle size (~40-45 KB) | react + react-dom se cargan una sola vez y se comparten entre todas las islands. Astro deduplica automáticamente. El coste marginal por island adicional es mínimo. |
| SPA creep | Solo los patrones interactivos son islands. Layouts, navegación, headers, footers siguen en Astro puro. Presupuesto de JS: máximo 100 KB total hidratado en cualquier página. |
| Lock-in React | Las islands son componentes aislados con props bien definidas. Si se necesita migrar, se reemplazan individualmente sin tocar el shell Astro. |
| Over-engineering | Se usa React Aria como primitivas headless, no un design system completo. Los componentes se construyen ligeros y específicos para Procomeka. |

### Librería de componentes accesibles

**React Aria Components** (Adobe) como base:
- Primitivas headless WCAG AA: Dialog, Form, Table, Select, ComboBox, DatePicker, etc.
- Soporte completo de teclado, lectores de pantalla, gestión de foco.
- Sin estilos — se integra con el CSS existente del proyecto.
- Mantenido activamente por Adobe con releases regulares.

### Librerías complementarias

| Necesidad | Librería | Justificación |
|-----------|----------|---------------|
| Formularios | React Hook Form | Validación declarativa, mínimo re-render, TS nativo |
| Tablas | Tanstack Table | Headless, paginación/filtros/ordenación, TS nativo |
| Uploads | Uppy (existente) | Ya integrado; React wrapper `@uppy/react` disponible |

## Consecuencias

### Positivas

* Resuelve los 5 problemas identificados de vanilla JS: componentización, reactividad, estado, reutilización y testing.
* Las islands React son testables unitariamente con React Testing Library + Vitest.
* React Aria garantiza WCAG AA en todos los componentes interactivos sin implementación manual.
* Ecosistema maduro reduce el riesgo de tener que construir soluciones propias para formularios, tablas y accesibilidad.
* Migración incremental posible: cada página se puede migrar independientemente; vanilla JS y React coexisten en el mismo proyecto Astro.
* La inversión en conocimiento React es transferible y tiene el mayor pool de talento disponible.

### Negativas / Riesgos

* Bundle base de ~40-45 KB (react + react-dom) — mayor que Svelte/Solid, pero aceptable dado que se carga una vez y se comparte.
* Requiere disciplina para evitar deriva hacia SPA: todo componente nuevo debe justificar su hidratación.
* Modelo de re-renders de React puede generar bugs sutiles si no se gestionan bien las dependencias de effects/memos.
* Dependencia del ecosistema React — mitigada por la arquitectura de islands (cada island es reemplazable individualmente).

## Notas de Implementación

### 1. Configuración inicial

```bash
bunx astro add react
```

Esto instala `@astrojs/react`, `react` y `react-dom` y configura `astro.config.ts`.

### 2. Qué es island y qué sigue en Astro puro

| Componente | Tipo | Hidratación |
|------------|------|-------------|
| Layout base (header, footer, sidebar) | Astro puro | Ninguna |
| Navegación admin (sidebar, breadcrumbs) | Astro puro | Ninguna |
| Vista detalle de recurso | Astro puro | Ninguna |
| **Catálogo público** (búsqueda, filtros, grid) | React island | `client:load` |
| **Formulario de recurso** (crear/editar) | React island | `client:load` |
| **Tabla CRUD** (categorías, colecciones, usuarios, recursos) | React island | `client:load` |
| **Stepper editorial** (workflow de estados) | React island | `client:visible` |
| **Uploader** (Uppy integrado) | React island | `client:visible` |
| **Diálogos de confirmación** | React island | `client:load` |

### 3. Plan de migración incremental

Orden recomendado (de menor a mayor complejidad, para validar el enfoque progresivamente):

| Fase | Página | Componentes React | LOC vanilla a reemplazar |
|------|--------|-------------------|--------------------------|
| **1** | `admin/categorias/` | `<CrudTable>`, `<EditDialog>` | ~324 LOC |
| **2** | `admin/colecciones/` | Reutilizar `<CrudTable>`, `<EditDialog>` | ~327 LOC |
| **3** | `admin/usuarios/` | `<UsersTable>` (extensión de CrudTable) | ~214 LOC |
| **4** | `admin/recursos/index` | `<ResourcesTable>` | ~206 LOC |
| **5** | `pages/index` (catálogo) | `<Catalog>`, `<SearchBar>`, `<FilterPanel>`, `<Pagination>` | ~115 LOC + catalog-controller.ts 227 LOC |
| **6** | `admin/recursos/nuevo` | `<ResourceForm>` | ~195 LOC |
| **7** | `admin/recursos/editar` | `<ResourceForm>` + `<WorkflowStepper>` + `<ResourceUploader>` | ~670 LOC |

### 4. Estructura de archivos propuesta

```
apps/frontend/src/
├── components/          # Componentes Astro (existentes)
├── islands/             # Componentes React (nuevos)
│   ├── catalog/
│   │   ├── Catalog.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── Pagination.tsx
│   ├── crud/
│   │   ├── CrudTable.tsx
│   │   ├── EditDialog.tsx
│   │   └── ConfirmDialog.tsx
│   ├── resources/
│   │   ├── ResourceForm.tsx
│   │   ├── WorkflowStepper.tsx
│   │   └── ResourceUploader.tsx
│   └── shared/
│       ├── FormField.tsx
│       └── AccessibleFeedback.tsx
├── lib/                 # Utilidades TypeScript (existentes, reutilizables)
├── layouts/
└── pages/
```

### 5. Impacto en bundle size estimado

| Concepto | Tamaño (gzip) |
|----------|---------------|
| react + react-dom | ~42 KB (una sola vez, compartido) |
| React Aria (componentes usados) | ~15-25 KB |
| React Hook Form | ~9 KB |
| Tanstack Table (core) | ~14 KB |
| **Total base** | **~80-90 KB** |

Comparado con el vanilla JS actual que no tiene framework pero duplica lógica entre páginas, el incremento neto en experiencia de usuario es aceptable dado que:
- Astro envía JS solo en páginas con islands.
- Las páginas puramente informativas (detalle de recurso, landing) siguen siendo 0 KB JS.
- Se elimina ~2.400 LOC de vanilla JS difícil de mantener.

### 6. Criterios de revisión

Reabrir esta decisión si:
- El bundle total hidratado en una página supera 150 KB (gzip).
- React Aria deja de mantenerse activamente.
- Se detecta que más del 50% de las páginas requieren hidratación completa (indica deriva a SPA).
- El rendimiento de Core Web Vitals se degrada respecto a la baseline actual.
