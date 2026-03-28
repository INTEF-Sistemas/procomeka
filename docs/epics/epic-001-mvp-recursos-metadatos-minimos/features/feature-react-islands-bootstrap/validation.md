# Validation — Feature React Islands Bootstrap

## Fecha
2026-03-28

## Validaciones previstas
- `cd apps/frontend && bun test`
- `bun test`
- `cd apps/frontend && bun run build`
- `cd apps/frontend && PREVIEW_STATIC=true bun run build:preview`

## Criterios de aceptación
- La ruta `admin/categorias` ya no depende de un `<script>` imperativo local.
- La island React cubre listado, filtros, alta, edición y borrado.
- El runner estándar del repositorio (`bun test`) sigue siendo válido.
- La build normal y la build preview continúan generándose.

## Resultado de validación — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅
- `cd apps/frontend && PREVIEW_STATIC=true bun run build:preview` ✅
- `bun run test` ✅

## Observaciones
- `bun test` en la raíz del repositorio sigue intentando descubrir `e2e/example.spec.ts`; la validación estándar del proyecto está encapsulada en `bun run test`, que ha quedado en verde con 204 tests y 91.94% de cobertura.
- El único fallo observado durante la iteración fue ejecutar `build` y `build:preview` en paralelo sobre el mismo `dist/`; ejecutados en secuencia ambos completan correctamente.

## Validación prevista — `admin/colecciones` — 2026-03-28
- `cd apps/frontend && bun test`
- `cd apps/frontend && bun run build`
- `cd apps/frontend && PREVIEW_STATIC=true bun run build:preview`
- `bun run test`

## Resultado de validación — `admin/colecciones` — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅
- `cd apps/frontend && PREVIEW_STATIC=true bun run build:preview` ✅
- `bun run test` ✅

## Observaciones adicionales — `admin/colecciones`
- La island `CollectionsCrudIsland` se genera como chunk dedicado de `7.21 kB` (`2.37 kB gzip`) sobre el runtime compartido de React ya introducido en la iteración anterior.
- Se mantienen los warnings previos de build relacionados con PGlite/browser externals y `eval` en dependencias de preview; no son nuevos de esta migración.

## Validación prevista — `admin/usuarios` — 2026-03-28
- `cd apps/frontend && bun test`
- `cd apps/frontend && bun run build`
- `bun run test`

## Resultado de validación — `admin/usuarios` — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅
- `bun run test` ✅

## Observaciones adicionales — `admin/usuarios`
- La island `UsersCrudIsland` se genera como chunk dedicado de `4.23 kB` (`1.70 kB gzip`) sobre el runtime compartido.
- La validación global del repositorio se mantiene en `204 pass`, `0 fail` y `91.94%` de cobertura de líneas.

## Validación prevista — `admin/recursos/index` — 2026-03-28
- `cd apps/frontend && bun test`
- `cd apps/frontend && bun run build`
- `bun run test`

## Resultado de validación — `admin/recursos/index` — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅
- `bun run test` ✅

## Observaciones adicionales — `admin/recursos/index`
- La island `ResourcesTableIsland` se genera como chunk dedicado de `3.88 kB` (`1.67 kB gzip`) sobre el runtime compartido.
- La validación global del repositorio se mantiene en `204 pass`, `0 fail` y `91.94%` de cobertura de líneas.

## Validación prevista — formularios de recurso — 2026-03-28
- `cd apps/frontend && bun test`
- `cd apps/frontend && bun run build`
- `bun run test`

## Resultado de validación — formularios de recurso — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅
- `bun run test` ✅

## Observaciones adicionales — formularios de recurso
- `ResourceFormIsland` se genera como chunk dedicado de `6.26 kB` (`2.01 kB gzip`) sobre el runtime compartido.
- `ResourceEditorIsland` se genera como chunk dedicado de `124.90 kB` (`37.22 kB gzip`), siendo la pieza más pesada de la fase por el workflow editorial y la integración del uploader.
- La validación global del repositorio se mantiene en `204 pass`, `0 fail` y `91.94%` de cobertura de líneas.

## Validación posterior — ajuste del editor de recurso — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅

## Observaciones adicionales — ajuste del editor de recurso
- `ResourceEditorIsland` reduce su chunk inicial a `11.54 kB` (`3.72 kB gzip`) al diferir la carga de `resource-uploader`.
- El uploader queda separado en un chunk `resource-uploader` de `114.08 kB` (`34.10 kB gzip`).
- Los estilos de `admin/recursos/nuevo` y `admin/recursos/editar` se restauran usando CSS global acotado a `.form-container`.
- En desarrollo siguen siendo posibles errores `504 (Outdated Optimize Dep)` de Vite sobre `@uppy/*` si la caché de `.vite/deps` está obsoleta; eso requiere reiniciar el dev server, no cambios adicionales de aplicación.

## Validación — catálogo público y ficha de recurso — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅

## Observaciones adicionales — catálogo público y ficha de recurso
- `CatalogSearchIsland` se genera como chunk dedicado de `0.88 kB` (`0.49 kB gzip`).
- `CatalogIsland` se genera como chunk dedicado de `8.82 kB` (`3.22 kB gzip`).
- `ResourceDetailIsland` se genera como chunk dedicado de `4.64 kB` (`1.59 kB gzip`).
- El catálogo mantiene la URL como fuente de verdad para `q`, `page`, `resourceType`, `language` y `license`.
- Se mantienen los warnings previos de build relacionados con PGlite/browser externals y `eval` en dependencias de preview; no son nuevos de esta migración.

## Validación — login y dashboard — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅

## Observaciones adicionales — login y dashboard
- `LoginIsland` se genera como chunk dedicado de `2.88 kB` (`1.12 kB gzip`).
- `DashboardIsland` se genera como chunk dedicado de `4.09 kB` (`1.46 kB gzip`).
- La lógica de sesión, login por correo, arranque OIDC, resumen del panel y herramientas de seed queda dentro de React.
- Se mantienen los warnings previos de build relacionados con PGlite/browser externals y `eval` en dependencias de preview; no son nuevos de esta migración.

## Validación — layouts y banner preview — 2026-03-28
- `cd apps/frontend && bun test` ✅
- `cd apps/frontend && bun run build` ✅

## Observaciones adicionales — layouts y banner preview
- `BaseNavIsland` se genera como chunk dedicado de `0.63 kB` (`0.40 kB gzip`).
- `AdminNavIsland` se genera como chunk dedicado de `1.38 kB` (`0.71 kB gzip`).
- `PreviewBannerIsland` se genera como chunk dedicado de `1.61 kB` (`0.71 kB gzip`).
- El estado de sesión del layout base, la navegación responsive del backoffice y las utilidades de preview quedan encapsulados en React.
- Se mantienen los warnings previos de build relacionados con PGlite/browser externals y `eval` en dependencias de preview; no son nuevos de esta migración.
