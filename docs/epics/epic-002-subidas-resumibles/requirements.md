# Requirements — Épica 002: subidas resumibles y adjuntos de recursos

## Fecha
2026-03-27

## Problema público/educativo
Los recursos educativos reales suelen incluir vídeos, paquetes SCORM, presentaciones o datasets de gran tamaño. Sin un sistema de subida robusto, la plataforma no puede servir como herramienta editorial útil para autores y curadores.

## Usuario principal
- Autor/editor que necesita adjuntar archivos pesados a un recurso sin perder trabajo ante cortes de red.

## Objetivo de la épica
Entregar una primera capacidad end-to-end de subida multiarchivo resumable con progreso, cancelación y adjuntos persistidos en recursos.

## Requisitos funcionales mínimos
- RF-001: crear una sesión de upload autenticada para un recurso editable por el usuario.
- RF-002: reanudar uploads interrumpidos sin reiniciar desde cero.
- RF-003: subir varios archivos en paralelo con progreso individual y global.
- RF-004: cancelar un archivo sin afectar al resto del lote.
- RF-005: persistir el binario y asociarlo a `media_items` al completar.
- RF-006: listar uploads recientes y archivos adjuntos desde la edición del recurso.

## Requisitos no funcionales
- Seguridad: sesión + RBAC + allow-list de extensiones/MIME.
- Rendimiento: streaming sin cargar el archivo completo en memoria.
- Accesibilidad: dropzone usable por teclado y mensajes con `aria-live`.
- Operación: límites configurables por entorno y storage local parametrizable.

## Fuera de alcance (esta entrega)
- Object storage S3-compatible en producción.
- Escaneo de malware obligatorio.
- Publicación pública de binarios fuera del backoffice.
