---
name: backend-api-servicios
description: Rol de Backend, API y Servicios. Usa este skill para diseñar e implementar servicios, endpoints REST o RPC, validaciones, autenticación, tareas y lógica de negocio con TypeScript y Bun.
metadata:
  author: procomeka
  version: "1.1"
  última_actualización: "2026-03-28"
---

# Skill: Backend, API y Servicios

## Rol

Actúas como backend lead del proyecto.

## Misión

Implementar servicios, API y lógica de negocio de forma mantenible y trazable usando TypeScript + Bun.

## Stack backend decidido

| Capa | Tecnología | ADR |
|------|-----------|-----|
| **Framework HTTP** | Hono | ADR-0003 |
| **ORM / Query builder** | Drizzle ORM | ADR-0006 |
| **Validación** | Zod | (implícito en ADR-0003/0006) |
| **Autenticación** | Better Auth | ADR-0007 |
| **Subidas resumibles** | @tus/server + FileStore | ADR-0011 |
| **Base de datos** | PostgreSQL (PGlite en preview) | ADR-0005, ADR-0010 |

## Principios de implementación

- Todo endpoint tiene tipos de entrada y salida definidos en TypeScript
- Toda validación de entrada usa un schema Zod con `zValidator` o `sValidator`
- Los errores se lanzan como `HTTPException` con código, mensaje y contexto estructurado
- Los permisos se verifican en la capa de servicio con `auth.api.userHasPermission`, no solo en middleware
- Cada dominio funcional se implementa como una sub-aplicación Hono independiente
- Contrato primero, implementación después

---

## Patrones Hono

### Estructura modular con sub-aplicaciones

Cada dominio exporta su propia instancia Hono. La app principal monta las sub-aplicaciones con `app.route()`:

```typescript
// resources.ts
import { Hono } from 'hono'
const app = new Hono()
  .get('/', (c) => c.json({ items: [] }))
  .get('/:id', (c) => c.json({ id: c.req.param('id') }))
  .post('/', (c) => c.json({ created: true }, 201))

export default app
export type ResourcesApp = typeof app
```

```typescript
// index.ts
import { Hono } from 'hono'
import resources from './resources'
import collections from './collections'

const app = new Hono()
app.route('/resources', resources)
app.route('/collections', collections)

export default app
```

Para agrupar rutas bajo un prefijo sin montar, usar `basePath`:

```typescript
const api = new Hono().basePath('/api/v1')
api.get('/health', (c) => c.json({ ok: true }))
```

### Tipado del contexto con Variables

Definir las variables de contexto como tipo genérico de la instancia Hono. Usar `c.set()` y `c.get()` (o `c.var`) para pasar datos entre middleware y handlers:

```typescript
import { Hono } from 'hono'
import type { auth } from './auth'

type Env = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}

const app = new Hono<Env>()
```

### Middleware tipado con createMiddleware

Usar `createMiddleware` del factory para middleware que inyecta variables tipadas en el contexto:

```typescript
import { createMiddleware } from 'hono/factory'

const withRequestId = createMiddleware<{
  Variables: { requestId: string }
}>(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

app.get('/endpoint', withRequestId, (c) => {
  return c.json({ requestId: c.var.requestId })
})
```

### Validación con zValidator

Usar `@hono/zod-validator` para validar entrada en cada handler. Admite targets: `'json'`, `'form'`, `'query'`, `'param'`, `'header'`:

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

app.post(
  '/resources',
  zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().optional(),
  })),
  (c) => {
    const data = c.req.valid('json') // tipado automático
    return c.json({ created: true, title: data.title }, 201)
  }
)

app.get(
  '/resources/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('query', z.object({
    page: z.coerce.number().optional(),
  })),
  (c) => {
    const { id } = c.req.valid('param')
    const { page } = c.req.valid('query')
    return c.json({ id, page })
  }
)
```

Los valores de query llegan siempre como string; usar `z.coerce.number()` para convertirlos.

### Manejo de errores con HTTPException

Lanzar `HTTPException` para errores controlados. Registrar un handler global con `app.onError`:

```typescript
import { HTTPException } from 'hono/http-exception'

// Lanzar en cualquier handler o servicio
throw new HTTPException(404, { message: 'Recurso no encontrado' })
throw new HTTPException(403, { message: 'Sin permisos para esta acción' })
throw new HTTPException(422, { message: 'Metadatos incompletos' })

