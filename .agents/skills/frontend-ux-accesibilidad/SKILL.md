---
name: frontend-ux-accesibilidad
description: Rol de Frontend Lead, UX y Accesibilidad. Usa este skill para diseñar la experiencia pública y editorial de la plataforma, incluyendo descubrimiento, facetas, ficha de recurso, curación pública, búsqueda y navegación.
metadata:
  author: procomeka
  version: "1.1"
  última actualización: 2026-03-28
---

# Skill: Frontend, UX y Accesibilidad

## Rol

Actúas como Frontend Lead y diseñador/a UX/Accesibilidad del proyecto Procomeka. El proyecto tiene mucha carga de descubrimiento, facetas, ficha de recurso y curación pública; no es un frontend trivial.

## Misión

Construir una experiencia clara, accesible y rápida tanto para la parte pública (profesorado, ciudadanía) como para la editorial (curadores, administradores). Tienes como objetivo crear un producto donde la búsqueda simple, la avanzada, la navegación por facetas, la exploración temática y la gestión de cero resultados sean capacidades maduras y altamente usables.

## Stack frontend

Astro es el framework frontend adoptado (ADR-0004). Los componentes interactivos se implementan como islas con hidratación selectiva. Todo el código es TypeScript strict sobre Bun.

Para uploads resumibles se usa Uppy con el plugin Tus (ADR-0011), integrado como script de cliente dentro de las páginas Astro del backoffice editorial.

## Principios de diseño

- **Lenguaje claro**: vocabulario del profesorado, no jerga técnica
- **Consistencia visual**: sistema de diseño compartido entre vistas
- **Flujos simples**: máximo 3 pasos para cualquier acción principal
- **Accesibilidad WCAG 2.2 AA** como mínimo
- **Responsive**: móvil, tablet, escritorio
- **Feedback de estado**: carga, éxito, error, vacío (especial atención a los cero resultados en búsquedas)
- **Rendimiento**: Core Web Vitals en verde

## Debes garantizar

- **Navegación Intuitiva**: Comprensible sin conocimiento previo del sistema.
- **Búsqueda Avanzada y Facetas**: Filtros claros, veloces y útiles, que reduzcan el catálogo de cientos de miles de recursos a lo que el docente necesita.
- **Ficha de Recurso**: Lectura confortable, con todos los metadatos relevantes expuestos de forma digerible, y llamadas a la acción (descargar, integrar, reportar) muy claras.
- **Curación Pública y Temática**: Exposición elegante de colecciones, recorridos temáticos y recursos destacados.
- **Experiencia Editorial**: Formularios de edición sin fricción y flujos ágiles para las curadoras/administradoras.

---

## Patrones Astro

### Directivas de hidratación (client directives)

Por defecto, los componentes de framework UI en Astro se renderizan como HTML estático sin JavaScript de cliente. Las directivas `client:*` controlan cuándo y cómo se hidrata un componente. Elegir la directiva correcta es clave para el rendimiento.

| Directiva | Cuándo se hidrata | Usar para |
|---|---|---|
| `client:load` | Inmediatamente al cargar la página | Elementos interactivos visibles desde el inicio que necesitan JS al instante: menús desplegables del header, botones de acción principal, formularios con validación en tiempo real |
| `client:idle` | Cuando el navegador está idle (`requestIdleCallback`) | Elementos interactivos de prioridad media que no necesitan funcionar al instante: paneles de filtros colapsables, widgets de valoración, botones de compartir |
| `client:visible` | Cuando el componente entra en el viewport (`IntersectionObserver`) | Elementos below-the-fold o pesados: carruseles de recursos relacionados, gráficos de estadísticas, listas infinitas al final de la página |
| `client:media="(query)"` | Cuando se cumple la media query CSS | Elementos que solo son interactivos en ciertos tamaños: sidebar de facetas que en móvil es un drawer interactivo pero en escritorio es HTML estático |
| `client:only="framework"` | Solo en cliente, sin SSR | Componentes que dependen de APIs del navegador y no pueden renderizarse en servidor (canvas, Web Audio, widgets de terceros sin soporte SSR) |

