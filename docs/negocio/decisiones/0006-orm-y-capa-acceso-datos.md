# ADR-0006 ORM y capa de acceso a datos

* Estado: Aceptado
* Fecha: 2026-03-25
* Agentes Implicados: [@.agents/skills/evaluacion-tecnologica/SKILL.md, @.agents/skills/backend-api-servicios/SKILL.md, @.agents/skills/direccion-de-plataforma/SKILL.md]

## Contexto y Problema

Tras decidir PostgreSQL como base de datos principal (ADR-0005), se necesita definir la capa de acceso a datos. Con la adopción de PGlite (ADR-0010), todos los entornos usan PostgreSQL (real o WASM), por lo que solo se necesita soporte para un dialecto SQL.

Se evalúan dos alternativas:

1. **Usar un ORM/query builder** que gestione esquema, migraciones y consultas tipadas.
2. **No usar ORM** y trabajar directamente con los drivers nativos de Bun (`bun:sql` para PostgreSQL).

La opción "sin ORM" implicaría construir un sistema de migraciones propio y renunciar a tipado automático de consultas, lo que contradice el principio de "antes de desarrollo propio, evaluar si existe solución de mercado adecuada" (AGENTS.md, regla 8). Se descarta como opción principal y se evalúan los ORM/query builders disponibles.

Restricciones:

- Stack fijo: TypeScript strict + Bun.
- Soporte PostgreSQL en todos los entornos (producción vía PostgreSQL real, dev/preview vía PGlite).
- Migraciones versionadas y auditables (ADR-0005, nota de implementación 3).
- Simplicidad y menor fricción posible con el runtime Bun.

## Opciones Consideradas

* Drizzle ORM
* Prisma
* Kysely
* TypeORM

## Análisis comparativo

| Criterio | Drizzle | Prisma | Kysely | TypeORM |
|---|---|---|---|---|
| Compatibilidad nativa Bun | Excelente: drivers oficiales `drizzle-orm/bun-sql` y `drizzle-orm/bun-sqlite` | Parcial: funciona en Bun pero SQLite requiere workaround con `@prisma/adapter-libsql` (Bun no soporta `better-sqlite3`) | Buena: instalable con Bun, dialectos para PostgreSQL y SQLite | Sin integración específica con Bun |
| Soporte dual PostgreSQL + SQLite | Nativo en ambos con drivers dedicados para Bun | Soporta ambos motores, pero SQLite en Bun requiere adapter adicional | Soporta ambos mediante dialectos | Soporta ambos, pero sin optimización para Bun |
| Migraciones | `drizzle-kit generate` + `drizzle-kit migrate`, SQL plano versionado | Sistema propio (`prisma migrate`), genera SQL | Requiere librería externa o sistema propio | Sistema de migraciones integrado |
| Tipado TypeScript | SQL-like type-safe desde el esquema, inferencia directa | Cliente generado con tipado fuerte desde schema Prisma | Query builder con tipado fuerte | Decoradores, tipado menos estricto |
| Peso y dependencias | Ligero (~7.4kb min+gzip), zero dependencies | Pesado: incluye engine binario (Rust), cliente generado, CLI | Ligero, pocas dependencias | Pesado, muchas dependencias |
| Enfoque | Cercano a SQL, control explícito | Abstracción alta, DX guiada (modelo → cliente → studio) | Query builder puro, máximo control SQL | ORM clásico con patrón Active Record/Data Mapper |
| Madurez | Buena y creciente, comunidad activa, documentación de alta calidad | Muy alta, amplia adopción enterprise | Buena, nicho más reducido | Alta pero percibida como legacy en stack moderno |
| Lock-in | Bajo: esquemas son TypeScript estándar, SQL portable | Medio: schema propio (`.prisma`), engine binario, CLI específico | Bajo: query builder sobre SQL estándar | Medio: decoradores y patrones específicos |

### Síntesis por opción

#### Drizzle ORM

**Pros**
- Integración nativa con Bun para ambos motores de base de datos sin workarounds.
- Esquema definido en TypeScript puro, sin lenguaje propietario.
- Migraciones generan SQL plano, auditable y versionable.
- Ligero y sin dependencias binarias.
- API SQL-like que mantiene control explícito sobre las consultas.

**Contras**
- Menos "magia" y herramientas visuales que Prisma (no tiene equivalente a Prisma Studio).
- Ecosistema de integraciones enterprise menor que Prisma.
- Requiere más conocimiento de SQL que Prisma para consultas complejas.

