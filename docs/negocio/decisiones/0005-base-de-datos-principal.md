# ADR-0005 Base de datos principal

* Estado: Aceptado
* Fecha: 2026-03-25
* Agentes Implicados: [@.agents/skills/evaluacion-tecnologica/SKILL.md, @.agents/skills/direccion-de-plataforma/SKILL.md, @.agents/skills/backend-api-servicios/SKILL.md]

## Contexto y Problema

En Fase 0 se debe decidir la base de datos principal del sustituto moderno de Procomún dentro de un stack fijo TypeScript (strict) + Bun.

La plataforma debe soportar catalogación, trazabilidad editorial, interoperabilidad y evolución por fases, con prioridad en:

- fiabilidad operativa,
- escalabilidad,
- coste operativo razonable,
- bajo lock-in técnico.

Restricción obligatoria: **debe existir un entorno de test rápido GUI/UX en cada PR (preview estático en navegador)**. Originalmente se contemplaba SQLite para este fin, pero ADR-0010 resolvió esto con PGlite (PostgreSQL compilado a WASM), eliminando la necesidad de mantener esquemas duales.

## Opciones Consideradas

* PostgreSQL
* MySQL
* SQLite (como base principal)

## Análisis comparativo (criterios de evaluación)

| Criterio | PostgreSQL | MySQL | SQLite (principal) |
|---|---|---|---|
| Ajuste funcional | Excelente para metadatos ricos, relaciones complejas, integridad referencial avanzada, JSONB, full-text y extensiones geoespaciales | Bueno para OLTP general; menor expresividad nativa en casos avanzados frente a PostgreSQL | Limitado para operación multiusuario concurrente y cargas de escritura sostenida |
| Compatibilidad con Bun | Muy buena vía drivers/ORMs habituales en TS (Postgres es ruta prioritaria en la mayoría de herramientas Bun/TS) | Muy buena vía drivers/ORMs TS; soporte maduro | Nativa y excelente para desarrollo local y tests rápidos |
| Madurez | Muy alta, ecosistema robusto, estándar de facto en SaaS y sector público | Muy alta, amplia adopción empresarial | Muy alta como motor embebido, no como backend principal distribuido |
| Rendimiento | Muy bueno en lecturas/escrituras mixtas con tuning e índices; escala vertical y horizontal con estrategias conocidas | Muy bueno en OLTP tradicional; depende de configuración y patrón de consulta | Muy bueno en monoproceso/local; limitado por bloqueo de archivo y concurrencia de escritura |
| Coste de integración y operación | Medio: requiere servicio DB gestionado o autogestión; tooling excelente | Medio: comparable, pero parte del tooling moderno TS/Bun suele optimizarse primero para Postgres | Bajo al inicio; alto riesgo de coste futuro por migración y límites operativos |
| Lock-in | Bajo (open source, estándar SQL, múltiples proveedores gestionados y self-host) | Bajo-medio (open source; diferencias por variantes/ediciones/proveedores) | Bajo por formato abierto, pero alto riesgo de lock-in arquitectónico al patrón monolito local |
| Licencia | Permisiva, adecuada para proyecto público educativo | Permisiva (según distribución), adecuada para proyecto público educativo | Dominio público, compatible |
| Operación | Flexible: self-hosted o DBaaS con HA, backup, réplica y observabilidad madura | Flexible: self-hosted o DBaaS con HA | Muy simple para local/preview; limitada para HA real de producción |
| Convivencia con SQLite en preview | Alta: estrategia dual clara (Postgres prod/staging + SQLite preview), minimizando fricción con ORM compatible | Media-alta: posible, pero menos habitual en flujos duales Bun/TS centrados en SQLite preview | Nativa en preview, pero no resuelve necesidades de producción |

### Síntesis por opción

#### PostgreSQL
**Pros**
- Mejor equilibrio entre fiabilidad, escalabilidad y capacidad semántica para dominio educativo (metadatos heterogéneos + relaciones).
- Excelente trayectoria para auditoría, integridad de datos y evolución de esquema.
- Ecosistema muy sólido para replicación, backups, observabilidad y operación en cloud pública o self-hosted.
- Bajo lock-in por portabilidad y oferta amplia de proveedores.

**Contras**
- Coste operativo superior a SQLite en fases tempranas.
- Requiere disciplina de migraciones y observabilidad desde el inicio.

#### MySQL
**Pros**
- Muy maduro, ampliamente conocido por equipos de operación.
- Buen rendimiento en cargas transaccionales comunes.
- Amplio soporte en proveedores y herramientas.