**Regla del proyecto**: usar `client:load` solo donde sea imprescindible. La mayoría de islas deben usar `client:idle` o `client:visible`. Si un componente no necesita interactividad, no ponerle directiva -- se renderiza como HTML estático.

### Scripts en archivos `.astro`

Los bloques `<script>` en archivos `.astro` se procesan y empaquetan por Astro. Se pueden usar imports de TypeScript directamente:

```astro
<script>
  import { getApiClient } from "../lib/get-api-client.ts";
  import { url } from "../lib/paths.ts";

  const api = await getApiClient();
  // lógica de cliente...
</script>
```

Cada `<script>` se ejecuta una vez por página, se empaqueta automáticamente y se deduplica si el componente se usa varias veces. No es necesario `type="module"`.

Para pasar datos del frontmatter al script de cliente, usar `data-*` en el HTML y leerlos con `querySelector`:

```astro
---
const resourceId = Astro.params.id;
---
<div data-resource-id={resourceId} id="uploader-root">...</div>

<script>
  const root = document.getElementById("uploader-root");
  const resourceId = root?.dataset.resourceId;
</script>
```

No usar `define:vars` para pasar datos complejos -- solo acepta tipos serializables y genera un `<script is:inline>` que no se empaqueta.

### Formularios sin framework JS

Para formularios del backoffice editorial (crear recurso, editar metadatos), usar HTML nativo con `<script>` de Astro en lugar de un framework de islas. Patrón del proyecto:

1. El formulario es HTML estático renderizado por Astro (SSG/SSR).
2. Un `<script>` se encarga de la validación y el envío via `fetch`.
3. Los errores se muestran en `<span>` con `role="alert"` asociados a cada campo via `aria-describedby`.
4. El campo inválido recibe `aria-invalid="true"` y su `<span>` de error se llena con el mensaje.

```astro
<div class="field">
  <label for="title">Título *</label>
  <input type="text" id="title" required aria-describedby="title-error" />
  <span id="title-error" class="field-error" role="alert"></span>
</div>
```

Este patrón evita enviar un framework JS completo al cliente solo para un formulario. El formulario funciona con la semántica nativa del navegador y la accesibilidad se gestiona con ARIA estándar.

---

## TypeScript en Astro

### Props de componentes

Definir siempre una interfaz `Props` en el frontmatter del componente. Astro la usa para tipar `Astro.props`:

```astro
---
import { Image } from "astro:assets";

interface Props {
  imagePath: string;
  altText: string;
  name: string;
  age: number;
}

const { imagePath, altText, name, age } = Astro.props;
---
```

### Inferencia de tipos en rutas dinámicas

Para páginas con `getStaticPaths()`, usar los tipos de utilidad de Astro para inferir los tipos de params y props automáticamente:

```astro
---
import type {
  InferGetStaticParamsType,
  InferGetStaticPropsType,
  GetStaticPaths,
} from "astro";

export const getStaticPaths = (async () => {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { id: post.id },
    props: { draft: post.data.draft, title: post.data.title },
  }));
}) satisfies GetStaticPaths;

type Params = InferGetStaticParamsType<typeof getStaticPaths>;
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

const { id } = Astro.params as Params;
const { title } = Astro.props;
---
```

### Content Collections con esquemas Zod

Las colecciones de contenido se definen en `src/content.config.ts` con `defineCollection`, un loader y un schema Zod. Astro genera tipos TypeScript automáticamente a partir del schema:

```typescript
import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const recursos = defineCollection({
  loader: glob({ base: "./src/content/recursos", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    language: z.string(),
    license: z.string(),
    resourceType: z.string(),
    pubDate: z.coerce.date(),
    keywords: z.array(z.string()).optional(),
  }),
});

export const collections = { recursos };
```

Los datos se consultan con `getCollection("recursos")` o `getEntry("recursos", id)`, ambos tipados.

---

## Optimización de imágenes

### Componente `<Image />`

Usar el componente `<Image />` de `astro:assets` para todas las imágenes. Astro optimiza automáticamente: convierte a WebP, añade `width`, `height`, `decoding="async"` y `loading="lazy"`:

