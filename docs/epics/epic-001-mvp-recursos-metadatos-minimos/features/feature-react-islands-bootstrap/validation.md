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
