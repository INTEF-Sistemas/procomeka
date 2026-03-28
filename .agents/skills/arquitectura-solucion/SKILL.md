---
name: arquitectura-solucion
description: "Rol de Arquitecto/a de Solución. Usa este skill para convertir una necesidad validada en diseño técnico trazable: componentes, flujos, contratos de API, modelo de datos y estrategia de pruebas."
metadata:
  author: procomeka
  version: "1.1"
---

> Última actualización: 2026-03-28

# Skill: Arquitectura de Solución

## Rol

Actúas como arquitecto/a de solución del proyecto Procomún.

## Misión

Convertir una necesidad validada en diseño técnico trazable, coherente con el stack TypeScript + Bun y las decisiones de plataforma ya tomadas.

## Restricciones técnicas base

- Todo el código es TypeScript strict
- El runtime de servidor es Bun
- Cada capa debe tener un contrato explícito (tipos, interfaces, esquemas)
- Los tests corren con `bun test`

## Debes producir

- Contexto funcional del problema
- Componentes implicados y sus responsabilidades
- Flujos principales (happy path + errores)
- Modelo de datos lógico (entidades, relaciones, campos clave)
- Contratos de API (endpoints, tipos de entrada/salida, errores)
- Decisiones técnicas con justificación
- Riesgos identificados
- Estrategia de pruebas

## Estructura de salida

```
## Resumen ejecutivo
## Contexto y restricciones
## Componentes implicados
## Diseño propuesto
## Modelo de datos
## Flujos principales
## Contratos API
## Seguridad y permisos
## Observabilidad
## Estrategia de pruebas
## Riesgos
## Tareas derivadas
```

## Regla

Toda pieza del diseño debe poder rastrearse hasta un requisito de producto. Si no hay requisito, el diseño no procede.

---

## Especialización en datos y base de datos

> Contenido consolidado desde el skill `data-db-architect`.

### Principio

La base de datos es el corazón inmutable del sistema, no solo un lugar donde guardar JSONs sin control. Ninguna entidad se añade sin validación estricta, tipos fuertes e integridad referencial garantizada a nivel DB.

### Contexto técnico

El proyecto usa PostgreSQL en producción y PGlite (PostgreSQL WASM) en desarrollo local y previews, con un esquema `pgTable` unificado de Drizzle ORM.

### Responsabilidades adicionales

- **Modelo de Datos:** Diseñar el esquema lógico y físico (tablas, relaciones, tipos de datos, JSON vs columnas).
- **Rendimiento y Escalabilidad:** Definir índices estratégicos, vistas materializadas y estrategias de query-tuning para optimizar búsquedas.
- **Integridad:** Establecer constraints (claves foráneas, unicidad, checks) a nivel base de datos para proteger la calidad de los metadatos.
- **Auditoría:** Diseñar estrategias para mantener el historial de cambios, versionado y la autoría (logs de auditoría, soft deletes, triggers).
- **Búsqueda en DB:** Configurar los índices FTS (Full-Text Search) directamente en la base de datos para la búsqueda de catálogo.
- **Decisión Tecnológica:** Liderar la decisión (ADR) sobre la base de datos principal, cerrando la duda entre arquitecturas relacionales tradicionales o perimetrales.

### Entregables adicionales

- Esquemas lógicos y físicos de la base de datos (ERD en Markdown/Mermaid).
- Definición de índices y restricciones (constraints).
- Estrategia y diseño del sistema de auditoría.
- ADRs relacionados con persistencia de datos (PostgreSQL/PGlite).
- Diseño del flujo de sincronización DB -> Search Engine.

---

### Patrones Drizzle ORM

#### Definición de esquema con `pgTable`

Cada tabla se define con `pgTable` importando tipos de columna desde `drizzle-orm/pg-core`. Tipos disponibles relevantes para el proyecto:

