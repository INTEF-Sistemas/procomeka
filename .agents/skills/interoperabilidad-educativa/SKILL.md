---
name: interoperabilidad-educativa
description: Rol de Interoperabilidad Educativa. Usa este skill para diseñar integraciones con otros sistemas educativos, definir formatos de exportación, cosecha OAI-PMH, APIs públicas y conectores con plataformas LMS.
metadata:
  author: procomeka
  version: "1.0"
---

> Última actualización: 2026-03-28

# Skill: Interoperabilidad Educativa

## Rol

Actúas como arquitecto/a de interoperabilidad del proyecto.

## Misión

Permitir que la plataforma intercambie recursos, metadatos y señales con otros sistemas educativos de forma estándar y observable.

## Estándares a contemplar

| Estándar | Uso |
|----------|-----|
| **OAI-PMH** | Cosecha de metadatos entre repositorios |
| **Dublin Core** | Metadatos básicos interoperables |
| **LOM / IEEE 1484** | Metadatos de objetos de aprendizaje |
| **JSON-LD + Schema.org** | Metadatos estructurados web |
| **xAPI / Tin Can** | Trazas de aprendizaje |
| **IMS LTI** | Integración con LMS (Moodle, Canvas) |
| **SCORM / AICC** | Paquetes de contenido legacy |
| **RSS / Atom** | Sindicación básica |
| **ResourceSync** | Sincronización incremental de repositorios |

## Debes contemplar siempre

- Importación: qué formatos acepta el sistema
- Exportación: qué formatos ofrece el sistema
- Cosecha: protocolo OAI-PMH como mínimo
- Sindicación: feeds RSS/Atom para colecciones
- Identificadores persistentes: DOI, Handle, ARK o URI propio
- Trazabilidad de procedencia: de dónde viene cada recurso
- Versionado de API: cómo evolucionan los contratos

## Entregables

- Inventario de integraciones necesarias
- Contratos por integración (formato, autenticación, frecuencia)
- Estrategia de identificadores persistentes
- Plan de autenticación para APIs públicas y privadas
- Plan de pruebas de integración

## Regla

No diseñes integraciones opacas. Toda integración debe ser observable (logs, métricas), versionable y documentada. Una integración sin tests de contrato no está lista.

---

## Patrones de implementación con Hono

> Referencia: documentación oficial de Hono (routing, middleware, helpers) y especificaciones OAI-PMH 2.0, Dublin Core, RSS 2.0.

### OAI-PMH: Estructura de rutas

OAI-PMH usa un único endpoint con el parámetro `verb` que determina la operación. Implementar como un solo handler GET que despacha por verbo:

```typescript
import { Hono } from "hono";

const oai = new Hono();

oai.get("/oai", async (c) => {
  const verb = c.req.query("verb");

  switch (verb) {
    case "Identify":
      return c.body(generarIdentify(), 200, {
        "Content-Type": "text/xml; charset=utf-8",
      });

    case "ListMetadataFormats":
      return c.body(generarListMetadataFormats(), 200, {
        "Content-Type": "text/xml; charset=utf-8",
      });

    case "ListRecords": {
      const metadataPrefix = c.req.query("metadataPrefix") ?? "oai_dc";
      const from = c.req.query("from");
      const until = c.req.query("until");
      const resumptionToken = c.req.query("resumptionToken");
      return c.body(
        await generarListRecords({ metadataPrefix, from, until, resumptionToken }),
        200,
        { "Content-Type": "text/xml; charset=utf-8" }
      );
    }

    case "GetRecord": {
      const identifier = c.req.query("identifier");
      const metadataPrefix = c.req.query("metadataPrefix") ?? "oai_dc";
      if (!identifier) {
        return c.body(generarErrorOAI("badArgument", "identifier is required"), 200, {
          "Content-Type": "text/xml; charset=utf-8",
        });
      }
      return c.body(
        await generarGetRecord(identifier, metadataPrefix),
        200,
        { "Content-Type": "text/xml; charset=utf-8" }
      );
    }

    case "ListIdentifiers": {
      const from = c.req.query("from");
      const until = c.req.query("until");
      const resumptionToken = c.req.query("resumptionToken");
      return c.body(
        await generarListIdentifiers({ from, until, resumptionToken }),
        200,
        { "Content-Type": "text/xml; charset=utf-8" }
      );
    }

    case "ListSets":
      return c.body(await generarListSets(), 200, {
        "Content-Type": "text/xml; charset=utf-8",
      });

    default:
      return c.body(
        generarErrorOAI("badVerb", `Unknown verb: ${verb}`),
        200,
        { "Content-Type": "text/xml; charset=utf-8" }
      );
  }
});
```

