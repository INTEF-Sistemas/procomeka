# Mapa de capacidades

Este documento describe las capacidades funcionales del sistema, organizadas por área. Es la referencia para priorizar épicas y decidir el alcance de cada entrega.

## Nivel 1: Catálogo y metadatos

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Modelo de metadatos | Esquema de campos, vocabularios, validación | Alta |
| Gestión de recursos | CRUD de recursos con metadatos | Alta |
| Gestión de medios | Archivos adjuntos, imágenes, URLs externas | Alta |
| Taxonomías | Nivel educativo, materia, tipo de recurso | Alta |
| Licencias | Asignación y visualización de licencias CC | Alta |
| Control de versiones | Historial de cambios en recursos | Media |
| Identificadores persistentes | URIs, ARK, DOI | Media |

## Nivel 2: Ingestión y migración

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Importación CSV/JSON | Carga masiva desde archivos | Alta |
| Cosecha OAI-PMH | Importación desde otros repositorios | Alta |
| Importación desde Procomún | Migración del sistema legacy | Alta |
| Deduplicación | Detección de recursos duplicados | Media |
| Enriquecimiento automático | Inferencia de campos a partir del recurso | Baja |

## Nivel 3: Curación y calidad

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Flujo editorial | Estados: borrador → revisión → validado → destacado | Alta |
| Asignación de tareas | Curador asignado a recursos pendientes | Media |
| Revisión de metadatos | Edición y validación campo a campo | Alta |
| Criterios de calidad | Reglas automáticas de completitud y consistencia | Media |
| Moderación de contenido | Reporte, revisión y gestión de contenido inapropiado | Media |

## Nivel 4: Búsqueda y descubrimiento

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Búsqueda simple | Texto libre con autocompletado | Alta |
| Búsqueda avanzada | Filtros combinados por campo | Alta |
| Facetas | Filtrado por nivel, materia, tipo, idioma, licencia | Alta |
| Ranking de relevancia | Ordenación por señales de calidad y uso | Media |
| Recursos relacionados | Sugerencias contextuales en ficha | Media |
| Navegación temática | Exploración por área curricular o colección | Media |
| Búsqueda cero resultados | Sugerencias alternativas | Media |

## Nivel 5: Colecciones y organización

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Colecciones | Agrupaciones curadas de recursos | Alta |
| Itinerarios | Secuencias ordenadas de recursos | Media |
| Favoritos | Listas personales de recursos guardados | Baja |
| Etiquetado | Tags libres en recursos | Media |

## Nivel 6: Usuarios y permisos

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Autenticación | Login con email, SSO educativo | Alta |
| Roles | Administrador, curador, autor, lector | Alta |
| Perfil de usuario | Datos básicos, preferencias | Baja |
| Historial de actividad | Qué ha hecho cada usuario | Media |

## Nivel 7: API e interoperabilidad

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| API REST pública | Acceso de lectura al catálogo | Alta |
| OAI-PMH servidor | Cosecha del catálogo por terceros | Alta |
| Exportación bulk | Descarga del catálogo completo | Media |
| Feeds RSS/Atom | Novedades y colecciones | Media |
| Integración LTI | Conexión con plataformas LMS | Baja |
| Webhooks | Notificaciones a sistemas externos | Baja |

## Nivel 8: Administración y operación

| Capacidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| Panel de administración | Gestión de usuarios, fuentes, configuración | Alta |
| Logs de auditoría | Trazabilidad de acciones | Media |
| Jobs de importación | Programación y monitorización de cargas | Alta |
| Analítica básica | Métricas de uso y calidad | Media |
| Backups | Copia y restauración de datos | Alta |
