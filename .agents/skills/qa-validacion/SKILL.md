---
name: qa-validacion
description: Rol de QA y Validación. Usa este skill para diseñar planes de prueba, criterios de aceptación, casos de prueba funcionales, pruebas de accesibilidad y validación de migraciones de datos.
metadata:
  author: procomeka
  version: "2.0"
---

# Skill: QA y Validación

Última actualización: 2026-03-28

## Rol

Actúas como QA lead del proyecto.

## Misión

Verificar que lo construido cumple requisitos, no rompe lo existente y mantiene calidad funcional, técnica y editorial.

## Stack de pruebas

- **Unit / Integration**: `bun test` (runner nativo)
- **E2E**: Playwright (TypeScript)
- **Accesibilidad**: `@axe-core/playwright`, Lighthouse
- **Rendimiento**: Lighthouse CI, k6 para carga
- **API**: Tests de integración con `bun test` usando `app.request()`
- **Linting/Formato**: Biome (se valida en CI antes de tests)

## Bun test runner: referencia concreta

### Lifecycle hooks

Bun soporta cuatro hooks. Se importan desde `bun:test`:

```typescript
import { beforeAll, afterAll, beforeEach, afterEach, describe, test, expect } from "bun:test";

beforeAll(async () => {
  // Se ejecuta una vez antes de todos los tests del archivo.
  // Aquí se inicializan recursos compartidos (DB, servidor).
});

afterAll(async () => {
  // Se ejecuta una vez tras todos los tests. Limpieza final.
});

beforeEach(() => {
  // Antes de cada test individual. Restablecer estado.
});

afterEach(() => {
  // Después de cada test. Limpiar mocks, cerrar conexiones.
});
```

Los hooks admiten `async/await`. El test espera a que el hook async resuelva antes de continuar.

Los hooks también pueden definirse en un archivo separado y cargarse con `preload` en `bunfig.toml` (ver sección de configuración).

### Matchers de expect

Bun implementa los matchers de Jest. Los más usados en este proyecto:

- `expect(value).toBe(expected)` — igualdad estricta (===)
- `expect(value).toEqual(expected)` — igualdad profunda de objetos
- `expect(value).toBeTruthy()` / `.toBeFalsy()`
- `expect(value).toBeNull()` / `.toBeDefined()` / `.toBeUndefined()`
- `expect(value).toContain(item)` — arrays y strings
- `expect(value).toMatchObject(subset)` — objeto contiene las propiedades esperadas
- `expect(value).toThrow(message?)` — funciones que lanzan error
- `expect(value).toHaveLength(n)`
- `expect(promise).resolves.toBe(x)` / `.rejects.toThrow()`
- `expect(spy).toHaveBeenCalledTimes(n)`
- `expect(spy).toHaveBeenCalledWith(...args)`

### Mock y Spy API

**Funciones mock:**

```typescript
import { mock } from "bun:test";

const fn = mock(() => 42);
fn();
expect(fn).toHaveBeenCalledTimes(1);
expect(fn.mock.calls).toEqual([[]]);
```

**Espiar métodos existentes:**

```typescript
import { spyOn } from "bun:test";

const obj = { greet: (name: string) => `Hola ${name}` };
const spy = spyOn(obj, "greet");

obj.greet("Ana");
expect(spy).toHaveBeenCalledWith("Ana");
expect(spy.mock.calls).toEqual([["Ana"]]);
```

**Mockear módulos completos con `mock.module()`:**

```typescript
import { mock } from "bun:test";

mock.module("./api-client", () => ({
  fetchUser: mock(() => Promise.resolve({ id: 1, name: "Test User" })),
  createUser: mock(() => Promise.resolve({ id: 2 })),
}));
```

**Restaurar todos los mocks:**

```typescript
import { afterEach, mock } from "bun:test";

afterEach(() => {
  mock.restore(); // Restaura todos los mocks y spies
});
```

### Configuración en bunfig.toml

Configuración actual del proyecto:

```toml
[test]
preload = ["./apps/api/src/test-setup.ts"]
```

Opciones disponibles para ampliar:

```toml
[test]
# Preload: scripts que se ejecutan antes de todos los tests
preload = ["./apps/api/src/test-setup.ts"]

# Timeout por test (ms)
timeout = 10000

# Coverage
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "./coverage"
coverageThreshold = { lines = 0.90, functions = 0.90, statements = 0.80 }
coverageSkipTestFiles = true
coveragePathIgnorePatterns = [
  "**/*.test.ts",
  "**/*.spec.ts",
  "*.config.*",
  "scripts/**",
  "generated/**"
]
```

El `coverageThreshold` acepta un número global (ej. `0.9`) o un objeto granular con `lines`, `functions` y `statements`. Si el coverage cae por debajo del umbral, `bun test` sale con código de error distinto de cero.

### Ejecución y filtrado

```bash
# Ejecutar todos los tests
bun test

# Filtrar por nombre de test (--grep acepta regex)
bun test --grep "recurso publicado"

# Filtrar por ruta de archivo
bun test apps/api/src/resources/

# Watch mode: re-ejecuta al detectar cambios
bun test --watch

# Con coverage
bun test --coverage

# Parar tras N fallos
bun test --bail=1

# Timeout personalizado
bun test --timeout 15000
```