- **Identificadores:** `serial('id').primaryKey()` (autoincremental), `uuid('id').defaultRandom().primaryKey()` (UUID v4)
- **Texto:** `text('col')` (sin límite), `varchar('col', { length: 256 })` (con límite)
- **Numéricos:** `integer('col')`, `smallint('col')`, `bigint('col', { mode: 'number' })`
- **Booleanos:** `boolean('col')`
- **Fechas:** `timestamp('col', { withTimezone: true }).defaultNow()`, `date('col', { mode: 'date' })`
- **JSON:** `jsonb<TipoEsperado>('col')` — usar siempre `jsonb` sobre `json` para indexación GIN
- **Arrays:** `text('col').array()` — para campos multivalor como etiquetas o idiomas
- **Enums:** `pgEnum('nombre', ['val1', 'val2', 'val3'])` — para valores cerrados como estados o tipos de recurso

Constraints encadenados: `.notNull()`, `.unique()`, `.default(valor)`, `.defaultNow()`, `.references(() => otraTabla.id)`.

Para **referencias circulares** (ej: recurso padre/hijo), usar `AnyPgColumn`:

```typescript
import { type AnyPgColumn, integer, pgTable, serial } from 'drizzle-orm/pg-core';

export const recursos = pgTable('recursos', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references((): AnyPgColumn => recursos.id),
});
```

El tercer argumento de `pgTable` permite definir índices y constraints compuestos:

```typescript
export const tabla = pgTable('tabla', { ... }, (t) => [
  primaryKey({ columns: [t.colA, t.colB] }),
  foreignKey({ columns: [t.ref], foreignColumns: [t.id] }),
]);
```

#### Relaciones para queries relacionales

Las relaciones de Drizzle (`relations()`) son **independientes de las FK en la base de datos**. Sirven para el query builder relacional (`db.query.tabla.findMany({ with: { ... } })`):

```typescript
import { relations } from 'drizzle-orm';

export const recursosRelations = relations(recursos, ({ one, many }) => ({
  autor: one(usuarios, { fields: [recursos.autorId], references: [usuarios.id] }),
  etiquetas: many(recursosEtiquetas),
}));
```

- `one()` para relaciones N:1 o 1:1.
- `many()` para relaciones 1:N.
- Tablas de unión (M:N) requieren dos `one()` en la tabla intermedia y `many()` en ambas tablas principales.

#### Inferencia de tipos TypeScript

Extraer tipos de select e insert directamente del esquema, sin duplicar interfaces:

```typescript
type Recurso = typeof recursos.$inferSelect;    // tipo para lectura
type NuevoRecurso = typeof recursos.$inferInsert; // tipo para inserción
```

#### SQL personalizado

Para expresiones que Drizzle no cubre nativamente (tsvector, operadores FTS, funciones PG), usar el template literal `sql`:

```typescript
import { sql } from 'drizzle-orm';

// En definición de columna generada (migración custom):
// GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(titulo,'') || ' ' || coalesce(descripcion,''))) STORED

// En queries:
const resultados = await db.select()
  .from(recursos)
  .where(sql`${recursos.searchVector} @@ websearch_to_tsquery('spanish', ${termino})`)
  .orderBy(sql`ts_rank_cd(${recursos.searchVector}, websearch_to_tsquery('spanish', ${termino}), 32) DESC`);
```

#### Transacciones

Drizzle envuelve operaciones atómicas con `db.transaction()`. Soporta rollback explícito:

```typescript
await db.transaction(async (tx) => {
  const [recurso] = await tx.insert(recursos).values(datos).returning();
  await tx.insert(recursosEtiquetas).values(
    etiquetaIds.map(eId => ({ recursoId: recurso.id, etiquetaId: eId }))
  );
  // tx.rollback() para abortar si una condición de negocio falla
});
```

Regla: usar transacciones siempre que una operación de negocio toque mas de una tabla.

#### Prepared statements

Para queries ejecutados repetidamente (ej: búsqueda de catálogo), preparar con `sql.placeholder()`:

```typescript
const buscarRecurso = db.select()
  .from(recursos)
  .where(eq(recursos.id, sql.placeholder('id')))
  .prepare('buscar_recurso');

const recurso = await buscarRecurso.execute({ id: 42 });
```

Beneficios: plan de ejecución cacheado en PostgreSQL, protección contra inyección SQL.

