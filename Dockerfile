# Usamos la imagen oficial de Bun
FROM oven/bun:latest as base

# Establecer el directorio de trabajo
WORKDIR /app

# ---- Dependencias ----
FROM base AS install
# Copiamos solo los archivos que instalan dependencias para aprovechar la caché de Docker
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# ---- Construcción ----
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
# En caso de necesitar transpilado en un futuro, sería aquí.
# Por defecto con bun a menudo se corre el TS directo.

# ---- Producción ----
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Variables de entorno por defecto
ENV NODE_ENV=production

# Exponer el puerto por el que escuchará el API (si aplica)
EXPOSE 3000/tcp

# Ejecutar el proyecto
ENTRYPOINT [ "bun", "run", "index.ts" ]
