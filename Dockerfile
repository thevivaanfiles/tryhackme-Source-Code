# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:22-slim AS base
# openssl is required by Prisma; ca-certificates for TLS.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- build ----------
# Installs all deps (incl. dev), generates the Prisma client, and builds Next.
FROM base AS build
# Dummy values so the build never reaches for a real DB/secret. Real values are
# injected at runtime by docker-compose. Nothing here is baked into the image's
# runtime config.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
    AUTH_SECRET="build-time-placeholder"
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npx prisma generate \
  && npm run build

# ---------- runner ----------
# Carries the built app plus the full toolchain so the entrypoint can run
# `prisma migrate deploy` and the seed before starting Next.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build /app ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/uploads

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