// Handler global de errores en la app principal
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.json({ error: 'Error interno del servidor' }, 500)
})
```

Reglas:
- Los errores de negocio siempre usan `HTTPException` con código HTTP semántico
- El handler global captura excepciones no controladas y devuelve 500 genérico
- Nunca exponer stack traces ni detalles internos en la respuesta

---

## Patrones Better Auth

### Middleware de sesión en Hono

El middleware extrae la sesión de las cookies/headers y la inyecta en el contexto Hono. Se aplica a todas las rutas con `app.use("*", ...)`:

```typescript
import { Hono } from 'hono'
import { auth } from './auth'

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set('user', null)
    c.set('session', null)
    await next()
    return
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
```

### Handler de rutas de autenticación

Better Auth expone sus endpoints bajo `/api/auth/*`. Montar el handler directamente:

```typescript
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})
```

Este handler cubre login, logout, registro, callback OAuth, verificación de email y todas las rutas que Better Auth gestiona internamente.

### Control de acceso con createAccessControl

Definir las acciones permitidas por recurso con `createAccessControl` y crear roles con `ac.newRole()`:

```typescript
import { createAccessControl } from 'better-auth/plugins/access'

const statement = {
  resource: ['create', 'read', 'update', 'delete', 'publish'],
  collection: ['create', 'read', 'update', 'delete'],
  upload: ['create', 'read', 'delete'],
} as const  // OBLIGATORIO: as const para inferencia de tipos

const ac = createAccessControl(statement)

export const editorRole = ac.newRole({
  resource: ['create', 'read', 'update'],
  collection: ['create', 'read', 'update'],
  upload: ['create', 'read'],
})

export const adminRole = ac.newRole({
  resource: ['create', 'read', 'update', 'delete', 'publish'],
  collection: ['create', 'read', 'update', 'delete'],
  upload: ['create', 'read', 'delete'],
})
```

### Verificación de permisos server-side

Usar `auth.api.userHasPermission` en la capa de servicio antes de ejecutar la operación. La estructura de `permissions` debe coincidir con la definida en el `statement`:

```typescript
const allowed = await auth.api.userHasPermission({
  body: {
    userId: c.get('user')?.id,
    permissions: {
      resource: ['publish'],
    },
  },
})

if (!allowed) {
  throw new HTTPException(403, { message: 'Sin permiso para publicar' })
}
```

Para verificar por rol sin userId:

```typescript
await auth.api.userHasPermission({
  body: {
    role: 'editor',
    permissions: { resource: ['delete'] },
  },
})
```

### Configuración OIDC Provider

Para actuar como proveedor OIDC (SSO educativo), configurar el plugin `oidcProvider` con página de login y claims adicionales:

```typescript
import { betterAuth } from 'better-auth'
import { oidcProvider } from 'better-auth/plugins'

export const auth = betterAuth({
  plugins: [
    oidcProvider({
      loginPage: '/sign-in',
      getAdditionalUserInfoClaim: async (user, scopes, client) => {
        const claims: Record<string, unknown> = {}
        if (scopes.includes('profile')) {
          claims.role = user.role
          claims.organization = user.organization
        }
        return claims
      },
    }),
  ],
})
```

### Configuración SSO con Generic OAuth

Para consumir proveedores externos OIDC (login institucional), usar `genericOAuth` con `discoveryUrl` para autoconfiguración:

```typescript
import { genericOAuth } from 'better-auth/plugins'

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'educacion-sso',
          clientId: process.env.SSO_CLIENT_ID!,
          clientSecret: process.env.SSO_CLIENT_SECRET!,
          discoveryUrl: 'https://idp.educacion.es/.well-known/openid-configuration',
        },
      ],
    }),
  ],
})
```

El registro dinámico de proveedores SSO también soporta PKCE, scopes personalizados y mapeo de campos (`mapping.id`, `mapping.email`, `mapping.name`, `mapping.extraFields`).

---

## Patrones @tus/server

### Hooks del ciclo de vida

El servidor tus expone hooks que se ejecutan en momentos específicos del upload. Usar estos hooks para validación, autorización y enriquecimiento:

| Hook | Momento | Uso principal |
|------|---------|--------------|
| `onIncomingRequest` | Antes de cada operación | Control de acceso, autenticación |
| `onUploadCreate` | Antes de crear el upload | Validación de metadata, enriquecimiento |
| `onUploadFinish` | Tras completar el upload | Post-procesamiento, notificación |
| `onResponseError` | Al generar respuesta de error | Mapeo de errores, observabilidad |

### Validación de metadata en onUploadCreate

Validar campos obligatorios y tipos de archivo. Rechazar lanzando `{ status_code, body }`. Enriquecer metadata devolviendo un objeto con metadata modificada:

```typescript
import { Server } from '@tus/server'
import { FileStore } from '@tus/file-store'

const tusServer = new Server({
  path: '/files',
  datastore: new FileStore({ directory: './uploads' }),
  async onUploadCreate(req, upload) {
    if (!upload.metadata?.filename) {
      throw { status_code: 400, body: 'filename es obligatorio en metadata' }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']
    if (upload.metadata.filetype && !allowedTypes.includes(upload.metadata.filetype)) {
      throw { status_code: 400, body: 'Tipo de archivo no permitido' }
    }

    // Enriquecer con metadata del servidor
    return {
      metadata: {
        ...upload.metadata,
        uploadedBy: req.headers.get('x-user-id'),
        uploadedAt: new Date().toISOString(),
      },
    }
  },
})
```

### Control de acceso en onIncomingRequest

Se ejecuta antes de cada operación tus (crear, parchear, borrar). Usar para verificar autenticación y permisos:

```typescript
const tusServer = new Server({
  // ...
  async onIncomingRequest(req, uploadId) {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      throw { status_code: 401, body: 'No autenticado' }
    }
    const allowed = await auth.api.userHasPermission({
      body: { userId: session.user.id, permissions: { upload: ['create'] } },
    })
    if (!allowed) {
      throw { status_code: 403, body: 'Sin permiso de subida' }
    }
  },
})
```

### Eventos para tracking y post-procesamiento

Suscribirse a eventos para monitorización, actualización de base de datos y notificaciones. Configurar `postReceiveInterval` para controlar la frecuencia de eventos de progreso:

```typescript
import { Server, EVENTS } from '@tus/server'

const tusServer = new Server({
  path: '/files',
  datastore: store,
  postReceiveInterval: 1000, // evento de progreso cada segundo
})

tusServer.on(EVENTS.POST_CREATE, (req, upload, url) => {
  // Upload creado: registrar en BD
})

tusServer.on(EVENTS.POST_RECEIVE, (req, upload) => {
  const percent = ((upload.offset / upload.size) * 100).toFixed(2)
  // Actualizar progreso
})

tusServer.on(EVENTS.POST_FINISH, (req, res, upload) => {
  // Upload completado: procesar archivo, generar thumbnails, indexar
})

tusServer.on(EVENTS.POST_TERMINATE, (req, res, id) => {
  // Upload borrado: limpiar registros en BD
})
```

### Configuración multi-instancia con Redis

Para despliegues con varias instancias del servidor, usar `RedisKvStore` para cache compartida de metadata y `RedisLocker` para locks de concurrencia. En instancia única, los defaults en memoria son suficientes:

```typescript
import { RedisKvStore } from '@tus/server'
import { S3Store } from '@tus/s3-store'
import { createClient } from '@redis/client'

const redisClient = await createClient({ url: process.env.REDIS_URL }).connect()

const store = new S3Store({
  cache: new RedisKvStore(redisClient, 'tus-uploads'),
  s3ClientConfig: { /* ... */ },
})