```astro
---
import { Image } from "astro:assets";
import portada from "../assets/portada-recurso.png";
---
<Image src={portada} alt="Descripción del recurso educativo" />
```

El HTML generado incluye los atributos de rendimiento y accesibilidad automáticamente:

```html
<img
  src="/_astro/portada-recurso.hash.webp"
  width="1600"
  height="900"
  decoding="async"
  loading="lazy"
  alt="Descripción del recurso educativo"
/>
```

### Imágenes responsivas con `getImage()`

Para componentes que necesitan variantes (miniatura en tarjeta de recurso, imagen completa en ficha), usar `getImage()`:

```astro
---
import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

interface Props {
  mobileImgUrl: string | ImageMetadata;
  desktopImgUrl: string | ImageMetadata;
  alt: string;
}

const { mobileImgUrl, desktopImgUrl, alt } = Astro.props;

const mobileImg = await getImage({ src: mobileImgUrl, format: "webp", width: 200, height: 200 });
const desktopImg = await getImage({ src: desktopImgUrl, format: "webp", width: 800, height: 200 });
---
<picture>
  <source media="(max-width: 799px)" srcset={mobileImg.src} />
  <source media="(min-width: 800px)" srcset={desktopImg.src} />
  <img src={desktopImg.src} alt={alt} />
</picture>
```

**Regla del proyecto**: toda `<img>` debe tener `alt` descriptivo. Para imágenes decorativas usar `alt=""` y `role="presentation"`. Nunca omitir `alt`.

---

## View Transitions

Para transiciones entre páginas sin recarga completa, Astro ofrece el módulo `astro:transitions`:

```astro
---
import { ClientRouter } from "astro:transitions";
---
<head>
  <ClientRouter />
</head>
```

Animaciones disponibles: `fade` y `slide` desde `astro:transitions`. Se aplican por elemento:

```astro
---
import { fade } from "astro:transitions";
---
<main transition:animate={fade({ duration: '0.2s' })}>
  <slot />
</main>
```

Usar `transition:name` para conectar elementos entre páginas (por ejemplo, la miniatura de una tarjeta de recurso con la imagen de la ficha):

```astro
<!-- En la tarjeta del listado -->
<img transition:name={`recurso-img-${recurso.id}`} src={recurso.thumbnail} alt={recurso.title} />

<!-- En la ficha del recurso -->
<img transition:name={`recurso-img-${recurso.id}`} src={recurso.imagen} alt={recurso.title} />
```

**Precaución**: las View Transitions requieren que los scripts de cliente se re-ejecuten correctamente tras la navegación. Los `<script>` de Astro se manejan automáticamente, pero event listeners manuales sobre `document` pueden necesitar re-binding.

---

## Integración Uppy/Tus para uploads resumibles

### Inicialización

Uppy se inicializa con restricciones obtenidas de la API (ADR-0011). Configuración base del proyecto:

```typescript
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";

const uppy = new Uppy({
  autoProceed: true,
  restrictions: {
    maxFileSize: config.maxFileSizeBytes,
    maxNumberOfFiles: config.maxFilesPerBatch,
    allowedFileTypes: [...config.allowedExtensions, ...config.allowedMimeTypes],
  },
});

uppy.use(Tus, {
  endpoint: "/api/uploads",
  withCredentials: true,
  chunkSize: config.chunkSizeBytes,
  retryDelays: [0, 1000, 3000, 5000],
  allowedMetaFields: ["resourceId", "filename", "mimeType"],
});
```

**Notas clave**:
- `retryDelays: [0, 1000, 3000, 5000]` hace que Uppy reintente automáticamente hasta 4 veces con retardo progresivo. Poner `null` para desactivar reintentos.
- `chunkSize` solo modificar si es estrictamente necesario (ver docs de `tus-js-client`). El valor por defecto es `Infinity` (un solo PATCH).
- `allowedMetaFields` limita qué campos de metadata se envían al servidor tus. Solo incluir los que la API espera.
- `headers` acepta un objeto estático o una función que recibe el archivo y devuelve headers. Usar la función para tokens de autenticación dinámicos:

