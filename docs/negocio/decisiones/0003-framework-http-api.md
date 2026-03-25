# ADR-0003 Framework HTTP para API backend (TypeScript strict + Bun)

* Estado: Aceptado
* Fecha: 2026-03-25
* Agentes Implicados: [@.agents/skills/evaluacion-tecnologica/SKILL.md, @.agents/skills/backend-api-servicios/SKILL.md, @.agents/skills/direccion-de-plataforma/SKILL.md]

## Contexto y Problema

La plataforma necesita decidir el framework HTTP de la capa API backend manteniendo como base no negociable TypeScript en modo estricto y runtime Bun.

Esta decisión impacta directamente en:
- velocidad de entrega de la API,
- mantenibilidad a medio plazo,
- postura de seguridad por defecto,
- interoperabilidad con otros servicios,
- riesgo de lock-in tecnológico.

Se evalúan candidatos con presencia real en ecosistema Bun y/o uso histórico en backend Node que pueda operar en Bun con coste asumible.

## Opciones Consideradas

* Hono (adapter/runtime Bun)
* Elysia
* Fastify (ejecución sobre compatibilidad Node API de Bun)
* Express (ejecución sobre compatibilidad Node API de Bun)

### Matriz comparativa (criterios obligatorios)

| Criterio | Hono | Elysia | Fastify | Express |
|---|---|---|---|---|
| Ajuste funcional | Alto para APIs REST/middleware y rutas tipadas ligeras | Alto para backend Bun-first con DX integrada | Alto para APIs complejas con ecosistema plugin maduro | Medio: simple y flexible, menos opinión para APIs modernas |
| Compatibilidad Bun | Nativa/multi-runtime, guía oficial Bun | Optimizado para Bun, guía oficial Bun | Indirecta vía Node compatibility de Bun; requiere validación extra | Buena en Bun por compatibilidad node:http/node:https |
| Madurez | Buena y creciente, comunidad activa | Media-alta, crecimiento rápido, menor histórico que Express/Fastify | Muy alta en Node, ecosistema amplio | Muy alta, enorme adopción histórica |
| Rendimiento | Alto (enfoque ultrafast y Web Standards) | Muy alto (Bun-first y foco performance) | Alto en Node; en Bun depende de capa compat | Correcto para muchos casos, no líder en throughput |
| Coste de integración | Bajo-medio (simple, TS first) | Bajo en Bun (scaffold y convenciones claras) | Medio-alto en Bun (plugins/dependencias Node a revisar) | Bajo para equipo con experiencia Express; medio si se exige tipado estricto fuerte |
| Lock-in | Bajo (Web Standards y multi-runtime) | Medio (optimización fuerte a Bun y ecosistema propio) | Medio (arquitectura plugin específica Fastify) | Bajo-medio (API ampliamente conocida, pero patrones legacy) |
| Licencia | MIT | MIT | MIT | MIT |
| Operación | Self-hosted, sin coste de licencia | Self-hosted, sin coste de licencia | Self-hosted, sin coste de licencia | Self-hosted, sin coste de licencia |

### Opción: Hono
- Pros:
  - Framework construido sobre Web Standards y orientado a multi-runtime (incluye Bun de forma explícita).
  - Buen equilibrio entre rendimiento, simplicidad y tipado TypeScript.
  - Bajo lock-in al permitir mover la API a otros runtimes con mínimos cambios.
  - Middleware útil para seguridad y operación (CORS, CSRF, secure headers, JWT, etc.).
- Contras:
  - Ecosistema backend tradicional (plugins empresariales específicos) menor que Fastify/Express.
  - Algunas integraciones avanzadas pueden requerir composición manual.

### Opción: Elysia
- Pros:
  - Bun-first real: muy buen encaje con el runtime objetivo.
  - Excelente DX con inferencia de tipos y plugins orientados a productividad.
  - Rendimiento competitivo dentro de ecosistema Bun.
- Contras:
  - Mayor riesgo de lock-in técnico al priorizar optimizaciones específicas de Bun.
  - Menor madurez histórica y menor base instalada que Express/Fastify.

