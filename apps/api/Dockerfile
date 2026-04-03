# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Build NestJS
RUN pnpm --filter api run build

# Prune dev dependencies — solo prod node_modules
RUN pnpm --filter api deploy --prod /app/deploy

# ─── Stage 2: Runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

WORKDIR /app

# Copiar prod node_modules
COPY --from=builder --chown=nestjs:nodejs /app/deploy ./

# FIX #7: copiar dist/ compilado (era el bug crítico — sin esto node no encuentra main.js)
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist

USER nestjs

EXPOSE 3001

# FIX: path corregido a /api/health (NestJS tiene globalPrefix 'api')
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/main.js"]