```typescript
headers: (file) => ({
  authorization: `Bearer ${getToken()}`,
}),
```

### TypeScript con Uppy

Para respuestas tipadas, especialmente en el evento `upload-success`, usar el genérico `TusBody`:

```typescript
import Uppy from "@uppy/core";
import Tus, { type TusBody } from "@uppy/tus";

interface ResourceMeta {
  resourceId: string;
  filename: string;
  mimeType: string;
}

const uppy = new Uppy<ResourceMeta, TusBody>();
```

### Eventos principales

| Evento | Cuándo se dispara | Uso en el proyecto |
|---|---|---|
| `file-added` | Se añade un archivo a la cola | Actualizar la lista visual de archivos en cola |
| `upload-progress` | Progreso parcial de un archivo | Actualizar barra de progreso individual y global |
| `upload-success` | Un archivo se sube con éxito | Mostrar feedback, refrescar lista de uploads persistidos |
| `upload-error` | Un archivo falla | Mostrar error, verificar si es error de red |
| `file-removed` | Se quita un archivo de la cola | Actualizar lista visual |
| `complete` | Toda la cola termina (éxitos y fallos) | Balance final: `result.successful` y `result.failed` |

### Gestión de errores

Distinguir errores de red de otros errores para mostrar mensajes apropiados al usuario:

```typescript
uppy.on("upload-error", (file, error, response) => {
  if (error.isNetworkError) {
    // Posible problema de firewall, ISP o conexión inestable
    feedback.textContent = "Error de conexión. Uppy reintentará automáticamente.";
  } else {
    feedback.textContent = error?.message ?? "Error durante la subida";
  }
});
```

El evento `complete` permite hacer un balance final de la cola completa:

```typescript
uppy.on("complete", (result) => {
  if (result.failed.length > 0) {
    feedback.textContent = `${result.failed.length} archivo(s) fallaron.`;
  }
});
```

### Restricciones de archivos

Las restricciones se configuran al crear la instancia. Los valores se obtienen dinámicamente de la API para mantener consistencia con los límites del servidor:

```typescript
restrictions: {
  maxFileSize: 1000000,          // bytes por archivo individual
  maxNumberOfFiles: 5,           // archivos por lote
  minNumberOfFiles: 1,           // mínimo para iniciar subida
  maxTotalFileSize: 5000000,     // bytes totales del lote
  allowedFileTypes: ["image/*", ".pdf", ".doc", ".docx"],
  requiredMetaFields: ["resourceId"],
}
```

`maxNumberOfFiles` afecta también al diálogo nativo del navegador: con valor `1`, el `<input>` solo permite seleccionar un archivo. `allowedFileTypes` acepta wildcards MIME (`image/*`), tipos exactos (`application/pdf`) o extensiones (`.pdf`).

### Internacionalización de la UI de estado

Para adaptar los textos de progreso al español:

```typescript
uppy.setOptions({
  locale: {
    strings: {
      uploading: "Subiendo",
      complete: "Completado",
      uploadFailed: "La subida falló",
      paused: "Pausado",
      retry: "Reintentar",
      cancel: "Cancelar",
      pause: "Pausar",
      resume: "Reanudar",
      done: "Hecho",
    },
  },
});
```

### Prevención de cierre accidental

Mientras hay uploads activos, interceptar el cierre de pestaña:

```typescript
window.addEventListener("beforeunload", (event) => {
  const hasActive = uppy.getFiles().some(
    (file) => (file.progress?.uploadComplete ?? false) === false
  );
  if (!hasActive) return;
  event.preventDefault();
  event.returnValue = "";
});
```

### Destrucción

Al desmontar el componente o navegar a otra página, llamar siempre a `uppy.destroy()` para liberar recursos y cancelar listeners.

---

## Accesibilidad específica del proyecto

### ARIA en formularios

Patrón obligatorio para campos con validación:

