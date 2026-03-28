---
name: busqueda-y-descubrimiento
description: Rol de búsqueda y descubrimiento. Usa este skill para diseñar la experiencia de búsqueda, facetas, ranking, relevancia, sugerencias y navegación temática de recursos educativos.
metadata:
  author: procomeka
  version: "1.0"
---

> Última actualización: 2026-03-28

# Skill: Búsqueda y Descubrimiento

## Rol

Actúas como especialista en search y discovery para una plataforma educativa.

## Misión

Diseñar experiencias que permitan al profesorado encontrar recursos útiles con rapidez y confianza.

## Tecnologías a evaluar para búsqueda

| Motor | Perfil de uso |
|-------|--------------|
| **FTS Nativo** | Búsqueda nativa en la base de datos principal |
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

---

## Especialización en relevancia y motor de búsqueda

> Contenido consolidado desde el skill `search-relevance-specialist`.

### Principio

Un buscador que solo busca por coincidencia exacta no es un buscador, es una base de datos. La relevancia es UX. Toda decisión de indexación debe partir de cómo busca realmente el profesorado.

### Responsabilidades adicionales

- **Relevancia y Ranking:** Definir algoritmos, pesos de campos (título vs etiquetas vs descripción), *boosting* por calidad o popularidad, y reglas de desempate en resultados (ranking).
- **Facetas y Filtros:** Diseñar el árbol de facetas, taxonomías usables en la UI, agregaciones rápidas y recuentos exactos.
- **Experiencia de Búsqueda:** Diseñar soporte para *typos*, sinónimos educativos, *stemming* por idioma, autocompletado y gestión de consultas de cero resultados (zero-results).
- **Motor de Búsqueda:** Liderar la configuración del motor de Full-Text Search (FTS) nativo en la base de datos elegida para el proyecto.
- **Recomendación:** Diseñar estrategias para sugerir recursos relacionados ("Otros también vieron", "En la misma colección").
- **Métricas de búsqueda:** Definir qué medir para saber si la búsqueda es buena (Click-Through Rate, Zero-Result Rate, Mean Reciprocal Rank).

### Entregables adicionales

- Configuración del índice de búsqueda (mappings de campos, analizadores, tokenizers).
- Definición formal de las consultas base (búsqueda textual y facetas SQL).
- Diseño de reglas de sinónimos y diccionarios pedagógicos.
- Estrategia para manejar errores tipográficos y sugerencias (*Did you mean*).
- ADR del motor de búsqueda.
- Definición de agregaciones para el panel de facetas.

---

## PostgreSQL FTS: Patrones concretos

> Referencia: documentación oficial de PostgreSQL (textsearch-tables, textsearch-controls, textsearch-dictionaries, textsearch-features, unaccent).

### Configuración de búsqueda en español sin acentos

PostgreSQL incluye la configuración `spanish` con stemmer para español. Para búsqueda insensible a acentos se necesita la extensión `unaccent` y una configuración personalizada que encadene `unaccent` antes del stemmer:

```sql
-- Habilitar la extensión
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Crear configuración personalizada basada en spanish
CREATE TEXT SEARCH CONFIGURATION es (COPY = spanish);

-- Encadenar unaccent + stemmer para palabras
ALTER TEXT SEARCH CONFIGURATION es
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;
```

Con esta configuración, `to_tsvector('es', 'Educación física')` produce `'educ':1 'fisic':2`, y `to_tsquery('es', 'educacion')` coincide correctamente sin importar tildes.

### Columna tsvector generada con pesos por campo

Usar `setweight()` para asignar pesos diferenciados: A para título (mayor relevancia), B para descripción, C para etiquetas, D para otros campos. La columna generada se mantiene automáticamente sincronizada:

```sql
ALTER TABLE recursos
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('es', coalesce(titulo, '')), 'A') ||
      setweight(to_tsvector('es', coalesce(descripcion, '')), 'B') ||
      setweight(to_tsvector('es', coalesce(etiquetas, '')), 'C')
    ) STORED;
```

Los pesos por defecto de PostgreSQL son `{0.1, 0.2, 0.4, 1.0}` para D/C/B/A respectivamente. Esto significa que una coincidencia en título (A) pesa 10x más que en etiquetas (C=0.2) y 2.5x más que en descripción (B=0.4).

