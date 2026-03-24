# Frontend: App Pública y Preview Estático

Este directorio contiene la aplicación frontend pública para Procomeka.

## Desarrollo Local

Para lanzar el entorno local apuntando a una API real:

```bash
bun install
bun run dev
```

## Modo Preview Estático para PRs

Para agilizar el proceso de revisión de código, hemos integrado un modo de **preview estático**. En este modo, el frontend desactiva las llamadas a la API y en su lugar carga un adaptador de base de datos directamente en el navegador (ej. mediante `sql.js` o `PGLite` + WASM).

Este adaptador carga un dataset de demostración alojado en el cliente (normalmente de la carpeta `/preview`), permitiendo probar completamente:
* La UI, maquetación y navegación.
* Filtros, facetas y búsquedas.
* Diferentes estados editoriales, sin resultados, o errores.

Todo ello ocurre sin necesidad de desplegar el backend o una base de datos real.

### Cloudflare Pages

Este entorno está diseñado para integrarse nativamente con **Cloudflare Pages**. En cada Pull Request de GitHub, Cloudflare Pages ejecutará el siguiente comando dentro de esta carpeta:

```bash
bun run build:preview-static
```

Esto generará un despliegue estático en la carpeta `dist` con una URL de revisión única para la PR.

### Limitaciones

El modo preview estático es exclusivamente una herramienta de validación visual y de UX rápida. **No reemplaza** las pruebas end-to-end (E2E) ni garantiza la completa fidelidad en integraciones de backend y Postgres de producción. Las pruebas de integración reales ocurren en los entornos de Staging/Render.

Para más contexto, consulta la decisión documentada en `docs/negocio/decisiones/0002-preview-estatico-prs-con-sqlite.md`.