### Opción: Fastify
- Pros:
  - Muy maduro, fuerte arquitectura de plugins y validación schema-driven.
  - Buen rendimiento en contexto Node y prácticas operativas robustas.
- Contras:
  - Su propuesta principal está centrada en Node.js; en Bun depende de compatibilidad Node API y validación de edge-cases.
  - Coste de integración superior en Bun frente a frameworks nativos/optimizados para Bun.

### Opción: Express
- Pros:
  - Ecosistema enorme y curva de entrada muy baja.
  - Bun documenta soporte para Express apoyándose en node:http y node:https.
- Contras:
  - Rendimiento y tipado estricto menos favorables para una API moderna orientada a contrato.
  - Menor alineación con diseño Web Standards/multi-runtime moderno.

## Decisión

Se recomienda **Hono** como framework HTTP para la API backend.

Justificación principal:
1. **Ajuste al stack objetivo**: soporte explícito de Bun y alineación con TypeScript.
2. **Balance estratégico**: alto rendimiento con menor lock-in que una opción Bun-first estricta.
3. **Mantenibilidad**: API clara, middleware suficiente y diseño portable entre runtimes.
4. **Riesgo controlado**: evita depender en exceso de capa de compatibilidad Node (como Fastify/Express en Bun).

## Consecuencias

### Positivas
* Alineación directa con Bun sin sacrificar portabilidad futura entre runtimes.
* Menor coste de integración inicial para API REST y servicios HTTP de plataforma.
* Mejor posicionamiento para interoperabilidad y evolución a arquitecturas híbridas (edge + core API).
* Coherencia con requisitos de mantenibilidad y lock-in bajo del proyecto.

### Negativas / Riesgos
* Ecosistema de plugins backend empresariales menor que Fastify/Express en algunos nichos.
* Posible necesidad de utilidades propias para ciertos patrones avanzados de observabilidad o validación.
* Riesgo de dispersión si equipos paralelos adoptan estilos distintos sin guía técnica común.

## Notas de Implementación

Si se acepta esta ADR:
1. Crear una guía de referencia interna para API en `apps/` con convenciones Hono (rutas, validación, errores, auth, logging).
2. Definir baseline de seguridad (CORS, límites de body, secure headers, JWT/authorización) y checklist de hardening.
3. Estandarizar contrato OpenAPI y estrategia de versionado de endpoints.
4. Ejecutar una prueba de carga comparativa mínima Hono vs Elysia en un caso real del dominio antes de congelar plantillas de servicio.
5. Registrar en roadmap los criterios de reevaluación y fecha de revisión (90 días tras primer release de API).

## Resumen ejecutivo

**Recomendación final:** adoptar **Hono** como framework HTTP de la API.

**Motivos ejecutivos:**
- Compatibilidad real con Bun y modelo Web Standards portable.
- Buen equilibrio entre rendimiento, mantenibilidad y bajo lock-in.
- Coste de integración razonable frente a alternativas.

**Riesgos principales:**
- Elysia puede ofrecer mayor rendimiento específico en Bun en ciertos casos.
- Fastify/Express mantienen ventaja en ecosistema histórico Node para algunas integraciones legacy.

**Mitigación propuesta:**
- Mantener benchmark comparativo de endpoints críticos y una revisión formal de la ADR tras datos de operación real.

## Criterios de revisión

Reabrir esta decisión si ocurre alguna de estas condiciones:
1. Bun introduce cambios de compatibilidad que alteran sustancialmente coste/riesgo de Hono.
2. Elysia demuestra ventaja sostenida (>20%) en rendimiento de endpoints críticos sin aumentar lock-in operativo.
3. Requisitos de negocio exigen plugins/capacidades no cubiertas de forma razonable por Hono.
4. Problemas recurrentes de mantenibilidad, seguridad o interoperabilidad atribuibles al framework elegido.
5. Cambio estratégico de runtime principal (salida parcial/total de Bun).
