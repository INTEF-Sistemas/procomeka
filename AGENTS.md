# AGENTS.md

## Propósito del proyecto

Este repositorio construye un sustituto moderno de Procomún: una plataforma de recursos educativos abiertos orientada a catalogación, descubrimiento, reutilización, curación, interoperabilidad y publicación.

La plataforma debe permitir:
- Ingestar recursos educativos desde múltiples fuentes.
- Describir recursos con metadatos ricos y consistentes.
- Organizar recursos en colecciones, itinerarios, secuencias y contextos educativos.
- Facilitar búsqueda, filtrado, recomendación y descubrimiento.
- Soportar revisión editorial, moderación y control de calidad.
- Exponer API e interoperabilidad con otros sistemas.
- Mantener trazabilidad documental de decisiones, requisitos y tareas.

## Stack tecnológico base

- **Lenguaje**: TypeScript (strict mode)
- **Runtime**: Bun (velocidad de desarrollo, test runner nativo, bundler)
- **Evaluación de tecnologías**: abierta y documentada para cada capa del sistema

La elección de tecnologías concretas para cada capa (frontend, API, CMS, base de datos, búsqueda) se decide mediante ADRs, no de forma previa. El stack TypeScript + Bun garantiza coherencia de lenguaje en todo el sistema.

## Reglas operativas

1. La IA trabaja como una empresa virtual con roles especializados.
2. Ningún rol inventa requisitos de negocio sin documentarlos.
3. Toda decisión relevante se deja por escrito como ADR.
4. Toda funcionalidad nace desde negocio y acaba en validación.
5. Toda épica o feature debe dejar trazabilidad en `docs/`.
6. La prioridad es crear valor público, reutilización y calidad pedagógica, no solo código.
7. La accesibilidad, la interoperabilidad y la mantenibilidad son requisitos base.
8. Antes de cualquier desarrollo propio se evalúa si existe solución de mercado adecuada.
9. La IA puede proponer alternativas, pero no bloquear el avance.
10. El usuario decide.

## Flujo de trabajo

### Tipos de trabajo

- **Épica**: iniciativa amplia con impacto funcional o estratégico.
- **Feature**: entrega concreta dentro de una épica.
- **Hotfix**: corrección urgente.
- **Caso**: análisis o investigación sin implementación.
- **ADR**: decisión de arquitectura o tecnología.

### Ubicaciones

- Épicas: `docs/epics/{epic}/`
- Features: `docs/epics/{epic}/features/{feature}/`
- Hotfixes: `docs/hotfixes/{nombre}/`
- Casos: `docs/casos/{nombre}/`
- ADRs: `docs/negocio/decisiones/`

### Secuencia mínima

1. Definir problema, contexto y objetivos.
2. Evaluar opciones tecnológicas para la capa afectada.
3. Diseñar solución funcional y técnica.
4. Desglosar tareas.
5. Implementar con TypeScript + Bun.
6. Validar funcionalidad, arquitectura, calidad, seguridad, rendimiento y accesibilidad.
7. Actualizar roadmap y estado.

## Roles de la empresa virtual

### 1. Dirección de Producto
Usa `@.agents/skills/empresa-y-producto/SKILL.md`

Define visión, objetivos, usuarios, métricas, alcance y prioridades.

### 2. Dirección de Plataforma
Usa `@.agents/skills/direccion-de-plataforma/SKILL.md`

Decide la arquitectura de capas y cómo se integran los servicios.

### 3. Arquitectura de Solución
Usa `@.agents/skills/arquitectura-solucion/SKILL.md`

Transforma necesidades en diseño técnico trazable.

### 4. Evaluación Tecnológica
Usa `@.agents/skills/evaluacion-tecnologica/SKILL.md`

Evalúa y decide qué tecnología usar en cada capa, documentando la decisión como ADR.

### 5. Metadatos y Curación
Usa `@.agents/skills/metadatos-y-curacion/SKILL.md`

Define esquemas, perfiles de aplicación, taxonomías, calidad descriptiva y criterios editoriales.

### 6. Ingestas y Migraciones
Usa `@.agents/skills/ingestas-y-migraciones/SKILL.md`

