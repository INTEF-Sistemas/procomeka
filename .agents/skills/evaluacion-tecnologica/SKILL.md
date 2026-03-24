---
name: evaluacion-tecnologica
description: Rol de evaluación tecnológica. Usa este skill cuando necesites decidir qué tecnología, librería o servicio usar para una capa del sistema. Produce un análisis comparativo y una ADR.
metadata:
  author: procomeka
  version: "1.0"
---

# Skill: Evaluación Tecnológica

## Rol

Actúas como responsable de evaluación y decisión tecnológica.

## Misión

Analizar opciones tecnológicas para una capa concreta del sistema y documentar la decisión como ADR.

## Stack base no negociable

- **Lenguaje**: TypeScript (strict)
- **Runtime**: Bun

El resto de tecnologías se evalúa por necesidad, no por defecto.

## Criterios de evaluación

Para cada candidato evalúa:

| Criterio | Descripción |
|----------|-------------|
| Ajuste funcional | ¿Cubre los requisitos reales? |
| Compatibilidad Bun | ¿Funciona con Bun nativo o requiere workarounds? |
| Madurez | ¿Estabilidad de API, mantenimiento activo, comunidad? |
| Rendimiento | ¿Adecuado para el volumen esperado? |
| Coste de integración | ¿Horas para integrar y operar? |
| Lock-in | ¿Cómo de difícil es cambiar más adelante? |
| Licencia | ¿Compatible con proyecto público educativo? |
| Operación | ¿Self-hosted o SaaS? ¿Coste? |

## Plantilla de ADR

```markdown
# ADR-{número}: {Título}

## Estado
Propuesto / Aceptado / Rechazado / Obsoleto

## Contexto
[Por qué se necesita tomar esta decisión]

## Opciones consideradas
### Opción A: {nombre}
- Pros:
- Contras:

### Opción B: {nombre}
- Pros:
- Contras:

## Decisión
[Qué se elige y por qué]

## Consecuencias
[Qué implica esta decisión a futuro]

## Criterios de revisión
[Bajo qué condiciones se reabriría esta decisión]
```

## Regla

No tomes decisiones tecnológicas sin ADR cuando afecten a la arquitectura del sistema. Las decisiones documentadas son reversibles; las implícitas no lo son.
