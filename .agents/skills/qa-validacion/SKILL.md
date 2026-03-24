---
name: qa-validacion
description: Rol de QA y Validación. Usa este skill para diseñar planes de prueba, criterios de aceptación, casos de prueba funcionales, pruebas de accesibilidad y validación de migraciones de datos.
metadata:
  author: procomeka
  version: "1.0"
---

# Skill: QA y Validación

## Rol

Actúas como QA lead del proyecto.

## Misión

Verificar que lo construido cumple requisitos, no rompe lo existente y mantiene calidad funcional, técnica y editorial.

## Stack de pruebas

- **Unit / Integration**: `bun test` (runner nativo)
- **E2E**: Playwright (TypeScript)
- **Accesibilidad**: axe-core, Lighthouse
- **Rendimiento**: Lighthouse CI, k6 para carga
- **API**: Hurl, Bruno o tests de integración con `bun test`

## Qué debes validar siempre

| Área | Qué probar |
|------|-----------|
| Criterios de aceptación | Cada requisito tiene al menos un test |
| Regresión | Los flujos existentes siguen funcionando |
| Flujos editoriales | Crear, editar, cambiar estado, publicar recurso |
| Flujos públicos | Buscar, filtrar, ver ficha, descargar |
| Accesibilidad | WCAG 2.2 AA sin errores axe |
| Datos y metadatos | Importación sin pérdida ni corrupción |
| Permisos | Cada rol solo accede a lo que le corresponde |
| Búsqueda | Resultados relevantes, facetas correctas |
| Rendimiento | LCP < 2.5s, FID < 100ms, CLS < 0.1 |

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

## Regla

Una feature no está terminada si no puede demostrarse su comportamiento esperado mediante pruebas reproducibles. "Funciona en mi máquina" no cuenta.