### Índice GIN

El índice GIN es obligatorio para que las consultas `@@` sean eficientes. Sin él, PostgreSQL hace scan secuencial:

```sql
CREATE INDEX idx_recursos_search ON recursos USING GIN (search_vector);
```

### Construcción de consultas desde input del usuario

- `plainto_tsquery('es', 'recursos matemáticas')` — convierte texto libre en tsquery con AND implícito.
- `websearch_to_tsquery('es', 'recursos OR matemáticas -primaria')` — soporta OR, exclusión con `-`, y frases entre comillas. Es la opción más natural para un buscador público.

```sql
SELECT id, titulo,
       ts_rank(search_vector, query, 32 | 1) AS rank
FROM recursos, websearch_to_tsquery('es', :user_input) query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Ranking y normalización

`ts_rank` calcula relevancia por frecuencia de lexemas. `ts_rank_cd` añade proximidad (cover density), útil cuando importa que los términos aparezcan cerca entre sí. Los pesos A/B/C/D asignados con `setweight` se respetan automáticamente.

Flags de normalización (se combinan con `|` bit a bit):

| Flag | Efecto |
|------|--------|
| 0 | Sin normalización (default) |
| 1 | Dividir por 1 + log(longitud del documento) |
| 2 | Dividir por longitud del documento |
| 4 | Dividir por distancia armónica media (solo `ts_rank_cd`) |
| 8 | Dividir por número de palabras únicas |
| 16 | Dividir por 1 + log(número de palabras únicas) |
| 32 | Escalar rango a 0–1: rank / (rank + 1) |

Para la plataforma educativa, `32 | 1` (escala 0–1 + penalizar documentos largos) es un buen punto de partida. Para resultados donde la proximidad de términos importa (ej. "educación física" como concepto), usar `ts_rank_cd`.

### Highlight de resultados

```sql
SELECT ts_headline('es', descripcion, query,
  'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=30'
) AS fragmento
FROM recursos, websearch_to_tsquery('es', :user_input) query
WHERE search_vector @@ query;
```

### Facetas con agregaciones SQL

Las facetas se implementan como consultas `COUNT(*) GROUP BY` sobre la misma condición de búsqueda. Usar CTEs para no repetir la condición WHERE:

```sql
WITH resultados AS (
  SELECT id, nivel_educativo, materia, licencia
  FROM recursos
  WHERE search_vector @@ websearch_to_tsquery('es', :user_input)
)
SELECT 'nivel' AS faceta, nivel_educativo AS valor, COUNT(*) AS total
FROM resultados GROUP BY nivel_educativo
UNION ALL
SELECT 'materia', materia, COUNT(*)
FROM resultados GROUP BY materia
UNION ALL
SELECT 'licencia', licencia, COUNT(*)
FROM resultados GROUP BY licencia
ORDER BY faceta, total DESC;
```

Para facetas con filtros activos (ej. el usuario ya seleccionó `nivel=primaria`), añadir la condición al CTE y recalcular los conteos de las demás facetas excluyendo la propia (para que el usuario vea cuántos resultados hay en otros niveles).

### Diccionario de sinónimos educativos

PostgreSQL permite definir diccionarios de sinónimos personalizados. Para el contexto educativo esto es útil para mapear términos equivalentes (ej. "mates" → "matemáticas", "TIC" → "tecnología"):

```sql
-- Crear archivo de sinónimos en: $SHAREDIR/tsearch_data/edu_synonyms.syn
-- Formato: una línea por entrada, separado por espacio:
-- mates matemáticas
-- tic tecnología
-- profe profesor

CREATE TEXT SEARCH DICTIONARY edu_syn (
  TEMPLATE = synonym,
  SYNONYMS = edu_synonyms
);

-- Insertar el diccionario de sinónimos antes de unaccent en la cadena
ALTER TEXT SEARCH CONFIGURATION es
  ALTER MAPPING FOR hword, hword_part, word
  WITH edu_syn, unaccent, spanish_stem;
```

### Stop words

La configuración `spanish` ya incluye stop words del español (artículos, preposiciones). Los stop words se omiten del tsvector y no afectan al ranking. Si se necesitan stop words adicionales del dominio educativo, se puede crear un diccionario personalizado basado en `simple` con un fichero de stop words propio.
