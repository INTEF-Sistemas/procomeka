# ADR-0012: Almacenamiento de archivos en modo preview con IndexedDB

## Estado

Aceptado — 2026-03-28

## Agentes implicados

Arquitectura de Solucion, Frontend UX, DevOps

## Contexto y Problema

En modo preview (build estatico en GitHub Pages), no hay servidor backend. El protocolo Tus (ADR-0011) requiere un servidor para recibir chunks. Sin uploads funcionales, no se puede probar el flujo completo de creacion de recursos con archivos adjuntos en las PR previews.

## Opciones Consideradas

| Opcion | Persiste reload | 50 MB | Complejidad | Notas |
|--------|----------------|-------|-------------|-------|
| **IndexedDB** | Si | Si (quota ~60% disco) | Baja-Media | Universal, consistente con PGlite |
| Cache API | Si | Si | Media | Requiere wrapping en Request/Response falsos |
| OPFS | Si | Si | Media-Alta | Requiere Web Workers para API sincrona |
| Blob URLs | No | Si | Trivial | No sobrevive reload — descartado |
| Deshabilitar uploads | N/A | N/A | Ninguna | No permite probar el flujo — descartado |

## Decision

Usar **IndexedDB** para almacenar blobs de archivos en modo preview, con un plugin custom de Uppy que reemplaza Tus.

- **Metadatos** (upload sessions, media items) se almacenan en PGlite (ya existente en browser).
- **Blobs de archivos** se almacenan en una base de datos IndexedDB separada (`procomeka-files`), NO en PGlite (para evitar cargar blobs en memoria al iniciar PGlite).
- **Plugin Uppy custom** (`PreviewUploader`) reemplaza `Tus` en modo preview. Usa `BasePlugin` + `addUploader()`.
- **Servicio de archivos** usa `URL.createObjectURL()` para crear URLs efimeras desde los blobs almacenados.

## Consecuencias

### Positivas

- El flujo completo de uploads funciona en PR previews sin servidor
- Archivos persisten entre reloads de pagina
- Reutiliza la UI de Uppy existente (drag-drop, progreso, cola)
- Consistente con la estrategia de PGlite-in-browser (ADR-0010)

### Negativas / Riesgos

- Safari puede desalojar IndexedDB bajo presion de almacenamiento — mitigar con disclaimer de "modo demo"
- Los archivos son efimeros a nivel de origen del navegador, no portatiles
- No prueba el protocolo Tus real (chunks, checksums, reanudacion) — eso se prueba con backend local

## Notas de Implementacion

- Plugin Uppy: ~60 lineas, usa `idb-keyval` pattern (open DB, put blob, get blob)
- PreviewApiClient: implementar `createUploadSession`, `completeUploadSession`, `listResourceUploads`, `listResourceMediaItems`, `createMediaItem` usando los repositorios de PGlite
- resource-uploader.ts: condicional `isPreview ? PreviewUploader : Tus`