#### Integración con PGlite

El driver de Drizzle para PGlite se importa desde `drizzle-orm/pglite`:

```typescript
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

const client = new PGlite();
const db = drizzle(client, { schema });
```

El mismo esquema `pgTable` funciona tanto con el driver `pglite` (dev) como con `node-postgres` o `postgres.js` (producción).

---

### Flujo de migraciones con drizzle-kit

#### Configuración

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
});
```

#### Comandos principales

| Comando | Uso | Cuándo |
|---------|-----|--------|
| `drizzle-kit generate` | Genera SQL de migración comparando esquema TS con snapshots anteriores | Cada cambio de esquema |
| `drizzle-kit push` | Aplica esquema directamente sin generar archivos SQL | Solo en desarrollo local |
| `drizzle-kit generate --custom --name=seed-datos` | Crea archivo SQL vacío para migraciones manuales (seeds, transformaciones) | Datos iniciales, refactors de datos |

#### Flujo recomendado

1. Modificar el esquema TypeScript (fuente de verdad).
2. Ejecutar `drizzle-kit generate` — crea archivo SQL + snapshot en `./migrations/`.
3. **Revisar manualmente** el SQL generado, especialmente para operaciones destructivas (`DROP`, `ALTER TYPE`, `ALTER COLUMN ... TYPE`).
4. Aplicar migración en entorno de staging/producción.
5. Commitear tanto el esquema TS como los archivos de migración SQL.

#### Migraciones destructivas

drizzle-kit genera `DROP COLUMN` y `DROP TABLE` automáticamente. Antes de aplicar:

- Verificar que no hay datos que se perderían.
- Para renombrar columnas, usar migración custom (drizzle-kit genera DROP + ADD, no RENAME).
- Mantener scripts de rollback manuales para migraciones críticas en producción.

---

### PGlite: restricciones y buenas prácticas

#### Arquitectura

PGlite es PostgreSQL compilado a WASM (~3 MB gzipped). No usa una máquina virtual Linux: es Postgres nativo ejecutado en el runtime de JavaScript.

#### Modos de almacenamiento

| Modo | Sintaxis | Entorno | Persistencia |
|------|----------|---------|--------------|
| En memoria | `PGlite.create('memory://')` o `new PGlite()` | Todos | No (efímero) |
| IndexedDB | `PGlite.create('idb://nombre-db')` | Browser | Sí |
| Filesystem | `PGlite.create('./ruta/datos')` | Node.js, Bun | Sí |
| OPFS | Via `PGliteWorker` con Web Worker | Browser | Sí (mejor rendimiento) |

Para IndexedDB, usar `relaxedDurability: true` para mejorar rendimiento (no espera flush a disco en cada escritura).

#### Limitaciones concretas

- **Conexión única:** PGlite solo admite una conexión simultánea. No se pueden abrir múltiples instancias contra la misma base de datos.
- **Multi-tab en browser:** Obligatorio usar `PGliteWorker` en un Web Worker que actúa de proxy para todas las pestañas. Sin esto, cada pestaña intentaría abrir su propia conexión y fallaría.
- **Sin SSL:** Las conexiones no soportan SSL (irrelevante en uso embebido, pero imposibilita usar PGlite como servidor remoto).
- **Sin replicación:** No hay WAL shipping ni replicación lógica.
- **Single-threaded:** `pg_dump` via `pglite-tools` funciona con `-j 1` (sin paralelismo) y formato `--inserts`.
- **Memoria inicial:** Configurable con `initialMemory` (por defecto ~256 MB WASM). Para esquemas grandes, asignar explícitamente: `initialMemory: 64 * 1024 * 1024`.

#### Extensiones disponibles en PGlite

Las extensiones se cargan al crear la instancia, no con `CREATE EXTENSION`:

```typescript
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { live } from '@electric-sql/pglite/live';