const tusServer = new Server({
  path: '/files',
  datastore: store,
  locker: new RedisLocker(redisClient), // lock distribuido
})
```

### Protección de uploads completados

Desactivar la terminación de uploads ya finalizados para evitar borrado accidental:

```typescript
const tusServer = new Server({
  // ...
  disableTerminationForFinishedUploads: true,
})
```

Para S3, configurar regla de lifecycle que limpie multipart uploads incompletos usando el tag `Tus-Completed: false` con expiración de 2 días.

---

## Testing

### Tests de endpoints con app.request()

Hono permite testear endpoints sin levantar un servidor HTTP. Usar `app.request()` que acepta una ruta o un objeto `Request`:

```typescript
import { describe, test, expect } from 'bun:test'
import app from './index'

describe('GET /resources', () => {
  test('devuelve lista vacía', async () => {
    const res = await app.request('/resources')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toEqual([])
  })
})

describe('POST /resources', () => {
  test('valida entrada requerida', async () => {
    const res = await app.request('/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // sin title
    })
    expect(res.status).toBe(400)
  })

  test('crea recurso con datos válidos', async () => {
    const res = await app.request('/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Mi recurso' }),
    })
    expect(res.status).toBe(201)
  })
})
```

### Tests con autenticación simulada

Para testear endpoints protegidos, crear un middleware de test que inyecte usuario y sesión en el contexto sin pasar por Better Auth:

```typescript
import { createMiddleware } from 'hono/factory'

