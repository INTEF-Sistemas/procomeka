# ADR-0011 Subidas resumibles con protocolo tus y storage local

* Estado: Aceptado
* Fecha: 2026-03-27
* Agentes Implicados: `@.agents/skills/backend-api-servicios`, `@.agents/skills/frontend-ux-accesibilidad`, `@.agents/skills/documentacion-y-roadmap`

## Contexto y Problema

La plataforma necesita soportar subida de archivos grandes y multiarchivo dentro del flujo editorial de recursos. El upload tradicional por formulario no cubre reanudación, progreso fino, cancelación ni tolerancia a desconexiones. Además, la arquitectura actual documenta operación simple sobre Bun + Hono + PostgreSQL/PGlite + disco local, sin object storage obligatorio.

## Opciones Consideradas

* Protocolo `tus` con almacenamiento en disco local/volumen.
* Multipart upload directo a S3-compatible.
* Protocolo chunked propietario ad hoc sobre la API admin.

## Decisión

Se adopta `tus` como base para uploads resumables y almacenamiento inicial en disco local/volumen montado.

La API mantiene el control de autenticación, autorización, límites, persistencia de sesiones y asociación a recursos; el storage de binarios se resuelve localmente en esta primera entrega. Se deja una capa explícita de configuración y persistencia (`upload_sessions`) para poder evolucionar a otro backend de storage sin romper contratos de producto.

## Consecuencias

### Positivas
* Reanudación y cancelación reales sin cargar archivos completos en memoria.
* Integración natural con cola multiarchivo y progreso en frontend.
* Compatible con la arquitectura operativa actual, sin exigir S3 en v1.
* Permite crecer a backends más complejos manteniendo contratos funcionales.

### Negativas / Riesgos
* El storage local exige disciplina operativa de backups, quotas y limpieza.
* La validación de integridad avanzada por chunk requiere extensión adicional sobre el flujo base.
* El preview estático no puede emular uploads reales.

## Notas de Implementación

* Persistir sesiones de upload en PostgreSQL con tabla `upload_sessions`.
* Asociar automáticamente el binario completado a `media_items`.
* Exponer configuración de límites vía entorno y endpoint admin.
* Mantener hook opcional de escaneo de malware con `noop` por defecto.
* El directorio `UPLOAD_STORAGE_DIR` sigue la resolución estándar del proceso. Si se deja como ruta relativa, cae bajo el `cwd` efectivo de la API; en desarrollo local con `bun run --filter '@procomeka/api' dev`, eso implica `apps/api/local-data/uploads`.
