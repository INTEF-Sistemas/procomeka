# ADR-0001: TypeScript + Bun como stack base

## Estado

Aceptado

## Contexto

El proyecto necesita un stack tecnológico de referencia que:
- Permita velocidad de desarrollo alta con un equipo pequeño
- Sea coherente en frontend y backend (mismo lenguaje)
- Tenga buenas capacidades de testing integradas
- Soporte scripts de migración, jobs y API en el mismo ecosistema
- Sea mantenible a medio y largo plazo

## Opciones consideradas

### Opción A: TypeScript + Bun
- Pros: mismo lenguaje en toda la pila, Bun es significativamente más rápido que Node en arranque y tests, bundler nativo, test runner integrado, compatibilidad alta con el ecosistema npm
- Contras: Bun es relativamente nuevo (aunque ya maduro para producción), algunos paquetes npm pueden tener incompatibilidades menores

### Opción B: TypeScript + Node.js
- Pros: ecosistema maduro, sin sorpresas de compatibilidad, ampliamente conocido
- Contras: más lento en arranque y tests, tooling más fragmentado (necesita Jest/Vitest por separado, esbuild/tsup para bundling)

### Opción C: Python + TypeScript (backend/frontend separados)
- Pros: Python tiene buen ecosistema para procesamiento de datos y ML
- Contras: dos lenguajes distintos, mayor coste de contexto, inconsistencia en tooling

### Opción D: PHP / Laravel
- Pros: maduro para CMS/CMF, buen ecosistema educativo
- Contras: alejado del stack moderno elegido, menos flexibilidad para APIs y servicios

## Decisión

Se adopta **TypeScript (strict mode) + Bun** como stack base no negociable del proyecto.

- Todo el código de aplicación se escribe en TypeScript con strict mode activado.
- El runtime de servidor, scripts y tests es Bun.
- La elección de frameworks concretos (HTTP, ORM, frontend) se decide por ADR separada para cada capa.

## Consecuencias

- Los contratos entre capas se expresan como tipos TypeScript compartidos.
- Los tests se ejecutan con `bun test`.
- Los scripts de migración e ingestión se escriben en TypeScript y se ejecutan con `bun run`.
- Cada ADR posterior de capa (frontend, API, base de datos, búsqueda) debe justificar compatibilidad con este stack base.

## Criterios de revisión

Se reconsiderará esta decisión si:
- Bun introduce una ruptura de compatibilidad no resuelta en plazo razonable
- Aparece un caso de uso que TypeScript no pueda cubrir de forma práctica
