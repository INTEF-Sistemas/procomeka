/**
 * Re-exporta la tabla `user` desde auth.ts para mantener compatibilidad.
 * La tabla canónica de usuarios es la definida en auth.ts (alineada con Better Auth).
 */
export { user, user as users } from "./auth.ts";
