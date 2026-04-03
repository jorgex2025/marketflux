# Fase 12 — Deploy & CI/CD

## Stack de Deploy

| Servicio | App | Plan |
|----------|-----|------|
| **Vercel** | `apps/web` (Next.js) | Hobby (gratis) |
| **Fly.io** | `apps/api` (NestJS) | Free Machines |
| **Neon** | PostgreSQL | Free Tier |
| **Upstash** | Redis (BullMQ) | Free Tier |
| **GitHub Actions** | CI/CD | Free (2000 min/mes) |

## Pipelines

### `deploy.yml` (push a main)
```
push → lint → type-check → test → build-api → deploy-api (Fly) → deploy-web (Vercel)
```

### `pr-checks.yml` (pull_request)
```
PR abierto → lint + type-check + build + security audit
```

## GitHub Secrets requeridos

Configurar en `Settings → Secrets and variables → Actions`:

| Secret | Descripción |
|--------|-------------|
| `FLY_API_TOKEN` | Token de Fly.io: `flyctl auth token` |
| `VERCEL_TOKEN` | Token de Vercel: Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | ID de tu organización en Vercel |
| `VERCEL_PROJECT_ID` | ID del proyecto web en Vercel |
| `DATABASE_URL` | URL de Neon (production) |
| `STRIPE_SECRET_KEY` | Stripe secret key (live) |
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` |

## Setup Fly.io

```bash
# 1. Instalar flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Crear app (primera vez)
flyctl apps create marketflux-api --org personal

# 4. Set secrets en Fly
flyctl secrets set \
  DATABASE_URL="postgresql://..." \
  BETTER_AUTH_SECRET="..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  REDIS_URL="rediss://..." \
  --app marketflux-api

# 5. Deploy manual (primera vez)
flyctl deploy --config fly.api.toml
```

## Setup Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Link proyecto
cd apps/web
vercel link

# 3. Set env vars en Vercel
vercel env add NEXT_PUBLIC_API_URL production
# → https://marketflux-api.fly.dev

# 4. Deploy manual (primera vez)
vercel --prod
```

## Docker (local)

```bash
# Build imagen API
docker build -f apps/api/Dockerfile -t marketflux-api .

# Run local
docker run -p 3001:3001 \
  -e DATABASE_URL="..." \
  -e BETTER_AUTH_SECRET="..." \
  marketflux-api

# Docker Compose completo
docker-compose up --build
```

## Environment Protection

- El job `deploy-api` y `deploy-web` requieren el environment `production` (configurar en GitHub repo settings).
- Esto permite agregar reviewers obligatorios antes de deployar a producción.

## Health Check

El API expone `GET /health` que retorna `{ status: 'ok', uptime: ... }`. Fly.io y el workflow lo usan para verificar disponibilidad post-deploy.