const db = await PGlite.create({
  dataDir: 'memory://',
  extensions: { vector, live },
});
```

Extensiones relevantes para el proyecto:

- **pgvector** — búsqueda por similitud vectorial (embeddings para recomendación semántica)
- **live** — queries reactivos que notifican cambios (`db.live.query(...)` con callback)
- **pgcrypto** — funciones criptográficas (hashing de contraseñas)
- **pg_hashids** — IDs cortos codificados

#### Diferencias dev vs producción

| Aspecto | PGlite (dev/preview) | PostgreSQL (producción) |
|---------|---------------------|------------------------|
| Conexiones | 1 (single connection) | Pool de conexiones |
| Extensiones FTS | Disponibles (tsvector, GIN) | Completas |
| `unaccent` | Requiere verificar soporte | Disponible nativo |
| Rendimiento FTS | Adecuado para testing | Optimizado con planificador real |
| Replicación | No soportada | Streaming/lógica |
| pg_dump | Via pglite-tools (limitado) | Nativo completo |

El esquema Drizzle unificado (`pgTable`) garantiza que las definiciones de tablas, columnas y constraints son idénticas en ambos entornos. Las diferencias se limitan a configuración de conexión y extensiones del runtime.

---

### Búsqueda full-text en PostgreSQL

#### Columna tsvector generada

Definir como columna `GENERATED ALWAYS ... STORED` para que PostgreSQL mantenga el vector actualizado automáticamente sin necesidad de triggers:

```sql
ALTER TABLE recursos
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(palabras_clave, '')), 'A')
  ) STORED;
```

- `setweight(..., 'A')` da prioridad máxima al título y palabras clave.
- `setweight(..., 'B')` da prioridad media a la descripción.
- PostgreSQL soporta pesos A, B, C, D (de mayor a menor relevancia).

#### Configuración de texto español sin acentos

Crear una configuración de búsqueda que combine `unaccent` con el stemmer español para que "educacion" encuentre "educación":

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TEXT SEARCH CONFIGURATION es_unaccent (COPY = spanish);

ALTER TEXT SEARCH CONFIGURATION es_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;
```

Usar `'es_unaccent'` en lugar de `'spanish'` en las llamadas a `to_tsvector` y `to_tsquery`.

#### Índice GIN

Obligatorio para rendimiento aceptable en tablas con mas de unos cientos de filas:

```sql
CREATE INDEX idx_recursos_search ON recursos USING GIN (search_vector);
```

#### Funciones de consulta

| Función | Uso | Input del usuario |
|---------|-----|-------------------|
| `websearch_to_tsquery('es_unaccent', input)` | Traduce sintaxis web ("comillas", OR, -exclusión) a tsquery | Barra de búsqueda pública |
| `plainto_tsquery('es_unaccent', input)` | Convierte texto plano a AND de términos | Búsqueda simplificada |
| `to_tsquery('es_unaccent', expr)` | Acepta operadores tsquery explícitos (`&`, `|`, `!`, `<->`) | Consultas programáticas |

`websearch_to_tsquery` es la opcion preferida para input de usuario porque maneja sintaxis natural: `"recursos educativos" -obsoleto` se convierte en `'recurs' <-> 'educ' & !'obsolet'`.

#### Ranking

Usar `ts_rank_cd` (cover density) con normalización 32 para obtener scores en rango 0-1:

```sql
SELECT titulo,
       ts_rank_cd(search_vector, query, 32) AS relevancia
FROM recursos, websearch_to_tsquery('es_unaccent', 'matemáticas primaria') AS query
WHERE search_vector @@ query
ORDER BY relevancia DESC
LIMIT 20;
```

Opciones de normalización combinables (bitmask):
- `0` — sin normalización (favorece documentos largos)
- `1` — divide por 1 + log(longitud del documento)
- `2` — divide por longitud del documento
- `32` — escala a rango [0, 1] con `rank/(rank+1)`

Para el catálogo, usar `32` o `32 | 1` (escala 0-1 con penalización logarítmica a documentos largos).

---

### Estrategia de índices para el catálogo de recursos

#### B-tree (filtros exactos y rangos)

Índices por defecto para columnas usadas en `WHERE` con igualdad o rangos:

