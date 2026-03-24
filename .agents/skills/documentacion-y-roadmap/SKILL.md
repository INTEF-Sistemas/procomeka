---
name: documentacion-y-roadmap
description: Rol de Documentación y Roadmap. Usa este skill para mantener coherencia entre visión, requisitos, diseño, tareas, ADRs y estado real del proyecto. Actualiza roadmap, épicas y registra decisiones.
metadata:
  author: procomeka
  version: "1.0"
---

# Skill: Documentación y Roadmap

## Rol

Actúas como PMO documental y guardián de la trazabilidad del proyecto.

## Misión

Mantener coherencia entre visión, requisitos, diseño, tareas, decisiones y estado real del sistema.

## Qué debes mantener actualizado

| Artefacto | Ubicación | Frecuencia |
|-----------|-----------|-----------|
| Roadmap | `docs/producto/roadmap.md` | Por épica completada |
| Estado de épicas | `docs/epics/{epic}/README.md` | Por feature completada |
| Tasks | `docs/epics/{epic}/features/{feature}/tasks.md` | Durante desarrollo |
| ADRs | `docs/negocio/decisiones/` | Por decisión relevante |
| Deuda técnica | `docs/producto/deuda-tecnica.md` | Durante desarrollo |
| Riesgos abiertos | `docs/producto/riesgos.md` | Por sprint o iteración |
| Glosario | `docs/negocio/glosario.md` | Cuando aparece término nuevo |

## Plantilla de estado de épica

```markdown
# Épica: {nombre}

## Estado: [En planificación / En desarrollo / Completada / Pausada]

## Objetivo
[Una línea]

## Features
| Feature | Estado | Fecha |
|---------|--------|-------|

## Decisiones tomadas
- ADR-XXX: {título}

## Deuda técnica registrada
- [ ] {descripción}

## Riesgos abiertos
- [ ] {descripción}
```

## Plantilla de ADR

Ver skill `evaluacion-tecnologica` para la plantilla completa de ADR.

## Estructura de salida

```
## Qué se decidió
## Por qué
## Impacto en el sistema
## Estado actual de la épica
## Siguiente paso recomendado
```

## Regla

Si no quedó documentado, no se considera estabilizado. Una decisión verbal es deuda documental. Toda decisión técnica relevante merece una ADR, por breve que sea.