### OAI-PMH: Identify response

```typescript
function generarIdentify(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>${new Date().toISOString()}</responseDate>
  <request verb="Identify">${BASE_URL}/oai</request>
  <Identify>
    <repositoryName>Procomeka - Recursos Educativos Abiertos</repositoryName>
    <baseURL>${BASE_URL}/oai</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>admin@procomeka.educacion.gob.es</adminEmail>
    <earliestDatestamp>${EARLIEST_DATE}</earliestDatestamp>
    <deletedRecord>transient</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
  </Identify>
</OAI-PMH>`;
}
```

### OAI-PMH: resumptionToken para paginación

OAI-PMH exige `resumptionToken` para conjuntos de resultados grandes. Codificar cursor y filtros en el token:

```typescript
interface ResumptionState {
  offset: number;
  from?: string;
  until?: string;
  set?: string;
  metadataPrefix: string;
}

function codificarToken(state: ResumptionState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

function decodificarToken(token: string): ResumptionState {
  return JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
}
```

### Dublin Core: Mapeo de campos internos a DC

Tabla de equivalencia entre el esquema interno de Procomeka y Dublin Core (elementos obligatorios y opcionales):

| Campo Procomeka | Elemento DC | Notas |
|-----------------|-------------|-------|
| `titulo` | `dc:title` | Obligatorio |
| `descripcion` | `dc:description` | Obligatorio |
| `autor` | `dc:creator` | Puede ser múltiple |
| `materia` | `dc:subject` | Repetible; usar vocabulario controlado |
| `fecha_publicacion` | `dc:date` | Formato ISO 8601 |
| `tipo_recurso` | `dc:type` | Usar DCMI Type Vocabulary |
| `formato` | `dc:format` | MIME type del recurso |
| `idioma` | `dc:language` | Código ISO 639 |
| `licencia` | `dc:rights` | URI de Creative Commons |
| `url_recurso` | `dc:identifier` | URI persistente |
| `fuente` | `dc:source` | Repositorio de origen |
| `nivel_educativo` | `dc:audience` | Extensión DC Terms |
| `relacion` | `dc:relation` | Enlaces a recursos relacionados |

Función de serialización a Dublin Core XML:

```typescript
function recursoADublinCore(recurso: Recurso): string {
  const campos = [
    `<dc:title>${escaparXml(recurso.titulo)}</dc:title>`,
    `<dc:description>${escaparXml(recurso.descripcion)}</dc:description>`,
    ...recurso.autores.map((a) => `<dc:creator>${escaparXml(a)}</dc:creator>`),
    ...recurso.materias.map((m) => `<dc:subject>${escaparXml(m)}</dc:subject>`),
    `<dc:date>${recurso.fechaPublicacion}</dc:date>`,
    `<dc:type>${recurso.tipoRecurso}</dc:type>`,
    `<dc:format>${recurso.formato}</dc:format>`,
    `<dc:language>${recurso.idioma}</dc:language>`,
    `<dc:rights>${recurso.licencia}</dc:rights>`,
    `<dc:identifier>${recurso.url}</dc:identifier>`,
  ];

  return `<oai_dc:dc
    xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
    xmlns:dc="http://purl.org/dc/elements/1.1/">
  ${campos.join("\n  ")}
</oai_dc:dc>`;
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

### RSS 2.0: Feed de colecciones

```typescript
const rss = new Hono();

rss.get("/feed/:coleccion", async (c) => {
  const coleccion = c.req.param("coleccion");
  const recursos = await obtenerRecursosColeccion(coleccion, { limit: 50 });

  const items = recursos
    .map(
      (r) => `
    <item>
      <title>${escaparXml(r.titulo)}</title>
      <link>${BASE_URL}/recursos/${r.id}</link>
      <description>${escaparXml(r.descripcion)}</description>
      <pubDate>${new Date(r.fechaPublicacion).toUTCString()}</pubDate>
      <guid isPermaLink="true">${BASE_URL}/recursos/${r.id}</guid>
      <dc:creator>${escaparXml(r.autor)}</dc:creator>
      <dc:subject>${escaparXml(r.materia)}</dc:subject>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Procomeka - ${escaparXml(coleccion)}</title>
    <link>${BASE_URL}/colecciones/${coleccion}</link>
    <description>Recursos educativos abiertos de ${escaparXml(coleccion)}</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed/${coleccion}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return c.body(xml, 200, {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});
```

### LOM-XML: Estrategia de parsing

Para importar metadatos LOM (IEEE 1484.12.1) desde repositorios externos, usar el DOM parser disponible en Bun para archivos de tamaño moderado. Para archivos LOM muy grandes, procesar con streaming XML (SAX):

```typescript
// Parsing DOM para archivos LOM individuales (< 10 MB)
async function parsearLOM(xmlTexto: string): Promise<MetadatosLOM> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlTexto, "text/xml");

  const texto = (tag: string): string =>
    doc.querySelector(tag)?.textContent?.trim() ?? "";

  const textos = (tag: string): string[] =>
    Array.from(doc.querySelectorAll(tag)).map((el) => el.textContent?.trim() ?? "");

  return {
    titulo: texto("lom\\:general > lom\\:title > lom\\:string"),
    descripcion: texto("lom\\:general > lom\\:description > lom\\:string"),
    idiomas: textos("lom\\:general > lom\\:language"),
    palabrasClave: textos("lom\\:general > lom\\:keyword > lom\\:string"),
    autor: texto("lom\\:lifeCycle > lom\\:contribute > lom\\:entity"),
    fecha: texto("lom\\:lifeCycle > lom\\:contribute > lom\\:date > lom\\:dateTime"),
    formato: texto("lom\\:technical > lom\\:format"),
    ubicacion: texto("lom\\:technical > lom\\:location"),
    nivelEducativo: texto(
      "lom\\:educational > lom\\:context > lom\\:value > lom\\:langstring"
    ),
    licencia: texto("lom\\:rights > lom\\:description > lom\\:string"),
  };
}
```

Para namespaces LOM-ES (variante española), los selectores cambian al namespace `lomes:`. Mantener un mapa de selectores configurable para soportar ambas variantes:

```typescript
const SELECTORES = {
  lom: {
    titulo: "lom\\:general > lom\\:title > lom\\:string",
    descripcion: "lom\\:general > lom\\:description > lom\\:string",
    // ...
  },
  lomEs: {
    titulo: "lomes\\:general > lomes\\:title > lomes\\:string",
    descripcion: "lomes\\:general > lomes\\:description > lomes\\:string",
    // ...
  },
};
```

### Negociación de contenido

Middleware para servir el mismo recurso en distintos formatos según el header `Accept`:

```typescript
import { Hono } from "hono";

const recursos = new Hono();

recursos.get("/recursos/:id", async (c) => {
  const id = c.req.param("id");
  const recurso = await obtenerRecurso(id);
  if (!recurso) return c.notFound();

  const accept = c.req.header("Accept") ?? "application/json";

  if (accept.includes("application/xml") || accept.includes("text/xml")) {
    return c.body(recursoADublinCore(recurso), 200, {
      "Content-Type": "application/xml; charset=utf-8",
    });
  }

  if (accept.includes("application/ld+json")) {
    return c.json(recursoAJsonLd(recurso));
  }

  // Default: JSON
  return c.json(recursoAJson(recurso));
});
```
