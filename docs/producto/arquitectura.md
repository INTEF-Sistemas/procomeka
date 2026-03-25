# Arquitectura del sistema

## Estado

Definida en Fase 0. Tecnologías decididas para todas las capas principales.

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
   - Ingestar de forma masiva (vía scripts de ingestión) el contenido transformado a la nueva base de datos.


## Visión general

El sistema se organiza en capas desacopladas con contratos explícitos entre ellas. El lenguaje de toda la pila es TypeScript (strict). El runtime de servidor es Bun. La arquitectura sigue principios estrictos de simplicidad (KISS) para minimizar la carga operativa, basándose en un diseño monolítico que resuelve el almacenamiento en disco y la búsqueda en base de datos.

```
┌─────────────────────────────────────────────┐
│              Clientes externos               │
│   (navegador, LMS, otros repositorios)       │
└─────────────────┬───────────────────────────┘
                  │ HTTP / OAI-PMH / RSS
┌─────────────────▼───────────────────────────┐
│                 API Layer                    │
│     REST público + Admin API                 │
│     Hono + Bun  (ADR-0003)                   │
│     apps/api/                                │
└────────┬────────────────────────────────────┘
         │
┌────────▼────────┐
│  Frontend       │
│  público        │
│  Astro          │
│  (ADR-0004)     │
│  apps/frontend/ │
└─────────────────┘
         │
┌────────▼────────────────────────────────────┐
│              Capa de datos                   │
│   Drizzle ORM (ADR-0006)                     │
│   packages/db/                               │
└────────┬──────────────────┬─────────────────┘
         │                  │
┌────────▼────────┐ ┌───────▼─────────────────┐
│  PostgreSQL     │ │  Sistema de Archivos     │
│  (ADR-0005)     │ │  Local / Volumen montado │
│  prod/staging   │ └─────────────────────────┘
├─────────────────┤
│  SQLite         │
│  (ADR-0002)     │
│  preview/tests  │
└─────────────────┘
```

## Estructura del monorepo

```
procomeka/
├── apps/
│   ├── api/          # Servidor API — Hono + Bun
│   └── frontend/     # Frontend público — Astro
├── packages/
│   └── db/           # Esquema, migraciones, acceso a datos — Drizzle ORM
├── docs/             # Documentación del proyecto
├── e2e/              # Tests end-to-end — Playwright
└── package.json      # Bun workspaces raíz
```

## Capas y responsabilidades

### API Layer — `apps/api/`
- Framework: **Hono** (ADR-0003)
- Expone endpoints REST para clientes externos y frontend
- Valida entrada, aplica autenticación y autorización
- Orquesta tareas programadas o asíncronas sencillas que pueden lanzarse vía API o CLI
- No contiene lógica de negocio; delega en servicios

### Frontend público — `apps/frontend/`
- Framework: **Astro** (ADR-0004)
- Interfaz pública para profesorado y ciudadanía
- Búsqueda, fichas de recurso, colecciones, descarga
- Arquitectura de islas: mínimo JS en cliente, componentes interactivos solo donde aporten valor

### Capa de datos — `packages/db/`
- ORM: **Drizzle** (ADR-0006)
- Esquema TypeScript que define tablas, relaciones y tipos inferidos
- Migraciones versionadas en SQL plano (`drizzle-kit`)
- Configuración dual: PostgreSQL (producción) / SQLite (preview/tests)

### Base de datos — PostgreSQL (ADR-0005)
- Almacenamiento principal de recursos, metadatos y usuarios
- Índice de búsqueda (FTS nativo de PostgreSQL)
- SQLite para previews estáticos en PRs (ADR-0002)

### Sistema de Archivos
- Almacenamiento directo en disco físico de los archivos subidos, metadatos voluminosos en crudo o multimedia.
- Decisiones de hardware / replicación delegadas al administrador del sistema (ej: disco local, NAS, SAN, etc.).

## Principios de diseño

1. **Contratos explícitos**: cada capa define tipos TypeScript de entrada y salida
2. **Sin lógica de negocio en la API**: la API valida y delega, los servicios deciden
3. **Simplicidad ante todo (KISS)**: se prescinde de motores de búsqueda dedicados, sistemas de colas o buckets de objetos para mantener la operativa sencilla (monolito + DB + disco).
4. **Tareas de ingestión idempotentes**: toda importación puede reejecutarse sin efectos no deseados
5. **Observabilidad desde el inicio**: logs estructurados, métricas, trazas en todas las capas
6. **Accesibilidad como requisito**: no como añadido posterior
7. **Entorno estático funcional por PR**: Capacidad de generar una versión estática de la plataforma (usando SQLite) para probar el sistema desde el navegador en cada Pull Request de forma ligera, sin despliegues de backend.

## ADRs relacionadas

- [ADR-0001](../negocio/decisiones/0001-typescript-bun-como-stack-base.md): TypeScript + Bun como stack base
- [ADR-0002](../negocio/decisiones/0002-preview-estatico-prs-con-sqlite.md): Preview estático de PRs con SQLite
- [ADR-0003](../negocio/decisiones/0003-framework-http-api.md): Framework HTTP para API — Hono
- [ADR-0004](../negocio/decisiones/0004-framework-frontend.md): Framework frontend — Astro
- [ADR-0005](../negocio/decisiones/0005-base-de-datos-principal.md): Base de datos principal — PostgreSQL
- [ADR-0006](../negocio/decisiones/0006-orm-y-capa-acceso-datos.md): ORM y capa de acceso a datos — Drizzle
