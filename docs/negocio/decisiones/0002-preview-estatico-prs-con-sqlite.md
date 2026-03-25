# ADR-0002 Preview estático de PRs con frontend en Cloudflare Pages y SQLite en navegador

* Estado: Supersedido por [ADR-0010](0010-preview-estatico-pglite-github-pages.md)
* Fecha: 2024-03-24
* Agentes Implicados: [@.agents/skills/evaluacion-tecnologica/SKILL.md, @.agents/skills/frontend-ux-accesibilidad/SKILL.md, @.agents/skills/qa-validacion/SKILL.md]

## Contexto y Problema

Para mantener un ritmo ágil de desarrollo y asegurar la calidad visual y funcional del frontend en cada Pull Request (PR), es necesario un mecanismo para poder previsualizar y probar los cambios directamente desde el navegador. Desplegar un entorno completo con backend, base de datos Postgres real y frontend para cada PR es costoso, lento y complejo de mantener. Requerimos una forma de validar la UI, la navegación, las búsquedas, los estados editoriales y de error, utilizando datos de demostración (mock) sin depender del backend real durante la revisión de código.

## Opciones Consideradas

* **Opción 1**: Desplegar entornos completos (Backend, Postgres, Frontend) en Render o similar para cada PR.
* **Opción 2**: Preview estático de PRs usando el modo estático del framework frontend (Vite/Next/Astro) alojado en Cloudflare Pages, con una base de datos en el navegador (ej. `sql.js` o `PGLite` vía WASM) cargando un dataset (seed) de demostración.
* **Opción 3**: No tener entornos de preview y depender únicamente de pruebas automatizadas y ejecución local por parte de los revisores.

## Decisión

Elegimos la **Opción 2**: Preview estático de PRs con frontend en Cloudflare Pages y SQLite en navegador.

El frontend (en `apps/frontend`) soportará un modo especial de construcción (ej. `PREVIEW_STATIC=1 vite build`) que, en lugar de conectar con la API real, inyectará un adaptador de base de datos en el cliente usando WASM (como `sql.js` o equivalente compatible con nuestro stack Bun/TypeScript). Este adaptador cargará un dataset estático predefinido (seed.json o similar) con casos representativos de recursos, taxonomías, estados editoriales y búsquedas.

Se utilizará Cloudflare Pages apuntando al subdirectorio `apps/frontend` por su integración nativa para generar URLs únicas de preview por cada PR en repositorios de GitHub.

## Consecuencias

### Positivas
* **Feedback ultra rápido**: Los revisores y stakeholders pueden probar los cambios de UI/UX y la navegación inmediatamente desde un enlace en la PR, sin tener que levantar el entorno local.
* **Cero coste de infraestructura por PR**: Evitamos levantar bases de datos y servidores backend para cada cambio menor. Cloudflare Pages ofrece este servicio de forma nativa.
* **Desarrollo independiente**: Permite al equipo de frontend avanzar, maquetar y probar casos de uso (estados de error, sin resultados, etc.) controlando los datos de la base de datos en memoria, sin depender del estado del desarrollo del backend.

### Negativas / Riesgos
* **No valida integración real**: Este entorno no prueba el backend real ni las diferencias que puedan existir entre el SQLite del navegador y el Postgres de producción. Siguen siendo necesarios los tests E2E y un entorno de "staging" real (ej. en Render).
* **Mantenimiento del adaptador**: Requiere mantener una abstracción extra en el código del frontend (ej. un `AppDatabase` interface con implementaciones `ApiDatabase` y `BrowserSqlJsDatabase`) y mantener actualizado el dataset de demostración.
* **Limitaciones de búsqueda**: Las búsquedas y filtros complejos (FTS) pueden no comportarse exactamente igual en SQLite que en el motor de búsqueda final.

## Notas de Implementación

* En `apps/frontend`, configurar comandos de build específicos (ej. `build:preview-static`).
* Crear una abstracción para las llamadas a datos que permita inyectar la dependencia de red o la base de datos en memoria según variables de entorno.
* Configurar un proyecto en Cloudflare Pages conectado a GitHub que apunte a la carpeta `apps/frontend` y use el comando de build estático.
* Dejar la workflow `.github/workflows/ci.yml` centrada en la calidad del código (lint, tests, coverage) y usar Cloudflare para el hosting del preview.
