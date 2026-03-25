# Procomeka

Sustituto moderno de Procomún: plataforma de recursos educativos abiertos orientada a catalogación, descubrimiento, reutilización, curación, interoperabilidad y publicación.

## Stack tecnológico base

- **Lenguaje**: TypeScript (strict mode en toda la pila)
- **Runtime**: Bun (API, scripts, tests, builds)
- El resto de tecnologías por capa se decide mediante ADRs

## Modos de ejecución

| Modo | Base de datos | Auth | Uso |
|------|---------------|------|-----|
| **Producción** | PostgreSQL (`DATABASE_URL`) | Better Auth | Servidor real |
| **Desarrollo local** | PGlite (file-backed en `local-data/`) | Better Auth | `make up` |
| **Preview estático** | PGlite WASM (IndexedDB en navegador) | Usuarios demo | `make up-static` |

### Desarrollo local

No se necesita PostgreSQL instalado. PGlite actúa como PostgreSQL embebido:

```bash
make up        # Instala deps, ejecuta seed, arranca API + frontend
make up-api    # Solo API (puerto 3000)
make up-frontend  # Solo frontend (puerto 4321)
```

### Preview estático para PRs

Cada Pull Request publica automáticamente un preview en GitHub Pages usando PGlite WASM en el navegador. El preview:

- Corre 100% en el navegador, sin servidor
- Usa PGlite (PostgreSQL WASM) con datos de demostración
- Incluye selector de rol (Admin/Curator/Author/Reader) y botón de reset
- Se publica en `https://intef-proyectos.github.io/procomeka/pr-preview/pr-{N}/`

Para probar el preview localmente:

```bash
make up-static   # Construye y sirve en http://localhost:8080/procomeka/
```

**Importante:** El preview es solo para feedback rápido en las PRs. No sustituye a los tests E2E ni a los despliegues reales.

## Estructura del repositorio

```
STATUS.md                          # Tablero de Estado Global de los agentes (Orquestador)
CLAUDE.md                          # Punto de entrada para agentes IA
AGENTS.md                          # Constitución del proyecto: reglas, roles y flujo de trabajo

.templates/                        # Plantillas obligatorias para agentes
├── adr-template.md                # Plantilla para ADRs

apps/                              # Código fuente principal (Frontend, API)
├── api/                           # Backend API REST
├── frontend/                      # UI pública


packages/                          # Librerías compartidas
├── core-domain/                   # Lógica de dominio y tipos
└── ui-lib/                        # Componentes UI compartidos

.agents/skills/                    # Skills especializados (formato agentskills.io)
├── project-manager/               # Coordinador y orquestador de estado global
├── empresa-y-producto/            # Visión, objetivos, usuarios, prioridades
├── direccion-de-plataforma/       # Arquitectura de capas e integración de servicios
├── arquitectura-solucion/         # Diseño técnico trazable desde requisitos
├── evaluacion-tecnologica/        # Análisis comparativo y ADRs de tecnología
├── metadatos-y-curacion/          # Esquemas, taxonomías y flujo editorial
├── ingestas-y-migraciones/        # Importaciones, mapeos y migración desde Procomún
├── busqueda-y-descubrimiento/     # Búsqueda, facetas, ranking y navegación
├── frontend-ux-accesibilidad/     # Experiencia pública y editorial (WCAG)
├── backend-api-servicios/         # Servicios, endpoints y lógica de negocio
├── interoperabilidad-educativa/   # OAI-PMH, LTI, estándares y conectores
├── seguridad-privacidad-legal/    # RGPD, licencias, moderación y auditoría
├── devops-sre/                    # Entornos, CI/CD, backups y observabilidad
├── qa-validacion/                 # Planes de prueba, aceptación y regresión
├── analitica-y-observabilidad/    # Métricas de uso, calidad y salud del sistema
└── documentacion-y-roadmap/       # Coherencia documental, ADRs y estado

docs/
├── negocio/
│   ├── vision.md                  # Propósito, usuarios y métricas de éxito
│   ├── mapa-de-capacidades.md     # Todas las capacidades funcionales priorizadas
│   ├── glosario.md                # Términos canónicos del proyecto
│   └── decisiones/                # ADRs (Architecture Decision Records)
│       └── 0001-typescript-bun-como-stack-base.md
└── producto/
    ├── roadmap.md                 # Fases y estado de épicas
    ├── arquitectura.md            # Diagrama de capas y principios de diseño
    └── modelo-de-dominio.md       # Entidades principales en TypeScript

docs/epics/                        # Épicas y features (se crean al iniciar trabajo)
docs/hotfixes/                     # Correcciones urgentes
docs/casos/                        # Análisis sin implementación
```

## Cómo funciona el sistema de agentes

Este repositorio usa un sistema de **empresa virtual** donde cada rol es un skill especializado que la IA activa según la tarea.

### Activar un rol en Claude Code

