# MarketFlux — Marketplace Multivendor

Monorepo full-stack construido con Next.js 16 + NestJS 11 + Drizzle ORM + Neon Postgres.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + Tailwind + shadcn/ui + TanStack Query |
| Backend | NestJS 11 modular |
| Auth | Better Auth 1.5 (Drizzle adapter) |
| DB | Neon Postgres + Drizzle ORM 0.44 |
| Cache/Colas | Upstash Redis + BullMQ 5 |
| Búsqueda | Meilisearch 1.13 |
| Pagos | Stripe Connect Express + MercadoPago |
| Real-time | Socket.io 4 + Redis pub/sub |
| Storage | Cloudflare R2 |
| Deploy API | Fly.io |
| Deploy Web | Cloudflare Workers (OpenNext) |
| Tests | Vitest 3 + Playwright |
| CI/CD | GitHub Actions |

## Quick Start

```bash
# 1. Setup
make setup

# 2. Levantar servicios docker
make docker-up

# 3. Migrar DB
make migrate

# 4. Seed
make seed

# 5. Dev
make dev
```

## Estructura

```
marketflux/
├── apps/
│   ├── web/        # Next.js 16
│   └── api/        # NestJS 11
├── packages/
│   ├── types/
│   ├── validators/
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json
├── docker-compose.yml
├── Makefile
└── wrangler.jsonc
```

## Fases completadas

- ✅ Fase 0 — Setup monorepo
- ✅ Fase 1 — Schema Drizzle (36 tablas) + seed
- ✅ Fase 2 — Auth + guards + audit
- ✅ Fase 3 — Catálogo + Storage R2 + Meilisearch
- ✅ Fase 4 — Inventario + Carrito + Órdenes
- ✅ Fase 5 — Stripe + MercadoPago + Payouts
- ✅ Fase 6 — Reviews + Reputación
- ✅ Fase 7 — Shipping + Returns + Disputes
- ✅ Fase 8 — Chat WebSocket + Notificaciones
- ✅ Fase 9 — Meilisearch avanzado + BullMQ processors
- ✅ Fase 10 — Analytics + Config + Audit
- ✅ Fase 11 — Frontend completo (dashboards + páginas)
- ✅ Fase 12 — CI/CD + Docker + Fly.io + Vercel
- ✅ Fase 13 — Monitoring (Sentry + Prometheus + Grafana)
- ✅ Fase 14 — E2E Tests (Playwright + POM)

## Desviaciones documentadas

- Deploy web usa Vercel en lugar de Cloudflare Workers (migración pendiente con wrangler.jsonc)
- `auto-approve.yml` movido desde raíz a `.github/workflows/`
- Resuelto conflicto de merge en `apps/api/package.json` y `apps/web/package.json`; añadidos `@nestjs/testing` y eliminado `@radix-ui/react-badge` no disponible.
- Para pasar las pruebas de seed es necesario ejecutar servicios de DB (Postgres/Neon) accesibles y migraciones actualizadas (actualmente `ECONNREFUSED 127.0.0.1:5432`).
