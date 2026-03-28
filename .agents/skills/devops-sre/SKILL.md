---
name: devops-sre
description: Rol de DevOps y SRE. Usa este skill para diseñar entornos, contenedores, pipelines CI/CD, backups, observabilidad, alertas y operación de la plataforma Procomún.
metadata:
  author: procomeka
  version: "2.0"
---

# Skill: DevOps y SRE

Última actualización: 2026-03-28

## Rol

Actúas como responsable de plataforma y operación del sistema.

## Misión

Diseñar una base desplegable, observable y recuperable usando contenedores y herramientas modernas compatibles con el stack TypeScript + Bun.

## Stack de operación a evaluar

| Capa | Opciones |
|------|---------|
| **Contenedores** | Docker + Docker Compose (dev/staging), Kubernetes (prod si escala) |
| **CI/CD** | GitHub Actions, Forgejo Actions |
| **Hosting** | VPS (Hetzner, DigitalOcean), Fly.io, Railway, Render |
| **Secrets** | Doppler, Vault, GitHub Secrets |
| **Observabilidad** | Grafana + Prometheus, Loki (logs), Sentry (errores) |
| **Backups** | pg_dump automatizado a disco local o NAS |
| **CDN** | Cloudflare, BunnyCDN |
| **Calidad de código** | Biome (formatter + linter + imports) |

## Biome: configuración y CI

### Configuración actual del proyecto (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.8/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

Decisiones clave:
- **Indentación con tabs** y **comillas dobles** para JavaScript/TypeScript.
- **Reglas recomendadas** activas (`"recommended": true`) — incluyen reglas de correctness, suspicious, complexity y style.
- **Organización automática de imports** via `assist.actions.source.organizeImports`.
- **Integración con VCS**: respeta `.gitignore` para excluir archivos.

### Opciones de configuración avanzada

**Domains** (Biome v2+): activar reglas específicas para frameworks o contextos:

```json
{
  "linter": {
    "domains": {
      "test": "all",
      "react": "all"
    },
    "rules": {
      "recommended": true
    }
  }
}
```

**Reglas individuales** con nivel y opciones:

```json
{
  "linter": {
    "rules": {
      "style": {
        "useNamingConvention": {
          "level": "error",
          "options": {
            "strictCase": false
          }
        }
      }
    }
  }
}
```

**Overrides** por patrón de archivo:

```json
{
  "overrides": [
    {
      "include": ["*.json"],
      "formatter": {
        "indentWidth": 2
      }
    },
    {
      "include": ["tests/**"],
      "linter": {
        "rules": {
          "suspicious": { "noDoubleEquals": "off" }
        }
      }
    }
  ]
}
```

### Comandos CLI de Biome

```bash
# Formatear archivos (escribe cambios)
biome format --write .

# Lint (solo diagnóstico)
biome lint .

# Check completo: format + lint + imports (solo diagnóstico)
biome check .

# Check completo con escritura
biome check --write .

# CI: modo lectura, falla si hay errores (para pipelines)
biome ci .
```

### Biome en CI

El comando `biome ci` es el indicado para pipelines. Es de solo lectura (no modifica archivos) y devuelve exit code distinto de cero si encuentra errores.

**Reporters disponibles para CI:**

```bash
# Anotaciones en PRs de GitHub
biome ci --reporter=github .

# Formato GitLab
biome ci --reporter=gitlab .

# JUnit para integración con herramientas de test
biome ci --reporter=junit .

# Solo archivos modificados respecto a main (PRs incrementales)
biome ci --changed --since=main .
```

**GitHub Actions workflow dedicado para Biome:**

```yaml
- name: Setup Biome
  uses: biomejs/setup-biome@v2
  with:
    version: latest
- name: Run Biome
  run: biome ci .
```

### Migración desde ESLint/Prettier

Si se incorporan dependencias con config legacy:

```bash
# Migrar reglas de ESLint a biome.json
biome migrate eslint --write

# Migrar configuración de Prettier
biome migrate prettier --write

# Suprimir violations existentes tras migración
biome lint --write --unsafe --suppress="suppressed due to migration"
```

## Bun runtime: referencia operativa

### Hot reload en desarrollo

```bash
# --watch: reinicia el proceso al detectar cambios en archivos importados
bun --watch run apps/api/src/index.ts

# --hot: hot reload sin reiniciar el proceso (mantiene estado en memoria)
bun --hot run apps/api/src/index.ts
```

`--watch` es más seguro para desarrollo general (reinicio limpio). `--hot` es más rápido pero solo funciona si el código tolera recarga parcial.

### Workspaces del monorepo

El proyecto usa workspaces de Bun definidos en `package.json`:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Esto permite:
- `bun install` en la raíz instala dependencias de todos los workspaces.
- `bun run --filter '@procomeka/api' dev` ejecuta un script en un workspace específico.
- `bun run --filter '@procomeka/*' dev` ejecuta en todos los workspaces que coincidan con el patrón.
- Las dependencias entre workspaces se resuelven automáticamente.

### Scripts del proyecto

```bash
bun run dev              # Arranca todos los workspaces en paralelo
bun run dev:api          # Solo la API
bun run dev:frontend     # Solo el frontend
bun run lint             # biome lint .
bun run format           # biome format --write .
bun run test             # unit + integration + coverage
bun run test:unit        # Solo tests unitarios
bun run test:e2e         # Playwright chromium
bun run check-coverage   # Valida umbral de coverage 90%
```

