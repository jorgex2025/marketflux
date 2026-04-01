# Marketplace Multivendor

Monorepo pnpm + Turborepo. Stack: Next.js 16.2 · NestJS 11 · Drizzle · Neon · Better Auth · Stripe · MercadoPago · BullMQ · Meilisearch · Socket.io · Cloudflare R2.

## Setup local

```bash
make setup      # copia .env y hace pnpm install
make dev        # levanta Docker + api:3001 + web:3000
make migrate    # crea tablas en Postgres
make seed       # popula datos iniciales
```

## Apps
- `apps/web` — Next.js 16.2 App Router
- `apps/api` — NestJS 11 modular

## Packages
- `packages/types` — tipos compartidos
- `packages/validators` — Zod schemas compartidos
- `packages/eslint-config`
- `packages/typescript-config`

## Estado de fases
- [x] FASE 0 — Setup monorepo
- [ ] FASE 1 — Base de datos y seed
- [ ] FASE 2 — Auth, roles y auditoría
- [ ] FASE 3 — Catálogo y Storage
- [ ] FASE 4 — Inventario, carrito y órdenes
- [ ] FASE 5 — Pagos, comisiones y payouts
- [ ] FASE 6 — Reviews y reputación
- [ ] FASE 7 — Shipping, devoluciones y disputas
- [ ] FASE 8 — Chat y notificaciones
- [ ] FASE 9 — Cupones, banners y wishlist
- [ ] FASE 10 — Analytics y admin
- [ ] FASE 11 — Integración frontend completa
- [ ] FASE 12 — Deploy y CI/CD

## Costos fijos
~$3.32/mes (Fly.io). Stripe Connect Express solo cobra % por transferencia.