#### Prisma

**Pros**
- DX muy pulida: schema declarativo, cliente generado, Studio visual.
- Amplia adopción y documentación abundante.
- Sistema de migraciones maduro.

**Contras**
- SQLite en Bun no funciona con el driver nativo; requiere `@prisma/adapter-libsql` como workaround.
- CLI en Bun requiere `bunx --bun` para evitar caer a Node (encaje no limpio).
- Engine binario Rust añade peso y complejidad al despliegue.
- Schema en lenguaje propio (`.prisma`), mayor lock-in.

#### Kysely

**Pros**
- Query builder tipado excelente, máximo control sobre SQL.
- Ligero y con pocas dependencias.

**Contras**
- No es un ORM completo: no incluye migraciones integradas ni generación de esquema.
- Sin historia de integración nativa con drivers Bun comparable a Drizzle.
- Requiere más código manual para funcionalidad equivalente.

#### TypeORM

**Pros**
- ORM clásico conocido, soporta muchas bases de datos.

**Contras**
- Sin encaje específico con Bun.
- Percibido como legacy frente a alternativas modernas.
- Uso de decoradores experimentales, menor alineación con TypeScript strict moderno.
- No competitivo para un proyecto greenfield en Bun.

## Decisión

Se adopta **Drizzle ORM** como capa de acceso a datos y migraciones.

Justificación principal:

1. **Mejor encaje nativo con Bun**: drivers oficiales para `bun:sql` (PostgreSQL) y `drizzle-orm/pglite` (PGlite) sin workarounds.
2. **Esquema unificado**: un solo esquema `pgTable` funciona en PostgreSQL real y PGlite (dev/preview) sin duplicación.
3. **Migraciones SQL plano**: `drizzle-kit` genera migraciones versionadas en SQL puro, cumpliendo el requisito de auditabilidad.
4. **Mínimo lock-in**: esquemas en TypeScript estándar, sin lenguaje propietario ni binarios adicionales.
5. **Simplicidad**: ligero, sin dependencias, cercano a SQL — alineado con el principio de mínima complejidad necesaria.

## Consecuencias

### Positivas
* Se habilita la estrategia PostgreSQL/PGlite con un único ORM, esquema unificado y drivers nativos de Bun.
* Las migraciones son SQL plano versionado, auditables y portables.
* El equipo mantiene control explícito sobre las consultas generadas.
* Menor superficie de dependencias y menor complejidad de despliegue (sin binarios externos).
* Esquema TypeScript reutilizable para validación, tipos de API y contratos.

### Negativas / Riesgos
* Menor nivel de abstracción que Prisma: requiere más conocimiento de SQL para consultas complejas.
* No incluye herramientas visuales tipo Prisma Studio para exploración de datos.
* Ecosistema más joven que Prisma, aunque en crecimiento rápido.
* ~~Riesgo de divergencia SQL entre PostgreSQL y SQLite~~ — eliminado con la adopción de PGlite (ADR-0010): todos los entornos usan PostgreSQL.

## Notas de Implementación

1. **Estructura de esquema**
   - Definir esquemas Drizzle en `packages/db/schema/` con TypeScript strict.
   - Separar definiciones de tabla por dominio (resources, users, collections, etc.).

2. **Configuración unificada**
   - `drizzle.config.ts` con dialect `postgresql` para todos los entornos.
   - PGlite para desarrollo local y preview; PostgreSQL real para producción.

3. **Migraciones**
   - Generar con `bunx drizzle-kit generate`.
   - Aplicar con `bunx drizzle-kit migrate`.
   - Mantener migraciones en control de versiones bajo `packages/db/migrations/`.
   - Validar compatibilidad dual en CI (ejecutar migraciones contra ambos motores).

4. **SQL PostgreSQL unificado**
   - Con PGlite en todos los entornos no-producción, ya no hay restricción de "perfil SQL portable".
   - Se pueden usar features de PostgreSQL (JSONB, arrays, FTS) sabiendo que PGlite las soporta.

5. **Criterios de revisión**
   - Reabrir esta decisión si:
     (a) Drizzle pierde soporte activo para drivers nativos de Bun.
     (b) PGlite deja de ser viable para desarrollo o preview.
     (c) Requisitos de negocio exigen capacidades de ORM no cubiertas por Drizzle.
     (d) Prisma u otra alternativa resuelve sus limitaciones con Bun de forma nativa.