```sql
CREATE INDEX idx_recursos_tipo ON recursos (tipo_recurso);
CREATE INDEX idx_recursos_licencia ON recursos (licencia);
CREATE INDEX idx_recursos_idioma ON recursos (idioma);
CREATE INDEX idx_recursos_estado ON recursos (estado);
CREATE INDEX idx_recursos_fecha ON recursos (fecha_publicacion DESC);
```

#### GIN (full-text search, arrays, JSONB)

```sql
-- FTS
CREATE INDEX idx_recursos_search ON recursos USING GIN (search_vector);

-- Arrays (ej: etiquetas almacenadas como text[])
CREATE INDEX idx_recursos_etiquetas ON recursos USING GIN (etiquetas);

-- JSONB (ej: metadatos extendidos)
CREATE INDEX idx_recursos_metadata ON recursos USING GIN (metadata jsonb_path_ops);
```

`jsonb_path_ops` es mas compacto y rápido que la clase de operadores por defecto para JSONB, pero solo soporta el operador `@>` (contención).

#### Índices compuestos

Para queries frecuentes que combinan múltiples filtros, crear índices compuestos respetando el orden de selectividad (columna mas selectiva primero):

```sql
-- Query típico: recursos activos de un tipo, ordenados por fecha
CREATE INDEX idx_recursos_estado_tipo_fecha
  ON recursos (estado, tipo_recurso, fecha_publicacion DESC);
```

#### Índices parciales

Para excluir filas irrelevantes del índice y reducir su tamaño:

```sql
-- Solo indexar recursos publicados para búsqueda pública
CREATE INDEX idx_recursos_search_activos
  ON recursos USING GIN (search_vector)
  WHERE estado = 'publicado';

-- Solo indexar recursos pendientes para cola de moderación
CREATE INDEX idx_recursos_pendientes
  ON recursos (fecha_creacion)
  WHERE estado = 'pendiente_revision';
```

#### Regla de decisión

| Tipo de consulta | Índice recomendado |
|------------------|--------------------|
| Igualdad / rango / ORDER BY | B-tree |
| Full-text search (tsvector) | GIN |
| Contención en arrays (`@>`) | GIN |
| Contención en JSONB (`@>`, `?`, `?&`) | GIN |
| Contención JSONB solo con `@>` | GIN con `jsonb_path_ops` |
| Búsqueda por trigrama / LIKE / ILIKE | GIN con `pg_trgm` |

---

### Estrategia de evolución del esquema

#### Principios

1. **El esquema TypeScript es la fuente de verdad.** Nunca modificar la base de datos directamente; todo cambio nace en el archivo de esquema Drizzle.
2. **Migraciones SQL versionadas en el repositorio.** Cada `drizzle-kit generate` produce un directorio con timestamp, archivo SQL y snapshot JSON.
3. **Revisión humana obligatoria.** Las migraciones generadas se revisan antes de aplicar, especialmente las que contienen `DROP`, `ALTER TYPE` o `ALTER COLUMN ... TYPE`.
4. **Migraciones custom para datos.** Seeds, transformaciones de datos existentes y backfills se crean con `drizzle-kit generate --custom --name=descripcion`.
5. **Sin rollback automático.** drizzle-kit no genera scripts de rollback. Para migraciones críticas en producción, escribir manualmente un script `down.sql` junto al `migration.sql`.

#### Flujo de cambio de esquema

```
1. Editar src/schema.ts
2. drizzle-kit generate          → migrations/YYYYMMDD.../migration.sql
3. Revisar SQL generado
4. bun test                      → validar que tests pasan con nuevo esquema
5. git add src/schema.ts migrations/
6. Aplicar en staging
7. Aplicar en producción
```

#### Consideraciones para PGlite en desarrollo

- `drizzle-kit push` aplica el esquema directamente sobre PGlite sin generar archivos de migración. Util para iteración rápida en local.
- Los archivos de migración SQL generados son compatibles con PGlite siempre que no usen extensiones no soportadas.
- Al iniciar una instancia PGlite en memoria para tests, aplicar migraciones programáticamente con `migrate()` de Drizzle.
