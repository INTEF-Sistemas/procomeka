# Arquitectura del sistema

## Estado

Borrador. Las capas marcadas como "pendiente de ADR" no tienen tecnología decidida.

---


## Arquitectura del antiguo Procomún y proceso de migración

### Arquitectura actual (Legacy)

El sistema anterior (el antiguo Procomún) está construido sobre una arquitectura más monolítica (evolucionada desde la red Agrega) e incluye múltiples componentes que han ido creciendo con el tiempo:
- **Gestión de contenidos:** Integraba un repositorio documental principal para REA en diversos formatos (como paquetes SCORM).
- **Banco Multimedia:** Un sistema integrado para almacenar, clasificar y servir archivos multimedia (imágenes, audio, vídeo).
- **Herramientas de edición:** Integración embebida de eXeLearning online, permitiendo a los autores la edición en vivo de sus archivos de proyecto (.elpx) sin salir de la plataforma.
- **Buscador:** Un motor de búsqueda interno para indexar recursos y material multimedia, con capacidades de filtrado.

### Proceso de migración

El paso a la nueva arquitectura implicará un proceso de **Migración de Contenidos y Usuarios** (ETL - Extracción, Transformación y Carga) para asegurar que no se pierda el valor generado en la plataforma anterior. Este proceso requerirá:

1. **Extracción (Extract):**
   - Volcar los recursos existentes (paquetes SCORM, archivos .elpx, enlaces).
   - Extraer el catálogo del Banco Multimedia con todas sus imágenes, vídeos y audios.
   - Extraer la base de datos de usuarios (perfiles, historial y aportaciones).
2. **Transformación (Transform):**
   - Mapear y adaptar los metadatos antiguos (que pueden ser inconsistentes) al nuevo esquema unificado y estricto.
   - Limpieza y deduplicación de registros.
   - Transformar los permisos y asociaciones de los recursos para que encajen en el nuevo modelo de moderación, licencias y validación.
3. **Carga (Load):**
   - Ingestar de forma masiva (vía *Jobs de Ingestión*) el contenido transformado a la nueva base de datos y su indexación inmediata en el nuevo motor de búsqueda.


## Visión general

El sistema se organiza en capas desacopladas con contratos explícitos entre ellas. El lenguaje de toda la pila es TypeScript. El runtime de servidor es Bun.

```
┌─────────────────────────────────────────────┐
│              Clientes externos               │
│   (navegador, LMS, otros repositorios)       │
└─────────────────┬───────────────────────────┘
                  │ HTTP / OAI-PMH / RSS
┌─────────────────▼───────────────────────────┐
│                 API Layer                    │
│     REST público + Admin API                 │
│     TypeScript + Bun  [ADR pendiente]        │
└────────┬──────────────────┬─────────────────┘
         │                  │
┌────────▼────────┐ ┌───────▼─────────────────┐
│  Frontend       │ │  Jobs / Workers          │
│  público        │ │  Ingestión, importación  │
│  [ADR pendiente]│ │  TypeScript + Bun        │
└─────────────────┘ └───────┬─────────────────┘
                             │
┌────────────────────────────▼────────────────┐
│              Capa de servicios               │
│   Catálogo, Curación, Búsqueda, Usuarios     │
│         TypeScript (dominio puro)            │
└────────┬──────────────────┬─────────────────┘
         │                  │
┌────────▼────────┐ ┌───────▼─────────────────┐
│  Base de datos  │ │  Motor de búsqueda       │
│  [ADR pendiente]│ │  [ADR pendiente]         │
└─────────────────┘ └─────────────────────────┘
```

## Capas y responsabilidades

### API Layer
- Expone endpoints REST para clientes externos y frontend
- Valida entrada, aplica autenticación y autorización
- No contiene lógica de negocio; delega en servicios
- Pendiente de ADR: Hono + Bun vs Elysia vs Fastify

### Frontend público
- Interfaz pública para profesorado y ciudadanía
- Búsqueda, fichas de recurso, colecciones, descarga
- Pendiente de ADR: Next.js vs Astro vs Remix

### Jobs / Workers
- Importación programada desde fuentes externas
- Procesamiento de lotes de ingestión
- Enriquecimiento asíncrono de metadatos
- Implementado con Bun workers o sistema de colas (pendiente de ADR)

### Capa de servicios
- Lógica de negocio: catálogo, curación, búsqueda, usuarios
- Tipos y contratos TypeScript compartidos entre capas
- Sin dependencia directa de framework HTTP ni de ORM específico

### Base de datos
- Almacenamiento principal de recursos, metadatos y usuarios
- Pendiente de ADR: PostgreSQL vs SQLite/Turso

### Motor de búsqueda
- Índice optimizado para búsqueda textual y facetas
- Sincronizado desde la base de datos principal
- Pendiente de ADR: Meilisearch vs Typesense vs Postgres FTS

## Principios de diseño

1. **Contratos explícitos**: cada capa define tipos TypeScript de entrada y salida
2. **Sin lógica de negocio en la API**: la API valida y delega, los servicios deciden
3. **Jobs idempotentes**: toda importación puede reejecutarse sin efectos no deseados
4. **Observabilidad desde el inicio**: logs estructurados, métricas, trazas en todas las capas
5. **Accesibilidad como requisito**: no como añadido posterior

## ADRs relacionadas

- [ADR-0001](../negocio/decisiones/0001-typescript-bun-como-stack-base.md): TypeScript + Bun como stack base
- ADR-0002: Framework HTTP para API (pendiente)
- ADR-0003: Framework frontend (pendiente)
- ADR-0004: Base de datos principal (pendiente)
- ADR-0005: Motor de búsqueda (pendiente)
