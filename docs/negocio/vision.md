# Visión del producto

## Propósito

Procomún es el repositorio de recursos educativos abiertos de referencia para el sistema educativo español. Su sustituto debe ser una plataforma moderna que permita encontrar, reutilizar, compartir y mejorar recursos pedagógicos de calidad.

## Problema que resuelve

El profesorado dedica tiempo excesivo a localizar materiales adecuados para su contexto de aula. Los recursos existentes están dispersos, con metadatos inconsistentes, sin criterios de calidad visibles y sin interoperabilidad con las herramientas que ya usan docentes y centros.


## Contexto histórico: El antiguo Procomún

Procomún nace como la red de recursos educativos en abierto (REA) del Ministerio de Educación y Formación Profesional a través del INTEF, siendo una evolución natural de plataformas anteriores como Agrega. Su vocación original (desde su lanzamiento en 2014) fue ofrecer un servicio a la comunidad educativa para localizar y compartir materiales de naturaleza diversa.

Recientemente, la plataforma se había actualizado para mejorar su usabilidad, incorporando la integración del antiguo Banco de imágenes y sonidos del INTEF como el "Banco Multimedia". En su versión actual, permitía a cualquier usuario, previo registro, compartir sus propias fotografías, vídeos, ilustraciones y audios bajo licencias abiertas, y contaba con un buscador unificado. Además, destacaba la incorporación de una versión de eXeLearning online, lo que permitía a los usuarios modificar sus propios recursos interactivos directamente tras la publicación.

## Características principales a mantener

Para asegurar una transición exitosa hacia la nueva versión (Procomeka), es fundamental mantener y potenciar las siguientes capacidades esenciales del sistema actual:

- **Usuarios y Roles:** Soportar tanto acceso público para la búsqueda y visualización, como acceso privado (registro) para la creación, interacción y gestión de perfiles. El perfil del usuario debe permitirle visualizar todo el contenido que ha subido, sus aportaciones y su historial.
- **Subida y Creación de Recursos:** Posibilidad de subir recursos en diferentes formatos, incluyendo paquetes SCORM y enlaces a recursos externos, así como elementos para el Banco Multimedia (imágenes, audios, vídeos).
- **Catalogación y Metadatos:** Clasificación estructurada y etiquetado de los recursos subidos, siguiendo estándares educativos (niveles, materias, competencias).
- **Búsqueda y Descubrimiento:** Un buscador potente e intuitivo (tanto simple como por facetas) que permita encontrar rápidamente recursos y elementos multimedia.
- **Moderación y Control de Calidad:** Funciones de revisión, validación y moderación de los recursos y comentarios subidos por la comunidad.
- **Edición en vivo de recursos .elpx:** Capacidad para que los autores editen sus propios recursos generados con eXeLearning sin salir de la plataforma, usando el editor embebido.

## Preparación para Inteligencia Artificial (IA)

La nueva plataforma se diseñará con una arquitectura abierta y preparada para el futuro, permitiendo "enchufar" de forma sencilla servicios basados en Inteligencia Artificial (IA). Esto habilitará:
- **Catalogación y etiquetado automático:** Sugerencias inteligentes de metadatos, resúmenes y categorías al subir un nuevo recurso.
- **Moderación automatizada:** Sistemas de IA que ayuden a detectar contenido inapropiado o violaciones de derechos de autor antes de su publicación definitiva.
- **Sistemas de valoración y recomendación:** Algoritmos que analicen el uso y la calidad de los recursos para recomendar los mejores contenidos al profesorado según su perfil y contexto de aula.

## Usuarios principales

| Usuario | Necesidad principal |
|---------|-------------------|
| **Profesorado** | Encontrar recursos relevantes para su nivel, materia y contexto |
| **Curadores editoriales** | Revisar, enriquecer y validar recursos del catálogo |
| **Autores y autoras** | Publicar y mantener sus propios materiales |
| **Gestores de plataforma** | Administrar el catálogo, las fuentes y el sistema |
| **Otros sistemas** | Consumir recursos vía API o cosecha |

## Propuesta de valor

1. **Catálogo de calidad**: metadatos consistentes, recursos validados, señales de relevancia pedagógica.
2. **Descubrimiento eficaz**: búsqueda potente con facetas contextuales, sin necesidad de conocer el sistema.
3. **Reutilización real**: formatos descargables, licencias claras, interoperabilidad con LMS.
4. **Apertura**: API pública, cosecha OAI-PMH, datos en formatos estándar.
5. **Sostenibilidad**: plataforma mantenible, operación predecible, trazabilidad de decisiones.

## Lo que NO es

- Una red social educativa
- Un LMS o plataforma de aprendizaje
- Un repositorio de documentos institucionales generales
- Una plataforma de venta de contenidos

## Métricas de éxito a largo plazo

- % de búsquedas con resultado satisfactorio (clic en recurso)
- % de recursos con metadatos completos y validados
- Número de reutilizaciones documentadas (descargas, referencias)
- Tiempo medio de curación de un recurso nuevo
- Disponibilidad del sistema (uptime)