1. Cada `<input>` tiene `aria-describedby` apuntando a su `<span>` de error.
2. El `<span>` de error tiene `role="alert"` para que los lectores de pantalla anuncien errores automáticamente al aparecer.
3. Al fallar la validación, el campo recibe `aria-invalid="true"` y el borde cambia a rojo.
4. Los mensajes globales de éxito usan `role="status"` con `aria-live="polite"`.
5. Los mensajes globales de error usan `role="alert"` con `aria-live="polite"`.

```html
<input type="text" id="title" required aria-describedby="title-error" />
<span id="title-error" class="field-error" role="alert"></span>

<div id="error-message" class="error" role="alert" aria-live="polite" style="display:none;"></div>
<div id="success-message" class="success" role="status" aria-live="polite" style="display:none;"></div>
```

### Semántica HTML

- Usar `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>` correctamente. Cada página tiene un solo `<main>`.
- Los encabezados (`<h1>` a `<h6>`) siguen jerarquía estricta: un solo `<h1>` por página, sin saltar niveles.
- Los listados de recursos usan `<ul>` con `<li>`. Las tablas de datos usan `<table>` con `<thead>`, `<th scope>`.
- Los enlaces de acción usan `<a>` si navegan, `<button>` si ejecutan una acción. Nunca `<div onclick>`.

### Navegación por teclado

- Todos los controles interactivos deben ser alcanzables con Tab.
- Los menús desplegables y drawers de facetas deben gestionar el foco: al abrir, mover el foco al primer elemento; al cerrar con Escape, devolver el foco al activador.
- Los diálogos modales usan `<dialog>` nativo o implementan trap de foco manual.
- Las tarjetas de recurso en el listado: el enlace principal (título) recibe el foco; las acciones secundarias (favorito, compartir) son botones con `aria-label` descriptivo.

### Directivas de hidratación y accesibilidad

Los componentes de framework UI que gestionen foco, anuncios ARIA o navegación por teclado deben usar `client:load` o `client:idle` -- nunca `client:visible`, porque el usuario de lector de pantalla podría interactuar antes de que el componente sea visible en el viewport.

---

## Rendimiento

### Estrategia de hidratación parcial

Astro envía cero JavaScript de cliente por defecto. Cada isla con `client:*` añade JS. Directrices:

1. **Presupuesto de JS**: máximo 50 KB de JS comprimido por página pública. Las páginas editoriales pueden llegar a 100 KB por la integración Uppy.
2. **Mayoría estática**: las páginas de listado, ficha de recurso y colecciones deben tener como mucho 1-2 islas interactivas (filtros, carrusel).
3. **Prioridad de directiva**: `client:visible` > `client:idle` > `client:load`. Usar `client:load` solo para lo imprescindible (header interactivo, auth check).

### Imágenes

- Siempre usar `<Image />` de `astro:assets` para optimización automática (WebP, dimensiones, lazy loading).
- Las miniaturas de tarjetas de recurso deben tener dimensiones explícitas para evitar layout shift (CLS).
- Las imágenes above-the-fold (hero, logo) usan `loading="eager"`. El resto usa `loading="lazy"` (por defecto en `<Image />`).

### Prefetch

Astro soporta prefetch de enlaces con el atributo `data-astro-prefetch`:

```html
<a href="/recurso/123" data-astro-prefetch>Ver recurso</a>
```

Usar prefetch en los enlaces de tarjetas de recurso del listado para que la ficha cargue instantáneamente al hacer clic.

---

## Entregables

- Flujos de usuario y wireframes textuales para descubrimiento, búsqueda (simple/avanzada) y ficha de recurso.
- Arquitectura de la UI para el panel de facetas.
- Decisiones de navegación y comportamiento de estados vacíos (zero results) con justificación.
- Lista de componentes necesarios (ej. tarjetas de recurso, inputs de autocompletado).
- Reglas de accesibilidad específicas del proyecto y criterios de validación UX.

## Regla

La interfaz debe reducir la complejidad del catálogo, no exponerla sin filtrar. Si un flujo necesita explicación, si un filtro de faceta confunde o si la búsqueda simple no devuelve lo esperado a simple vista, el diseño frontend y UX falla.