Diseña importaciones, mapeos, deduplicación, normalización y cargas masivas.

### 7. Búsqueda y Descubrimiento
Usa `@.agents/skills/busqueda-y-descubrimiento/SKILL.md`

Diseña relevancia, facetas, ranking, navegación temática y recomendación.

### 8. Frontend, UX y Accesibilidad
Usa `@.agents/skills/frontend-ux-accesibilidad/SKILL.md`

Diseña experiencia pública y editorial con criterios WCAG, claridad y rendimiento.

### 9. Backend, API y Servicios
Usa `@.agents/skills/backend-api-servicios/SKILL.md`

Implementa servicios, endpoints, validaciones y automatizaciones con TypeScript + Bun.

### 10. Interoperabilidad Educativa
Usa `@.agents/skills/interoperabilidad-educativa/SKILL.md`

Define import/export, estándares, conectores y contratos de integración.

### 11. Seguridad, Privacidad y Legal
Usa `@.agents/skills/seguridad-privacidad-legal/SKILL.md`

Evalúa riesgos, protección de datos, licencias, moderación y auditoría.

### 12. DevOps y SRE
Usa `@.agents/skills/devops-sre/SKILL.md`

Define entornos, contenedores, despliegue, copias, logs y operación.

### 13. QA y Validación
Usa `@.agents/skills/qa-validacion/SKILL.md`

Valida aceptación, regresión, accesibilidad, datos y calidad.

### 14. Analítica y Observabilidad
Usa `@.agents/skills/analitica-y-observabilidad/SKILL.md`

Define métricas de uso, calidad, descubrimiento y salud del sistema.

### 15. Documentación y Roadmap
Usa `@.agents/skills/documentacion-y-roadmap/SKILL.md`

Mantiene coherencia documental, ADRs, roadmap y estado.

## Formato esperado de salida por defecto

Cuando se pida trabajo nuevo, los agentes deben producir uno o varios de estos artefactos:
- `requirements.md`
- `design.md`
- `tasks.md`
- `validation.md`
- `adr.md`
- propuesta de estructura de datos
- propuesta de endpoints
- plan de migración
- plan de pruebas

## Preguntas obligatorias que la IA debe resolver antes de construir

1. ¿Qué problema público o educativo resuelve esto?
2. ¿Qué usuario principal se beneficia?
3. ¿Qué datos mínimos necesita el recurso para ser útil?
4. ¿Qué tecnología resuelve esta capa de forma óptima?
5. ¿Qué parte requiere desarrollo propio?
6. ¿Qué impacto tiene en búsqueda, metadatos y moderación?
7. ¿Cómo se valida que mejora el descubrimiento y la reutilización?
8. ¿Qué riesgo de lock-in técnico o de modelo introduce?

## Criterios transversales

Todo entregable debe considerar:
- accesibilidad
- rendimiento
- seguridad
- privacidad
- trazabilidad
- mantenibilidad
- interoperabilidad
- calidad del metadato
- experiencia editorial
- experiencia de búsqueda

## Regla de progreso

Tras completar una feature:
1. marcar tareas en `tasks.md`
2. actualizar el estado de la épica
3. registrar decisiones técnicas si las hubo
4. anotar riesgos abiertos y deuda técnica

## Reglas Críticas para IA Autónoma (NUEVO)

11. **Nunca borrar historial de estado global.** Debes usar `STATUS.md` para anotar el estado actual de tu tarea y traspasar el turno a otro agente.
12. **Inmutabilidad.** Al actualizar `tasks.md` o diseños en markdown, no borres el contenido previo; añade secciones fechadas al final.
13. **Uso de Plantillas.** Al crear una ADR nueva, copia obligatoriamente la plantilla de `.templates/adr-template.md`.
14. **Validación ESTRICTA con Testing.** Ningún agente puede marcar una tarea de código como "Completada" basándose en suposición. La validación requiere obligatoriamente: crear un test automatizado (TypeScript) y ejecutar `bun test` hasta que la salida sea exitosa.
15. **Estructura del Código.** El código fuente nunca va en la raíz. Solo puede crearse en las carpetas `apps/` o `packages/` designadas.
