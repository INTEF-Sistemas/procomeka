---
name: seguridad-privacidad-legal
description: Rol de Seguridad, Privacidad y Legal. Usa este skill para evaluar riesgos de seguridad, cumplimiento RGPD, licencias de contenidos, moderación y auditoría en el contexto de una plataforma educativa pública.
metadata:
  author: procomeka
  version: "1.0"
---

> Última actualización: 2026-03-28

# Skill: Seguridad, Privacidad y Legal

## Rol

Actúas como responsable de seguridad y cumplimiento del proyecto.

## Misión

Reducir riesgos técnicos, legales y reputacionales en una plataforma educativa de titularidad o uso público.

## Marco normativo de referencia

- **RGPD** / LOPDGDD: protección de datos de usuarios
- **ENS** (Esquema Nacional de Seguridad): si la plataforma es de administración pública
- **LSSI-CE**: servicios de la sociedad de la información
- **Licencias Creative Commons**: para contenidos educativos abiertos
- **WCAG 2.2**: accesibilidad como requisito legal en sector público

## Debes revisar siempre

| Área | Qué evaluar |
|------|------------|
| Autenticación | Mecanismos, MFA, sesiones, tokens |
| Autorización | Roles, permisos, aislamiento de datos |
| Auditoría | Logs de acceso, cambios, exportaciones |
| Protección de datos | Minimización, consentimiento, retención, borrado |
| Moderación | Contenidos inapropiados, DMCA, propiedad intelectual |
| Licencias | Compatibilidad de licencias en recursos importados |
| APIs | Rate limiting, autenticación, exposición de datos |
| Dependencias | Vulnerabilidades en paquetes (npm audit, bun audit) |

## Salida esperada

```
## Riesgos identificados
| ID | Descripción | Severidad | Control propuesto |

## Decisiones necesarias
[Lo que necesita decidir un humano]

## Bloqueos legales reales
[Lo que no puede hacerse sin consulta legal]

## Puntos de revisión periódica
[Qué debe revisarse y con qué frecuencia]
```

## Regla

Distingue con claridad entre riesgo técnico, riesgo legal y política editorial. No bloquees el avance con riesgos hipotéticos; prioriza por probabilidad e impacto real.

---

## Stack de seguridad: Better Auth + Hono

> Referencia: documentación oficial de Better Auth (security, options, cookies, sso) y Hono (secure-headers, cors, cookie).

### Better Auth: Configuración de sesiones

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  session: {
    expiresIn: 604800,        // 7 días en segundos
    updateAge: 86400,          // refrescar token cada 24h
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 300,             // caché de cookie 5 min (reduce lecturas a BD)
    },
  },
});
```

- `expiresIn`: tiempo de vida de la sesión en segundos. Para una plataforma educativa pública, 7 días (604800) es razonable.
- `updateAge`: intervalo mínimo para refrescar la sesión. Evita escrituras en BD en cada petición.
- `cookieCache`: almacena datos de sesión en la propia cookie (firmada) para evitar consultas a BD en cada request. El `maxAge` controla cuánto tiempo se confía en la caché antes de verificar contra BD.

### Better Auth: Protección CSRF

Better Auth aplica múltiples capas de protección CSRF por defecto:

1. **Content-Type enforcement**: solo acepta requests con `Content-Type: application/json` (no formularios HTML simples).
2. **Origin header validation**: verifica que el header `Origin` coincida con el `baseURL` configurado o con orígenes en `trustedOrigins`.
3. **SameSite=Lax por defecto**: las cookies de sesión usan `SameSite=Lax`, que impide el envío de cookies en peticiones cross-site POST.
4. **GET requests son read-only**: las mutaciones (OAuth callbacks) requieren validación adicional de `nonce` y `state`.

```typescript
export const auth = betterAuth({
  baseURL: "https://procomeka.educacion.gob.es",
  trustedOrigins: [
    "https://procomeka.educacion.gob.es",
    "https://admin.procomeka.educacion.gob.es",
  ],
  advanced: {
    // NUNCA desactivar en producción
    disableCSRFCheck: false,
  },
});
```

### Better Auth: Rate limiting

Configuración nativa de rate limiting por path, sin dependencias externas:

```typescript
export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60,       // ventana de 60 segundos
    max: 100,         // máximo 100 peticiones por ventana
    storage: "memory", // "memory" o "database"
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,        // login: máximo 5 intentos por minuto
      },
      "/sign-up/email": {
        window: 300,
        max: 3,        // registro: máximo 3 por 5 minutos
      },
      "/forgot-password": {
        window: 300,
        max: 3,
      },
    },
  },
});
```

### Better Auth: Seguridad de cookies

```typescript
export const auth = betterAuth({
  advanced: {
    useSecureCookies: true,  // forzar Secure en todas las cookies (por defecto solo con HTTPS)
    defaultCookieAttributes: {
      httpOnly: true,        // inaccesible desde JavaScript del cliente
      secure: true,          // solo HTTPS
      sameSite: "lax",       // protección CSRF (default)
    },
    cookiePrefix: "procomeka", // prefijo personalizado para evitar colisiones
    // Cookies individuales con atributos específicos
    cookies: {
      session_token: {
        name: "procomeka_session",
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        },
      },
    },
  },
});
```

Hono soporta prefijos de cookie seguros `__Secure-` y `__Host-` que aplican restricciones adicionales del navegador:

- `__Secure-`: requiere `Secure=true` (solo HTTPS).
- `__Host-`: requiere `Secure=true`, `Path=/`, y prohíbe `Domain` (máxima restricción).

### Better Auth: SSO / OIDC

Para integración con proveedores OIDC institucionales (ej. educa, MEFP):

```typescript
import { betterAuth } from "better-auth";
import { sso } from "@better-auth/sso";

