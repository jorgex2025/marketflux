# Deployment Guide

## Prerequisites

### Infrastructure

| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 16+ | Primary database (Neon recommended) |
| Redis | 7+ | Cache and job queue (Upstash recommended) |
| Meilisearch | v1.13 | Full-text search engine |
| Node.js | 20+ | Runtime environment |
| pnpm | 10.11.0+ | Package manager |

### Accounts Required

- **Neon** (PostgreSQL): https://neon.tech
- **Upstash** (Redis): https://upstash.com
- **Meilisearch Cloud** or self-hosted: https://www.meilisearch.com
- **Stripe**: https://stripe.com
- **Fly.io**: API deployment
- **Vercel**: Web deployment
- **Cloudflare R2**: File storage
- **Sentry**: Error monitoring

## Environment Variables

### API (apps/api/.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/marketflux?sslmode=require"

# Auth
BETTER_AUTH_SECRET="<generate with: openssl rand -hex 32>"
BETTER_AUTH_URL="https://api.marketflux.example.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis / BullMQ
REDIS_URL="rediss://default:password@host:6379"

# Meilisearch
MEILISEARCH_HOST="https://meilisearch.example.com"
MEILISEARCH_ADMIN_API_KEY="<your-master-key>"

# Storage (Cloudflare R2)
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="<access-key>"
S3_SECRET_ACCESS_KEY="<secret-key>"
S3_BUCKET_NAME="marketflux-uploads"

# Monitoring
SENTRY_DSN="https://<key>@o<org>.ingest.sentry.io/<project>"

# Application
NODE_ENV="production"
PORT="3001"
```

### Web (apps/web/.env.local)

```bash
# API
NEXT_PUBLIC_API_URL="https://api.marketflux.example.com"
NEXT_PUBLIC_APP_URL="https://marketflux.example.com"

# Stripe (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://<key>@o<org>.ingest.sentry.io/<project>"
```

## Local Development

```bash
# 1. Clone and install
git clone <repo-url>
cd marketflux
make setup

# 2. Start infrastructure
make docker-up

# 3. Run migrations
make migrate

# 4. Seed database
make seed

# 5. Start development servers
make dev
```

Access the application at:
- Frontend: http://localhost:3000
- API: http://localhost:3001/api

## Production Deployment

### Database Migrations

```bash
# Run Drizzle migrations
pnpm --filter api exec drizzle-kit push

# Or using Makefile
make migrate
```

### Seed Production Data (Optional)

```bash
pnpm --filter api exec tsx src/database/seed.ts
```

### Deploy API (Fly.io)

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Deploy
fly deploy --config fly.api.toml

# 4. Set secrets
fly secrets set DATABASE_URL="..." \
  BETTER_AUTH_SECRET="..." \
  STRIPE_SECRET_KEY="..." \
  REDIS_URL="..." \
  --config fly.api.toml
```

### Deploy Web (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy from apps/web directory
cd apps/web
vercel --prod
```

### Docker Compose (Self-hosted)

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: marketflux
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.13
    restart: always
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    volumes:
      - meilisearch_data:/meili_data
    ports:
      - "127.0.0.1:7700:7700"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/marketflux
      REDIS_URL: redis://redis:6379
      MEILISEARCH_HOST: http://meilisearch:7700
      MEILISEARCH_ADMIN_API_KEY: ${MEILI_MASTER_KEY}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      S3_ENDPOINT: ${S3_ENDPOINT}
      S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID}
      S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY}
      S3_BUCKET_NAME: ${S3_BUCKET_NAME}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
  meilisearch_data:
```

Deploy with:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR, push to main | Lint, typecheck, build, test |
| `deploy.yml` | Push to main | Build Docker, deploy API to Fly.io, deploy web to Vercel |
| `pr-checks.yml` | PR | Automated PR validation |
| `e2e.yml` | PR, push to main | End-to-end tests with Playwright |
| `uptime.yml` | Schedule | Service uptime monitoring |
| `auto-approve.yml` | PR | Auto-approve dependency PRs |

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `FLY_API_TOKEN` | Fly.io API authentication token |
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `NEXT_PUBLIC_API_URL` | Public API URL for frontend build |
| `NEXT_PUBLIC_APP_URL` | Public app URL for frontend build |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Deployment Flow

```
Push to main
    │
    ├──► Lint & Type-check
    │         │
    │         ▼
    │    Unit & Integration Tests
    │         │
    │         ├──► Build API Docker Image → GHCR
    │         │         │
    │         │         ▼
    │         │    Deploy API → Fly.io
    │         │
    │         └──► Build Web (Next.js)
    │                   │
    │                   ▼
    │              Deploy Web → Vercel
    │
    └──► E2E Tests (Playwright)
```

## Monitoring

### Health Checks

- API: `GET /api/health`
- Database: `GET /api/health/db`
- Redis: `GET /api/health/redis`

### Sentry

Errors are automatically reported to Sentry. Configure alerts in the Sentry dashboard.

### Logs

- **Fly.io**: `fly logs --config fly.api.toml`
- **Vercel**: `vercel logs <deployment-url>`
- **Docker**: `docker compose -f docker-compose.prod.yml logs -f`

## Rollback

### Fly.io (API)

```bash
# List deployments
fly deployments --config fly.api.toml

# Rollback to previous version
fly deploy --image ghcr.io/<org>/marketflux/api:sha-<previous-sha> --config fly.api.toml
```

### Vercel (Web)

```bash
# Rollback to previous deployment
vercel rollback --token ${VERCEL_TOKEN}
```
