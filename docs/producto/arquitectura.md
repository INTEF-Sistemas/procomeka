# Arquitectura del sistema

## Estado

Borrador. Las capas marcadas como "pendiente de ADR" no tienen tecnología decidida.

---

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
