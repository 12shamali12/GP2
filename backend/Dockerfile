# DentyHub backend — production container image.
#
# Multi-stage build:
#   1. deps   — install all dependencies (incl. devDependencies needed for tsc).
#   2. build  — generate Prisma client + compile TypeScript to dist/.
#   3. runner — ship only the runtime artefacts on a slim Node 20 image.
#
# Final image is ~250 MB (Node 20 alpine + node_modules pruned to prod + dist).

# ============================================================================
# Stage 1 — install dependencies
# ============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm at the version we use locally (matches lockfile semantics).
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy only the manifests so Docker can cache this layer when only source
# changes. If package.json + lockfile don't change, npm install is skipped.
# .npmrc controls pnpm hoisting (shamefully-hoist=true so phantom-dep
# imports like `import express from "express"` resolve at runtime).
COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma ./prisma

# Install ALL deps (we need devDependencies for the Nest build step below).
# --frozen-lockfile ensures reproducibility across machines.
RUN pnpm install --frozen-lockfile

# ============================================================================
# Stage 2 — build the application
# ============================================================================
FROM node:20-alpine AS build
WORKDIR /app

# openssl is required for Prisma to pick the correct engine binary at generate
# time. Without it, Prisma falls back to openssl-1.1.x which Alpine 3.20+ does
# not ship, and the runtime then tries to download a replacement.
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Bring in deps from stage 1.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy the source.
COPY . .

# Generate the typed Prisma client BEFORE tsc — the build will fail without it.
RUN pnpm prisma generate

# Compile TypeScript to dist/ via nest build.
RUN pnpm build

# Prune devDependencies so only runtime deps make it to the runner stage.
RUN pnpm prune --prod

# ============================================================================
# Stage 3 — minimal runtime image
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# openssl: Prisma needs it at runtime too (the migrate-deploy step shells out
# to the schema engine, which links against libssl).
# tini: handles PID 1 signals properly (graceful shutdown on SIGTERM).
RUN apk add --no-cache openssl tini

# Bring in the compiled output + pruned deps + Prisma schema.
# The Prisma client lives inside node_modules/.prisma/client (default output),
# so copying node_modules is sufficient — no separate ./generated path.
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# main.ts creates this dir at startup for chat attachments. The container
# runs as the non-root `node` user, which can't write into /app (root-owned
# after COPY), so pre-create the path and hand it ownership.
RUN mkdir -p /app/uploads/chat && chown -R node:node /app/uploads

# Fly.io routes external traffic to the port we expose.
# main.ts reads process.env.PORT — keep them aligned.
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as a non-root user (Alpine ships a 'node' user out of the box).
USER node

# Apply pending Prisma migrations on container start, THEN start the server.
# `migrate deploy` is non-interactive and append-only — safe in production.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