**Contras**
- Menor alineación con capacidades avanzadas de modelado y consulta requeridas previsiblemente en el dominio (metadatos complejos y analítica editorial temprana).
- En ecosistema TS/Bun moderno suele haber más patrones y documentación de referencia orientados a PostgreSQL para casos de producto evolutivo.

#### SQLite (como principal)
**Pros**
- Simplicidad extrema y coste operativo inicial mínimo.
- Excelente para CI rápida, tests de UI/UX y entornos efímeros de PR.

**Contras**
- No cubre de forma robusta necesidades de concurrencia, HA y escalado de una plataforma pública multiusuario.
- Introduce riesgo alto de migración forzosa posterior y deuda técnica si se adopta como principal en producción.

## Decisión

Se adopta **PostgreSQL como base de datos principal** para producción y entornos persistentes (staging/preproducción). Para desarrollo local y previews de PR se usa **PGlite** (PostgreSQL compilado a WASM), eliminando la necesidad de esquemas SQLite separados (ver ADR-0010).

Motivos principales:

1. Es la opción que mejor cumple simultáneamente fiabilidad, escalabilidad y bajo lock-in.
2. Da margen de crecimiento funcional para metadatos ricos, flujos editoriales y trazabilidad sin rediseños tempranos.
3. Permite convivencia pragmática con SQLite en preview sin invalidar el objetivo de velocidad en PRs.
4. Mantiene reversibilidad razonable al basarse en estándares y en un motor ampliamente soportado.

## Consecuencias

### Positivas
* Se reduce el riesgo de rediseño de datos en fases tempranas de crecimiento funcional.
* Se facilita la calidad de dato y la trazabilidad (constraints, transacciones, auditoría, índices avanzados).
* Se habilita una estrategia operativa robusta (backup, réplica, recuperación, observabilidad).
* Se preserva velocidad de feedback en PR al sostener SQLite para previsualizaciones GUI/UX.

### Negativas / Riesgos
* Mayor complejidad operativa inicial frente a una estrategia exclusivamente SQLite.
* Riesgo de divergencia entre comportamiento PostgreSQL y SQLite en previews si no se controla el subconjunto SQL utilizado.
* Necesidad de disciplina de migraciones y pruebas de compatibilidad dual desde el inicio.

## Riesgos y mitigaciones

1. **Divergencia SQL Postgres/SQLite en previews.**  
   Mitigación: definir un “perfil SQL portable” en capa de acceso a datos para flujos de preview; ejecutar checks automáticos en CI contra ambos motores para casos críticos.

2. **Sobrecoste de operación en etapas iniciales.**  
   Mitigación: comenzar con servicio gestionado básico de PostgreSQL y escalar por métricas objetivas de carga.

3. **Dependencia de capacidades avanzadas demasiado pronto.**  
   Mitigación: priorizar diseño reversible, usar extensiones sólo cuando aporten valor probado y documentar cada adopción adicional en ADR específica.

## Notas de Implementación

1. **Estrategia por entorno** (actualizado por ADR-0010)
   - Producción/staging: PostgreSQL.
   - Preview estático por PR: PGlite WASM en navegador (GitHub Pages).
   - Desarrollo local: PGlite (file-backed, sin instalar PostgreSQL).

2. **Capa de acceso a datos (Bun + TypeScript strict)**
   - Adoptar un ORM/query builder con soporte explícito para PostgreSQL y SQLite.
   - Definir contratos de repositorio y validación de entrada/salida tipada para evitar acoplamiento al motor.

3. **Migraciones y esquema**
   - Mantener migraciones versionadas y auditables.
   - Evitar en Fase 0 el uso de features no portables salvo justificación documentada.

4. **Pruebas obligatorias de compatibilidad dual**
   - Pruebas automatizadas de repositorios y consultas críticas en PostgreSQL.
   - Smoke tests equivalentes en SQLite para garantizar previews funcionales.

5. **Operación y observabilidad mínimas**
   - Definir backup/restore y política de retención desde el inicio de staging.
   - Incorporar métricas básicas de latencia de consulta, errores y crecimiento de tablas.

6. **Puertas de revisión de esta ADR**
   - Reabrir decisión si: (a) la carga real es sustancialmente menor y el coste de PostgreSQL no se justifica, (b) la convivencia dual genera fricción no asumible, o (c) aparece alternativa de menor lock-in con mejor coste total de operación probado en piloto.
