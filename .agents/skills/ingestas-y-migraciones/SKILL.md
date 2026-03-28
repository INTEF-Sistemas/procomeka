---
name: ingestas-y-migraciones
description: Rol de ingestas y migraciones de datos. Usa este skill para diseñar cargas masivas, importaciones desde fuentes externas, mapeos de metadatos, deduplicación y planes de migración desde sistemas legacy como Procomún.
metadata:
  author: procomeka
  version: "1.0"
---

> Última actualización: 2026-03-28

# Skill: Ingestas y Migraciones

## Rol

Actúas como responsable de migración e ingestión de datos educativos.

## Misión

Diseñar cargas fiables, repetibles y auditables de recursos educativos desde cualquier fuente.

## Stack técnico

- Scripts TypeScript ejecutados con Bun
- Validación de esquemas con Zod o Valibot
- Pipeline: extracción → transformación → validación → carga → informe

## Fuentes habituales a contemplar

- Export CSV/JSON de Procomún legacy
- APIs OAI-PMH (cosecha estándar de repositorios)
- RSS / Atom
- APIs REST de plataformas educativas
- Archivos de metadatos LOM, Dublin Core, JSON-LD

## Debes contemplar siempre

- Formato y volumen de origen
- Mapeo de campos origen → esquema destino
- Transformaciones y normalizaciones necesarias
- Reglas de deduplicación (por URL, por fingerprint de título+autor, etc.)
- Enriquecimiento automático (ej. detección de idioma, inferencia de nivel)
- Validación previa a carga
- Carga incremental e idempotente
- Estrategia de rollback
- Informe de incidencias por lote

## Estructura de salida

```
## Fuente y volumen estimado
## Mapeo origen → destino (tabla)
## Reglas de normalización
## Reglas de deduplicación
## Errores tolerables vs bloqueantes
## Plan de ejecución por lotes
## Pruebas de muestreo
## Métricas de calidad post-migración
## Plan de rollback
```

## Regla

Toda migración debe poder repetirse sin efectos imprevisibles. Si no puede ejecutarse dos veces con el mismo resultado, no está lista.

---

## Especialización en metadatos de migración

> Contenido consolidado desde el skill `experto-metadatos-migracion`.

### Principio

Los metadatos heredados siempre están sucios y no puedes confiar en ellos ciegamente. Si la basura entra en el nuevo sistema sin filtro, la búsqueda no servirá de nada y el proyecto fallará.

### Responsabilidades adicionales

- **Auditoría de Origen:** Analizar en profundidad el estado, formato y anomalías de los metadatos en los sistemas de origen (Procomún legacy, repositorios institucionales vía OAI-PMH, Dublin Core, LOM-ES).
- **Mapeo (Crosswalking):** Crear tablas de equivalencia precisas entre esquemas antiguos y el nuevo esquema mínimo/extendido de Procomeka. Decidir qué pasa con campos depreciados.
- **Limpieza de Datos:** Diseñar e implementar reglas para corregir strings mal codificados (ej. mojibake), URLs rotas, etiquetas redundantes y formatos inconsistentes (mayúsculas, fechas inválidas).
- **Deduplicación avanzada:** Establecer algoritmos, heurísticas o hash/identificadores para detectar y consolidar registros que representan el mismo recurso (ej. el mismo PDF subido 5 veces).
- **Enriquecimiento:** Proponer formas de rellenar lagunas en metadatos críticos (ej. derivar el área de conocimiento desde el título, usar taxonomías estandarizadas en lugar de texto libre).
- **Estrategia ETL:** Diseñar los flujos ETL (Extraer, Transformar, Cargar), manejando cargas masivas con `Bun` u otras herramientas, sin tirar la base de datos y manteniendo logs de fallos granulares por registro.

### Entregables adicionales

- Documentos de mapeo de metadatos (ej. de LOM-ES a JSON Schema Procomeka).
- Reglas de validación, limpieza y estandarización (expresiones regulares, listas de control de vocabularios).
- Scripts base de validación y limpieza tipados (`Bun`/TypeScript).
- Informe técnico de estrategias de deduplicación.
- Plan de migración por lotes (estrategia de rollback, control de errores).
- Procedimiento para revisar lotes de importación fallidos e intentar su reprocesamiento.

---

## Bun: Patrones concretos para ingestas

> Referencia: documentación oficial de Bun (runtime/file-io, runtime/sql, runtime/utils, guides/read-file/stream, guides/write-file/stream).

### Lectura de archivos con Bun.file()

`Bun.file()` crea una referencia lazy al archivo. No lee nada hasta que se invoque un método de consumo:

```typescript
const archivo = Bun.file("export_procomun.json");

// Metadatos sin leer contenido
console.log(archivo.size);  // bytes
console.log(archivo.type);  // MIME type
console.log(await archivo.exists()); // boolean

// Leer completo (archivos pequeños/medianos)
const texto = await archivo.text();         // string
const datos = await archivo.json();         // objeto parseado
const bytes = await archivo.bytes();        // Uint8Array
const buffer = await archivo.arrayBuffer(); // ArrayBuffer
```

### Streaming de archivos grandes

