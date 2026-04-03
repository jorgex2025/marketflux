# MarketFlux — Marketplace Multivendor

Monorepo `pnpm` + `Turborepo`. Stack 2026: Next.js 16 · NestJS 11 · Drizzle ORM · Neon PostgreSQL · Better Auth · Stripe Connect · BullMQ · Meilisearch · Socket.io · Cloudflare R2.

## Arquitectura

```
┌──────────────────────────────────────────────┐
Vercel  (apps/web — Next.js 16 App Router)
Routes: (shop)(auth)(account)(vendor)(admin)
└──────────────────────┤
                      │ HTTP / WebSocket
┌─────────────────────┤
Fly.io  (apps/api — NestJS 11)
REST /api  ·  WS /chat /notif
└──────────────────────────────────────────────┘
   │          │          │
Neon       Upstash    Meilisearch
Postgres   Redis       v1.13
(Drizzle)  (BullMQ)
                   Cloudflare R2 (media)
```

## Estructura del monorepo

```
marketflux/
├── apps/
│   ├── api/          # NestJS 11
│   └── web/          # Next.js 16
├── packages/
│   ├── types/        # ApiResponse<T>, UserRole, OrderStatus
│   ├── validators/   # Zod schemas compartidos
│   ├── monitoring/   # Sentry + Prometheus metrics
│   ├── eslint-config/
│   └── typescript-config/
├── infra/
│   ├── prometheus/   # prometheus.yml + alertas
│   └── grafana/      # dashboards JSON
├── docs/           # documentación por fase
├── .github/
│   └── workflows/
│       ├── deploy.yml      # CI/CD completo
│       ├── pr-checks.yml   # validación en PRs
│       └── uptime.yml      # ping cada 5 min
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml
├── fly.api.toml
└── .env.example
```

## Setup local rápido

```bash
git clone https://github.com/jorgex2025/marketflux
cd marketflux
make setup      # copia .env + pnpm install
make dev        # Docker (postgres+redis+meili) + api:3001 + web:3000
make migrate    # crea tablas en Postgres
make seed       # datos iniciales
```

## Estado de fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Monorepo setup (pnpm + Turborepo) | ✅ |
| 1 | Database schema (Drizzle + Neon) | ✅ |
| 2 | Auth, roles y auditía (Better Auth) | ✅ |
| 3 | Catálogo y storage (R2) | ✅ |
| 4 | Inventario, carrito y órdenes | ✅ |
| 5 | Pagos, comisiones y payouts (Stripe) | ✅ |
| 6 | Reviews y reputación | ✅ |
| 7 | Shipping, devoluciones y disputas | ✅ |
| 8 | Chat y notificaciones (Socket.io) | ✅ |
| 9 | Búsqueda (Meilisearch) + Queue (BullMQ) | ✅ |
| 10 | Analytics + Config + Audit admin | ✅ |
| 11 | Frontend integration — Seller & Admin | ✅ |
| 12 | Deploy & CI/CD (Fly.io + Vercel + Docker) | ✅ |
| 13 | Monitoring (Sentry + Prometheus + Grafana) | ✅ |

## GitHub Secrets requeridos

| Secret | Descripción |
|--------|-------------|
| `FLY_API_TOKEN` | `flyctl auth token` |
| `VERCEL_TOKEN` | Vercel Dashboard → Tokens |
| `VERCEL_ORG_ID` | ID org Vercel |
| `VERCEL_PROJECT_ID` | ID proyecto web Vercel |
| `DATABASE_URL` | Neon connection string |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` |
| `SENTRY_DSN` | Sentry project DSN |

## Costo estimado en producción

~$3.32/mes (Fly.io shared-cpu-1x 512MB). Todo lo demás en free tier.