## Patrones de test en este proyecto

### Convención de nombres

- Tests unitarios: `*.unit.test.ts`
- Tests de integración: `*.integration.test.ts` (si aplica)
- Tests E2E: `e2e/*.spec.ts`

Los scripts `test:unit` y `test:integration` del `package.json` delegan en `scripts/run-bun-suite.ts` que busca archivos con el sufijo correspondiente.

### Testing de rutas Hono con app.request()

Las rutas HTTP se testean sin levantar un servidor, invocando directamente `app.request()`:

```typescript
import { expect, test, describe, beforeAll } from "bun:test";
import { app } from "./index.ts";

describe("GET /api/resources/:slug", () => {
  test("devuelve 200 para recurso publicado", async () => {
    const res = await app.request(`/api/resources/${publishedSlug}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ title: expect.any(String) });
  });

  test("devuelve 404 para slug inexistente", async () => {
    const res = await app.request("/api/resources/no-existe");
    expect(res.status).toBe(404);
  });
});
```

Este patrón es rápido y no requiere puerto abierto. Los headers, body y método se pasan como segundo argumento de `app.request()`:

```typescript
const res = await app.request("/api/resources", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Nuevo recurso" }),
});
```

### Aislamiento de PGlite con preload

El archivo `apps/api/src/test-setup.ts` se ejecuta antes de todos los tests gracias a `preload` en `bunfig.toml`. Su función:

1. Espera a que PGlite inicialice las tablas (`waitForDb()`).
2. Crea usuarios de test (admin, system) que los tests referencian.

Esto garantiza que cada ejecución de `bun test` parte de un estado de base de datos limpio y predecible sin necesidad de un PostgreSQL externo.

### Patrón de test para repositorios/servicios

```typescript
import { describe, test, expect, beforeAll } from "bun:test";
import { createResource } from "./resources/repository.ts";

describe("createResource", () => {
  test("crea recurso con campos obligatorios", async () => {
    const resource = await createResource({
      title: "Test",
      description: "Descripción",
      language: "es",
      license: "cc-by",
      resourceType: "documento",
    });
    expect(resource.id).toBeDefined();
    expect(resource.slug).toContain("test");
  });
});
```

## Playwright: referencia concreta para E2E

### Configuración del proyecto

Archivo `playwright.config.ts` actual:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  use: {
    headless: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
  ],
});
```

Opciones recomendadas para ampliar:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  // Ejecución paralela de tests
  fullyParallel: true,

  // En CI: error si queda test.only; reintentos automáticos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // Workers: 1 en CI para estabilidad, auto en local
  workers: process.env.CI ? 1 : undefined,

  // Reporters: HTML para local, JSON/list para CI
  reporter: [
    ["html"],
    ["list"],
    ["json", { outputFile: "test-results.json" }],
  ],

  timeout: 30000,

  use: {
    headless: true,
    baseURL: "http://localhost:3000",
    // Capturar artefactos en caso de fallo
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],

  // Levantar el servidor automáticamente antes de los tests
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Estrategia de locators (prioridad)

Playwright recomienda locators basados en accesibilidad. Orden de preferencia:

1. **`page.getByRole()`** — El mejor. Refleja cómo interactúan usuarios y tecnologías asistivas.
   ```typescript
   await page.getByRole("button", { name: "Publicar recurso" }).click();
   await page.getByRole("heading", { name: "Catálogo" });
   await page.getByRole("link", { name: "Ver recurso" });
   ```

2. **`page.getByLabel()`** — Para campos de formulario.
   ```typescript
   await page.getByLabel("Título del recurso").fill("Mi recurso");
   ```

3. **`page.getByPlaceholder()`** — Cuando no hay label.
   ```typescript
   await page.getByPlaceholder("Buscar recursos...").fill("matemáticas");
   ```

4. **`page.getByText()`** — Para contenido visible.
   ```typescript
   await page.getByText("Publicado").isVisible();
   ```

5. **`page.getByTestId()`** — Último recurso. Requiere `data-testid` en el HTML.
   ```typescript
   await page.getByTestId("resource-card").first().click();
   ```

**Evitar**: selectores CSS frágiles (`page.locator(".btn-primary")`) o XPath. Se rompen fácilmente con cambios de diseño.

### Auto-waiting

Playwright espera automáticamente a que los elementos sean visibles, habilitados y estables antes de interactuar. No usar `waitForTimeout()` ni `sleep()`. Las assertions web-first (`expect(locator).toBeVisible()`) también reintentan automáticamente hasta el timeout.

### Fixtures pattern

Los fixtures permiten compartir setup entre tests de forma aislada:

```typescript
import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

type MyFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@test.com");
    await page.getByLabel("Contraseña").fill("password");
    await page.getByRole("button", { name: "Entrar" }).click();
    await use(page);
  },
});

export { expect };
```

### Page Object Model

Encapsular interacciones de cada página en una clase:

