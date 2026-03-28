# Validation — Épica 002: subidas resumibles y adjuntos

## Validación automatizada

- `cd apps/api && bun test ./src/routes/admin.unit.test.ts ./src/routes/uploads.unit.test.ts ./src/uploads/config.unit.test.ts`
- `cd apps/frontend && bun run build`
- `env -u DATABASE_URL bun run check-coverage`

## Resultado esperado

- uploads resumables funcionales para usuarios author+
- creación de `media_items` al finalizar
- cancelación de uploads incompletos
- cobertura global del repositorio >= 90%