```
@.agents/skills/empresa-y-producto/SKILL.md
```

### Iniciar una nueva épica

```
Quiero iniciar una nueva épica para el sustituto de Procomún.

Usa estos roles:
- @.agents/skills/empresa-y-producto/SKILL.md
- @.agents/skills/direccion-de-plataforma/SKILL.md
- @.agents/skills/evaluacion-tecnologica/SKILL.md

Objetivo:
[describe aquí la idea]

Necesito:
1. definición del problema
2. usuarios afectados
3. decisión inicial de stack para esta capa
4. propuesta de épica
5. riesgos
6. siguiente paso recomendado
```

### Evaluar una tecnología

```
Evalúa opciones para [capa del sistema] y decide cuál usar.

Usa:
@.agents/skills/evaluacion-tecnologica/SKILL.md
@.agents/skills/direccion-de-plataforma/SKILL.md

Quiero: análisis comparativo + ADR lista para firmar.
```

### Diseñar una feature completa

```
Diseña esta feature: [descripción]

Produce:
- requirements.md
- design.md
- tasks.md

Usa:
@.agents/skills/arquitectura-solucion/SKILL.md
@.agents/skills/metadatos-y-curacion/SKILL.md
@.agents/skills/backend-api-servicios/SKILL.md
@.agents/skills/qa-validacion/SKILL.md
```

### Planificar la migración desde Procomún

```
Planifica la migración de contenidos desde Procomún legacy.

Usa:
@.agents/skills/ingestas-y-migraciones/SKILL.md
@.agents/skills/metadatos-y-curacion/SKILL.md
@.agents/skills/interoperabilidad-educativa/SKILL.md
```

## ADRs pendientes

Antes de escribir código de negocio deben resolverse estas decisiones:

| ADR | Capa | Estado |
|-----|------|--------|
| [ADR-0001](docs/negocio/decisiones/0001-typescript-bun-como-stack-base.md) | Stack base | Aceptado |
| [ADR-0002](docs/negocio/decisiones/0002-preview-estatico-prs-con-sqlite.md) | Preview estático de PRs (SQLite) | Supersedido |
| [ADR-0010](docs/negocio/decisiones/0010-preview-estatico-pglite-github-pages.md) | Preview estático con PGlite + GitHub Pages | Aceptado |
| ADR-0003 | Framework HTTP para API | Pendiente |
| ADR-0004 | Framework frontend | Pendiente |
| ADR-0005 | Base de datos principal | Pendiente |


## Convenciones

- Toda decisión técnica relevante tiene una ADR en `docs/negocio/decisiones/` (usando la plantilla en `.templates/adr-template.md`)
- Toda épica tiene su carpeta en `docs/epics/{nombre-epica}/`
- Toda feature produce al menos `requirements.md`, `design.md` y `tasks.md`
- Los tests se ejecutan con `bun test`
- El código es TypeScript strict en toda la pila

## Comandos y Desarrollo (Makefile)

Para agilizar el desarrollo, hemos implementado un \`Makefile\`. Puedes usar:

- \`make deps\`: Instala las dependencias usando \`bun install\`.
- \`make up\`: Ejecuta el entorno de desarrollo (\`bun run dev\`).
- \`make clean\`: Limpia los directorios temporales, \`.coverage\` y \`node_modules\`.
- \`make lint\`: Comprueba reglas de código usando **Biome**.
- \`make format\`: Aplica el formateado de código automáticamente con **Biome**.
- \`make test\`: Ejecuta todos los tests y valida el coverage general.
- \`make test-unit\`: Ejecuta los tests unitarios.
- \`make test-integration\`: Ejecuta los tests de integración.
- \`make test-e2e\`: Ejecuta los tests end-to-end (e2e) usando Chromium por defecto.
- \`make test-e2e-firefox\`: Ejecuta los tests end-to-end usando Firefox.
- \`make test-e2e-postgres\`: Ejecuta los tests end-to-end usando una base de datos PostgreSQL en Docker.
- \`make check-coverage\`: Asegura que el coverage de las líneas sea mayor o igual al **90%**.

## Monorepo y Workspaces

Este proyecto está configurado como un **Monorepo** con \`bun\`. Todo el código principal, servicios, aplicaciones web, etc., vivirá dentro de la carpeta \`/apps\`. Esto permite escalar el proyecto a medida que se añadan más capas (ej: frontend y backend en carpetas distintas que comparten código).

## Linter y Formateador

Utilizamos [Biome](https://biomejs.dev/) por su rendimiento y simplicidad al agrupar linter y formateador en un mismo binario nativo. Todo se configura a través del archivo \`biome.json\`.

## Pruebas y CI

Empleamos el test-runner nativo de \`bun test\`.
Todos los tests son forzados a ejecutarse en un entorno CI automatizado con **GitHub Actions**, garantizando que nunca se haga un merge si el coverage global no alcanza el 90%.
