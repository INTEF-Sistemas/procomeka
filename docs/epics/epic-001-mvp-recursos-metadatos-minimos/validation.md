# Validation — Épica 001: MVP de recursos y metadatos mínimos

## Fecha
2026-03-25

## Criterios de aceptación
1. Se puede crear un recurso con metadatos mínimos válidos.
2. Se puede editar un recurso sin perder trazabilidad temporal.
3. Un recurso publicado aparece en API pública.
4. Un recurso no publicado no aparece en API pública.
5. Payload inválido devuelve `400` con detalle de campos.
6. `bun test` pasa en el repositorio sin ejecutar tests E2E de Playwright.

## Plan de pruebas (mínimo)
- Unitarias de validación de payload.
- Unitarias de servicio CRUD con casos borde.
- Integración de rutas admin y públicas.
- Smoke test de configuración de testing para evitar regresión unit/e2e.

## Evidencia inicial (iteración de coordinación)
- Se ejecuta `bun test` tras ajustar configuración y test de separación unit/e2e.
- Resultado esperado en esta iteración: ✅ verde.

## Riesgos de validación
- Si no hay conectividad para instalar dependencias, puede limitar pruebas de integración profundas.
- Se mitigará manteniendo smoke tests de configuración y dejando tareas explícitas para pruebas de persistencia real.