```typescript
import type { Page, Locator } from "@playwright/test";

export class ResourcePage {
  private readonly titleInput: Locator;
  private readonly saveButton: Locator;

  constructor(public readonly page: Page) {
    this.titleInput = page.getByLabel("Título del recurso");
    this.saveButton = page.getByRole("button", { name: "Guardar" });
  }

  async goto(slug: string) {
    await this.page.goto(`/recursos/${slug}/editar`);
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async save() {
    await this.saveButton.click();
  }
}
```

### Testing de accesibilidad con @axe-core/playwright

Crear un fixture reutilizable para ejecutar auditorías de accesibilidad:

```typescript
import { test as base } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
      ]);
    await use(makeAxeBuilder);
  },
});
export { expect } from "@playwright/test";
```

Uso en un test:

```typescript
test("página de catálogo cumple WCAG 2.2 AA", async ({ page, makeAxeBuilder }) => {
  await page.goto("/catalogo");
  const results = await makeAxeBuilder().analyze();
  expect(results.violations).toEqual([]);
});
```

### Visual regression con toHaveScreenshot()

```typescript
test("ficha de recurso mantiene diseño", async ({ page }) => {
  await page.goto("/recursos/mi-recurso");
  await expect(page).toHaveScreenshot();
  // También por componente:
  await expect(page.getByTestId("resource-header")).toHaveScreenshot();
});
```

La primera ejecución genera screenshots de referencia. Las siguientes comparan pixel a pixel. Configurar tolerancia en `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: { maxDiffPixels: 100 },
},
```

### Network mocking con route()

```typescript
test("muestra error cuando la API falla", async ({ page }) => {
  await page.route("**/api/resources**", (route) =>
    route.fulfill({ status: 500, body: "Internal Server Error" }),
  );
  await page.goto("/catalogo");
  await expect(page.getByText("Error al cargar")).toBeVisible();
});
```

## Estrategia de coverage

### Umbrales actuales

El proyecto exige **90% de cobertura de líneas** (verificado por `scripts/check-coverage.ts`). El script ejecuta `bun test --coverage` y parsea la salida para validar el umbral.

### Qué medir

- **Líneas**: umbral 90%. Métrica principal.
- **Funciones**: umbral 90%. Garantiza que no hay funciones sin testear.
- **Statements**: umbral 80%. Más flexible para código defensivo.

### Qué excluir del coverage

- Archivos de configuración (`*.config.ts`, `*.config.js`)
- Archivos de test (`**/*.test.ts`, `**/*.spec.ts`)
- Código generado (`generated/**`)
- Scripts de utilidad (`scripts/**`)
- Tipos puros (solo interfaces y types)

### Configuración recomendada en bunfig.toml

```toml
[test]
preload = ["./apps/api/src/test-setup.ts"]
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "./coverage"
coverageThreshold = { lines = 0.90, functions = 0.90, statements = 0.80 }
coverageSkipTestFiles = true
coveragePathIgnorePatterns = [
  "**/*.test.ts",
  "**/*.spec.ts",
  "*.config.*",
  "scripts/**",
  "generated/**"
]
```

## Qué debes validar siempre

| Área | Qué probar |
|------|-----------|
| Criterios de aceptación | Cada requisito tiene al menos un test |
| Regresión | Los flujos existentes siguen funcionando |
| Flujos editoriales | Crear, editar, cambiar estado, publicar recurso |
| Flujos públicos | Buscar, filtrar, ver ficha, descargar |
| Accesibilidad | WCAG 2.2 AA sin errores axe en cada página |
| Datos y metadatos | Importación sin pérdida ni corrupción |
| Permisos | Cada rol solo accede a lo que le corresponde |
| Búsqueda | Resultados relevantes, facetas correctas |
| Rendimiento | LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| Coverage | >= 90% líneas, >= 90% funciones |

## Plantilla de plan de pruebas

```
## Feature a validar
## Criterios de aceptación
## Casos de prueba
| ID | Descripción | Tipo | Entrada | Resultado esperado | Estado |

## Incidencias encontradas
| ID | Descripción | Severidad | Estado |

## Recomendación
[ ] Listo para release
[ ] Requiere corrección
[ ] Bloqueado
```

## Ejecución de pruebas

### Tests unitarios y de integración (bun test)

```bash
make test              # unit + integration + coverage check
make test-unit         # solo unitarios
make test-integration  # solo integración
make check-coverage    # ejecuta tests con coverage y valida umbral 90%
```

### Tests E2E (Playwright)

```bash
make test-e2e            # chromium
make test-e2e-firefox    # firefox
make test-e2e-postgres   # entorno completo con PostgreSQL en Docker
```

Se espera que todas las features críticas estén cubiertas por tests E2E que pasen en Chromium. Para validaciones exhaustivas antes de release, usar el entorno PostgreSQL completo.

## Regla

Una feature no está terminada si no puede demostrarse su comportamiento esperado mediante pruebas reproducibles. "Funciona en mi máquina" no cuenta. Toda tarea de código requiere tests automatizados y `bun test` exitoso antes de marcarla como completada.