export const auth = betterAuth({
  plugins: [
    sso({
      redirectURI: "/sso/callback", // URI compartida para todos los proveedores OIDC
    }),
  ],
});
```

El `redirectURI` puede ser relativo (se concatena al `baseURL`) o absoluto. El `providerId` se almacena en el state de OAuth para identificar qué proveedor inició el flujo.

### Hono: Cabeceras de seguridad (secureHeaders)

```typescript
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

app.use(
  secureHeaders({
    // HSTS: forzar HTTPS durante 2 años + subdominios + preload list
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    // Impedir embebido en iframes ajenos (protección clickjacking)
    xFrameOptions: "DENY",
    // CSP adaptada a la plataforma
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],   // ajustar según framework CSS
      imgSrc: ["'self'", "data:", "https:"],      // recursos educativos externos
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],                 // equivalente a X-Frame-Options DENY
      upgradeInsecureRequests: [],                // forzar HTTPS en recursos mixtos
    },
  })
);
```

Cabeceras que aplica `secureHeaders()` por defecto:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (desactivado; CSP es la protección moderna)
- `Strict-Transport-Security` (si se configura)
- `Content-Security-Policy` (si se configura)
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

### Hono: CORS

```typescript
import { cors } from "hono/cors";

app.use(
  "/api/*",
  cors({
    origin: [
      "https://procomeka.educacion.gob.es",
      "https://admin.procomeka.educacion.gob.es",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Total-Count"],   // para paginación
    maxAge: 3600,                        // preflight cache 1h
    credentials: true,                   // permitir cookies cross-origin
  })
);
```

### Checklist OWASP para este stack

| Riesgo OWASP | Control en Better Auth + Hono |
|---------------|------------------------------|
| A01 Broken Access Control | Roles y permisos en Better Auth; middleware de autorización en Hono |
| A02 Cryptographic Failures | Better Auth firma cookies y tokens; HSTS fuerza HTTPS |
| A03 Injection | Bun SQL usa prepared statements automáticos; CSP previene XSS |
| A04 Insecure Design | Separación de capas auth/app; rate limiting nativo |
| A05 Security Misconfiguration | `secureHeaders()` aplica defaults seguros; cookies `httpOnly` + `Secure` |
| A06 Vulnerable Components | `bun audit` para verificar dependencias |
| A07 Auth Failures | Rate limiting en login/registro; MFA disponible como plugin |
| A08 Data Integrity Failures | CSRF protection multi-capa; `SameSite=Lax` por defecto |
| A09 Logging Failures | Auditar eventos de auth (login, logout, cambio de contraseña) |
| A10 SSRF | Validar URLs de recursos educativos externos antes de fetch |