### Instalación de dependencias

```bash
# Instalación estándar
bun install

# Instalación reproducible (CI y Docker)
bun install --frozen-lockfile

# Solo producción
bun install --frozen-lockfile --production
```

`--frozen-lockfile` es obligatorio en CI y Docker. Falla si `bun.lock` no está sincronizado con `package.json`.

## Docker: patrones para Bun

### Dockerfile actual del proyecto (multi-stage)

```dockerfile
FROM oven/bun:latest AS base
WORKDIR /app

# --- Dependencias ---
FROM base AS install

# Copiar todos los package.json del monorepo para resolver workspaces
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/cli/package.json apps/cli/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/db/package.json packages/db/package.json

RUN bun install --frozen-lockfile --production

# --- Producción ---
FROM base AS release

# Bun hoistea todo en el node_modules raíz
COPY --from=install /app/node_modules ./node_modules

COPY package.json ./
COPY apps/api/ apps/api/
COPY apps/cli/ apps/cli/
COPY packages/db/ packages/db/

ENV NODE_ENV=production

EXPOSE 3000/tcp

CMD ["bun", "run", "apps/api/src/index.ts"]
```

**Decisiones de diseño:**
- **Multi-stage build**: separa instalación de dependencias del código fuente para maximizar cache de capas Docker.
- **`oven/bun:latest`**: imagen oficial de Bun basada en Debian.
- **`--frozen-lockfile --production`**: instalación reproducible sin devDependencies.
- **Se copian primero los `package.json`** y luego el código: los cambios de código no invalidan la capa de `bun install`.
- **Solo se copian los workspaces necesarios** para producción (no `apps/frontend` en release si se sirve estáticamente desde CDN).

### Optimizaciones recomendadas

```dockerfile
# Fijar versión de Bun para builds reproducibles
FROM oven/bun:1.2 AS base

# Healthcheck para orquestadores
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# Usuario no-root
RUN adduser --disabled-password --gecos "" appuser
USER appuser
```

## Pipeline CI: estructura actual

El pipeline en `.github/workflows/ci.yml` sigue este orden:

```
Format Check → Lint → Type Check → Tests + Coverage → Docker Build + Push
```

### Job: build (en cada push/PR a main y develop)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: oven-sh/setup-bun@v1
    with:
      bun-version: latest
  - run: make deps                          # bun install
  - run: bunx @biomejs/biome format .       # Format check (solo lectura)
  - run: make lint                          # biome lint .
  - run: bunx tsc --noEmit                  # Type check (continue-on-error: true)
  - run: make check-coverage                # Tests + validación de coverage >= 90%
```

### Job: docker (solo en push a main)

Solo se ejecuta si el job `build` fue exitoso. Construye la imagen Docker y la publica en GitHub Container Registry (GHCR):

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: docker/setup-buildx-action@v3
  - uses: docker/login-action@v3
    with:
      registry: ghcr.io
      username: ${{ github.actor }}
      password: ${{ secrets.GITHUB_TOKEN }}
  - uses: docker/build-push-action@v6
    with:
      context: .
      push: true
      tags: |
        ghcr.io/${{ github.repository }}:main
        ghcr.io/${{ github.repository }}:latest
      cache-from: type=gha
      cache-to: type=gha,mode=max
```

**Optimizaciones de cache**: usa GitHub Actions cache (`type=gha`) para capas Docker, evitando reconstruir la capa de `bun install` en cada build.

### Mejoras recomendadas para el pipeline

```yaml
# Usar biome ci con reporter de GitHub para anotaciones en PRs
- name: Format + Lint
  run: biome ci --reporter=github .

# Solo verificar archivos cambiados (PRs más rápidos)
- name: Lint incremental
  run: biome ci --changed --since=origin/main .

# Type check sin continue-on-error cuando el proyecto esté limpio
- name: Type Check
  run: bunx tsc --noEmit

# Separar tests y coverage como steps independientes
- name: Tests
  run: bun run test:standard
- name: Coverage
  run: make check-coverage
```

## Entornos mínimos

1. **local**: `make up` (bun install + seed + dev), PGlite como DB, hot reload
2. **local con PostgreSQL**: `make up-postgres` (Docker Compose con PostgreSQL real)
3. **staging**: igual que producción, con datos de prueba
4. **production**: Docker, hardened, backups, alertas activas

## Debes cubrir siempre

- Variables de entorno documentadas (`.env.example` con todas las claves)
- Pipeline CI: format → lint → typecheck → test → coverage → build → deploy
- Política de backups: frecuencia, retención, prueba de restauración
- Política de observabilidad: qué se mide, umbrales de alerta
- Runbook mínimo: cómo reiniciar, cómo restaurar, cómo escalar
- Checklist de release: qué se verifica antes de cada despliegue
- Biome: configuración consistente en `biome.json`, validada en CI con `biome ci`

## Entregables

- `docker-compose.yml` de desarrollo
- `Dockerfile` multi-stage para producción
- `biome.json` con reglas, formatter e imports configurados
- Variables de entorno documentadas
- Pipeline CI/CD en GitHub Actions
- Política de backups
- Política de observabilidad
- Checklist de release

## Regla

Nada está listo para producción si no puede monitorizarse y recuperarse. Si no hay runbook, no hay SRE.
