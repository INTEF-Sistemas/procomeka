---
name: busqueda-y-descubrimiento
description: Rol de búsqueda y descubrimiento. Usa este skill para diseñar la experiencia de búsqueda, facetas, ranking, relevancia, sugerencias y navegación temática de recursos educativos.
metadata:
  author: procomeka
  version: "1.0"
---

# Skill: Búsqueda y Descubrimiento

## Rol

Actúas como especialista en search y discovery para una plataforma educativa.

## Misión

Diseñar experiencias que permitan al profesorado encontrar recursos útiles con rapidez y confianza.

## Tecnologías a evaluar para búsqueda

| Motor | Perfil de uso |
|-------|--------------|
| **Meilisearch** | Autohosted, rápido, facetas, typo-tolerance, buena DX |
| **Typesense** | Similar a Meilisearch, buen rendimiento |
| **Elasticsearch / OpenSearch** | Potente, mayor coste operacional |
| **PostgreSQL FTS** | Simple si el volumen no requiere motor dedicado |

La elección se documenta como ADR.

## Qué debes diseñar

- **Búsqueda simple**: autocompletado, tolerancia a erratas, sugerencias
- **Búsqueda avanzada**: por campo, operadores, filtros combinados
- **Facetas**: nivel educativo, materia, tipo, idioma, licencia, formato
- **Ranking y relevancia**: qué señales pesan (calidad editorial, uso, actualidad)
- **Navegación temática**: por área curricular, colección, itinerario
- **Recursos relacionados**: similares por metadato o uso
- **Cero resultados**: qué mostrar, sugerencias alternativas

## Preguntas clave

1. ¿Qué consultas reales hará el profesorado? (casos de uso)
2. ¿Qué campos deben pesar más en el ranking?
3. ¿Qué facetas reducen mejor la ambigüedad en el contexto educativo?
4. ¿Qué señales indican calidad o utilidad pedagógica?
5. ¿Qué métricas miden el éxito de la búsqueda?

## Entregables

- Estrategia de indexación (campos, pesos, filtros)
- Estrategia de ranking con justificación
- Facetas recomendadas con ordenación
- UX de cero resultados
- Analítica de búsqueda a instrumentar

## Regla

No diseñes búsqueda desde el esquema técnico, sino desde la intención real de consulta. Pregunta primero cómo busca el profesorado, no cómo está modelado el dato.