Para archivos CSV o JSON de gran volumen, usar `file.stream()` para procesar por chunks sin cargar todo en memoria. Cada chunk es un `Uint8Array`:

```typescript
const archivo = Bun.file("recursos_500mb.csv");
const stream = archivo.stream();

const decoder = new TextDecoder();
let buffer = "";

for await (const chunk of stream) {
  buffer += decoder.decode(chunk, { stream: true });
  const lineas = buffer.split("\n");
  buffer = lineas.pop() ?? ""; // última línea incompleta queda en buffer

  for (const linea of lineas) {
    await procesarRegistro(parsearCSV(linea));
  }
}
```

### Utilidades de conversión de streams

Bun ofrece funciones auxiliares para consumir un `ReadableStream` completo en distintos formatos:

```typescript
const response = await fetch("https://api.externa.edu/recursos");
const stream = response.body!;

const texto = await Bun.readableStreamToText(stream);
const json  = await Bun.readableStreamToJSON(stream);
const bytes = await Bun.readableStreamToBytes(stream);   // Uint8Array
const blob  = await Bun.readableStreamToBlob(stream);
const items = await Bun.readableStreamToArray(stream);   // unknown[]
```

### Escritura de archivos e informes

```typescript
// Escribir string, Uint8Array, Blob o Response
await Bun.write("informe_lote_042.json", JSON.stringify(informe, null, 2));

// Escribir desde un ReadableStream
const stream: ReadableStream = generarInformeStream();
await Bun.write("informe_streaming.csv", new Response(stream));
```

### Driver PostgreSQL nativo de Bun

Bun incluye un driver SQL nativo con prepared statements automáticos y connection pooling. No requiere dependencias externas:

```typescript
import { SQL } from "bun";

const sql = new SQL({
  url: "postgres://user:pass@localhost:5432/procomeka",
  max: 20,               // conexiones máximas en pool
  idleTimeout: 30,       // cerrar conexiones ociosas tras 30s
  connectionTimeout: 30, // timeout al establecer conexión
  onconnect: (client) => {
    console.log("Conexión PostgreSQL establecida");
  },
});
```

### Inserciones masivas (bulk insert)

Pasar un array de objetos al template literal expande automáticamente a un `INSERT INTO ... VALUES` multi-fila. Bun genera prepared statements, evitando inyección SQL:

```typescript
const recursos = [
  { titulo: "Fracciones", nivel: "primaria", materia: "matematicas" },
  { titulo: "Volcanes", nivel: "secundaria", materia: "ciencias" },
  { titulo: "Poesía barroca", nivel: "bachillerato", materia: "lengua" },
];

// Se expande a: INSERT INTO recursos (titulo, nivel, materia) VALUES ($1,$2,$3), ($4,$5,$6), ...
await sql`INSERT INTO recursos ${sql(recursos)}`;
```

### Transacciones para lotes

Usar `sql.begin()` para ejecutar un lote dentro de una transacción. Si cualquier operación falla, se hace rollback automático:

```typescript
await sql.begin(async (tx) => {
  for (const lote of dividirEnLotes(registros, 500)) {
    await tx`INSERT INTO recursos ${tx(lote)}`;
    await tx`INSERT INTO log_ingesta ${tx(
      lote.map((r) => ({ recurso_id: r.id, estado: "ok", lote_id: loteActual }))
    )}`;
  }
});
```

### Arrays de PostgreSQL

Para campos multivalor (etiquetas, niveles educativos), usar `sql.array()` que genera literales `ARRAY[...]` de PostgreSQL:

```typescript
await sql`
  INSERT INTO recursos (titulo, etiquetas)
  VALUES (${"Geometría"}, ${sql.array(["matemáticas", "figuras", "primaria"])})
`;

// Consulta con ANY
await sql`
  SELECT * FROM recursos
  WHERE ${"primaria"} = ANY(niveles)
`;
```

### Patrón completo de pipeline ETL

```typescript
import { SQL } from "bun";

const sql = new SQL("postgres://user:pass@localhost:5432/procomeka");

async function ejecutarIngesta(ruta: string) {
  const archivo = Bun.file(ruta);
  const datos: RegistroOrigen[] = await archivo.json();

  const validados: RegistroDestino[] = [];
  const errores: ErrorIngesta[] = [];

  for (const registro of datos) {
    const resultado = esquemaZod.safeParse(transformar(registro));
    if (resultado.success) {
      validados.push(resultado.data);
    } else {
      errores.push({ registro, errores: resultado.error.issues });
    }
  }

  // Insertar en lotes transaccionales de 500 registros
  const TAMANO_LOTE = 500;
  for (let i = 0; i < validados.length; i += TAMANO_LOTE) {
    const lote = validados.slice(i, i + TAMANO_LOTE);
    await sql.begin(async (tx) => {
      await tx`INSERT INTO recursos ${tx(lote)}`;
    });
  }

  // Generar informe de resultados
  const informe = {
    total: datos.length,
    insertados: validados.length,
    errores: errores.length,
    detalle_errores: errores,
  };
  await Bun.write("informe_ingesta.json", JSON.stringify(informe, null, 2));

  return informe;
}
```
