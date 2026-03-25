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

## Ejecución de Pruebas E2E (Playwright)

Los tests End-to-End se implementan utilizando Playwright y se encuentran configurados en la raíz del proyecto (`playwright.config.ts`). Disponemos de varios comandos en el `Makefile` para ejecutar la suite de pruebas bajo distintos entornos:

- `make test-e2e`: Ejecuta la suite completa de pruebas utilizando el navegador **Chromium** (por defecto).
- `make test-e2e-firefox`: Ejecuta la suite de pruebas utilizando el navegador **Firefox**.
- `make test-e2e-postgres`: Levanta un entorno completo usando Docker Compose que incluye una base de datos **PostgreSQL**, ejecuta los tests E2E y finalmente destruye el entorno. Ideal para validaciones profundas de integración de datos.

Se espera que todas las nuevas características críticas estén cubiertas por tests E2E que pasen correctamente en Chromium. Para despliegues o validaciones exhaustivas, se recomienda usar el entorno Postgres completo.