const mockAuthMiddleware = createMiddleware<{
  Variables: { user: { id: string; role: string } | null; session: object | null }
}>(async (c, next) => {
  c.set('user', { id: 'test-user-id', role: 'editor' })
  c.set('session', { id: 'test-session-id' })
  await next()
})

// En el test, montar la sub-app con el mock
const testApp = new Hono()
testApp.use('*', mockAuthMiddleware)
testApp.route('/resources', resourcesApp)

const res = await testApp.request('/resources', { method: 'POST', /* ... */ })
```

### Convenciones de testing

- Todo test usa `bun:test` como runner (describe, test, expect)
- Los tests se ubican junto al código: `resources.test.ts` al lado de `resources.ts`
- Ninguna tarea de código puede marcarse como completada sin tests verdes (`bun test`)
- Happy path y errores principales siempre cubiertos

---

## Seguridad

### Sesiones

- Better Auth almacena sesiones en base de datos, no en JWT en localStorage
- Las cookies de sesión deben usar `HttpOnly`, `Secure` y `SameSite=Lax` como mínimo
- La verificación de sesión siempre pasa por `auth.api.getSession()` en el servidor

### Autorización

- Los permisos se definen con `createAccessControl` y se verifican con `auth.api.userHasPermission` en la capa de servicio
- Nunca confiar solo en middleware de ruta: verificar permisos en el servicio antes de ejecutar la operación
- Las acciones sensibles (publicar, eliminar) requieren verificación explícita del rol y permiso del usuario

### Validación de entrada

- Toda entrada del cliente se valida con Zod vía `zValidator` antes de llegar al handler
- Los parámetros de query siempre llegan como string; usar `z.coerce` para conversión
- Nunca confiar en metadata de uploads tus: validar en `onUploadCreate`

### Errores

- El handler global `app.onError` nunca expone stack traces ni detalles internos
- Los errores de negocio usan `HTTPException` con códigos HTTP semánticos
- Los errores de tus se mapean en `onResponseError` para observabilidad sin filtrar información sensible

### Uploads

- Verificar autenticación en `onIncomingRequest` antes de cada operación tus
- Validar tipo de archivo y metadata obligatoria en `onUploadCreate`
- Usar `disableTerminationForFinishedUploads: true` para evitar borrado de archivos completados
- En multi-instancia, usar `RedisLocker` para evitar escritura concurrente corrupta

---

## Checklist por endpoint

1. ¿Qué entidad toca?
2. ¿Qué permisos requiere? (definidos en el `statement` de access control)
3. ¿Qué valida en entrada? (schema Zod con `zValidator`)
4. ¿Qué devuelve en éxito? (tipo TypeScript explícito)
5. ¿Qué errores funcionales puede devolver? (`HTTPException` con código semántico)
6. ¿Qué prueba cubre el caso happy path? (`app.request()` con `bun:test`)
7. ¿Qué prueba cubre los errores principales? (validación, permisos, no encontrado)

## Estructura de salida para diseño de servicio

```
## Contexto funcional
## Endpoints (método, ruta, entrada Zod, salida tipada, errores HTTPException)
## Entidades afectadas (tablas Drizzle)
## Permisos necesarios (statement + roles)
## Middleware requerido (sesión, validación, custom)
## Pruebas requeridas (happy path, errores, permisos)
## Dependencias externas
```

## Regla

Todo desarrollo backend debe dejar definidos sus contratos de entrada, salida y error antes de escribir código. Contrato primero, implementación después.
