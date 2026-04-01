# Marketplace Multivendor

Monorepo pnpm + Turborepo. Stack: Next.js 16.2 · NestJS 11 · Drizzle · Neon · Better Auth · Stripe · MercadoPago · BullMQ · Meilisearch · Socket.io · Cloudflare R2.

## Arquitectura

```
┌─────────────────────────────────────────────┐
│  Cloudflare Workers (apps/web — Next.js 16) │
│  App Router: (shop)(auth)(account)(vendor)  │
│                    (admin)                  │
└───────────────────┬─────────────────────────┘
                    │ HTTP / WebSocket
┌───────────────────▼─────────────────────────┐
│        Fly.io  (apps/api — NestJS 11)       │
│  REST /api  ·  Socket.io /chat /notif       │
└──┬──────────┬──────────┬────────────────────┘
   │          │          │
Neon       Upstash    Meilisearch
Postgres   Redis       v1.13
(Drizzle)  (BullMQ)   (search)
                         │
                   Cloudflare R2
                   (media/files)
```

## Setup local

```bash
make setup      # copia .env y hace pnpm install
make dev        # levanta Docker + api:3001 + web:3000
make migrate    # crea tablas en Postgres (Drizzle push)
make seed       # popula datos iniciales
```

## Apps
- `apps/web` — Next.js 16.2 App Router + Tailwind + shadcn/ui
- `apps/api` — NestJS 11 modular

## Packages
- `packages/types` — `ApiResponse<T>`, `ApiPaginatedResponse<T>`, `UserRole`, `OrderStatus`
- `packages/validators` — Zod schemas: auth, product, order, common (paginación, UUID)
- `packages/eslint-config` — config ESLint compartida
- `packages/typescript-config` — `base.json` strict mode

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `REDIS_URL` | Redis local (Docker) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST (producción BullMQ) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash |
| `BETTER_AUTH_SECRET` | Secret JWT Better Auth, mínimo 32 chars |
| `BETTER_AUTH_URL` | URL base de la API para Better Auth |
| `STRIPE_SECRET_KEY` | Stripe secret `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret `whsec_...` |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Connect Express `ca_...` |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago access token `TEST-...` |
| `MERCADOPAGO_WEBHOOK_SECRET` | MercadoPago webhook HMAC secret |
| `MEILISEARCH_HOST` | URL Meilisearch |
| `MEILISEARCH_API_KEY` | Master key Meilisearch |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret |
| `R2_BUCKET_NAME` | Nombre del bucket R2 |
| `R2_PUBLIC_URL` | URL pública del bucket |
| `FRONTEND_URL` | URL del frontend (CORS) |
| `WS_CORS_ORIGIN` | Origen permitido para WebSocket |
| `NODE_ENV` | `development` \| `production` |
| `PORT` | Puerto de la API (default 3001) |

## Estructura API — endpoints por módulo

| Módulo | Endpoints principales | Fase |
|---|---|---|
| auth | POST /api/auth/sign-up, sign-in | 2 |
| categories | GET /api/categories (árbol), POST/PATCH/DELETE | 3 |
| products | GET/POST/PATCH/DELETE /api/products, bulk, import, export | 3 |
| storage | POST /api/storage/upload, DELETE /api/storage/:key | 3 |
| inventory | GET/PATCH /api/inventory/:productId | 4 |
| cart | GET/POST/PATCH/DELETE /api/cart | 4 |
| orders | POST/GET /api/orders | 4 |
| payments | POST /api/payments/stripe/intent, webhooks | 5 |
| commissions | GET/POST/PATCH/DELETE /api/commissions | 5 |
| payouts | GET/POST /api/payouts | 5 |
| reviews | GET/POST/PATCH/DELETE /api/reviews | 6 |
| reputation | GET /api/reputation/:sellerId | 6 |
| shipping | GET/POST /api/shipping/zones, methods, shipments | 7 |
| returns | POST/GET/PATCH /api/returns | 7 |
| disputes | POST/GET/PATCH /api/disputes | 7 |
| chat | GET/POST /api/chat/conversations + WS | 8 |
| notifications | GET/PATCH /api/notifications + WS | 8 |
| coupons | GET/POST/PATCH/DELETE /api/coupons | 9 |
| wishlists | GET/POST/DELETE /api/wishlist | 9 |
| banners | GET/POST/PATCH/DELETE /api/banners | 9 |
| analytics | GET /api/analytics/seller/*, admin/* | 10 |
| config | GET/PATCH /api/config | 10 |
| audit | GET /api/audit | 10 |

## Fórmula de reputación (Fase 6)

```
score = (avgRating / 5 * 100 * 0.4)
      + (responseRate * 100 * 0.2)
      + (fulfillmentRate * 100 * 0.3)
      - disputePenalty * 0.1

fulfillmentRate = fulfilledOrders / totalOrders
disputePenalty  = min(disputeCount * 5, 100)

badge:
  score < 30               → none
  score >= 30              → rising
  score >= 60 && avg >= 4  → trusted
  score >= 80 && avg >= 4.5 → top_seller
```

## Flujo de pago y payout

```
Buyer → POST /api/payments/stripe/intent
     ← clientSecret
Buyer → Stripe Elements confirma pago
Stripe → POST /api/payments/stripe/webhook
       → order.status = paid
       → inventory reservation = confirmed
       → stock decrementado
Admin  → POST /api/payouts/process (período)
       → net = gross - commission por order_items delivered
       → si store.stripe_account_id → stripe.transfers.create
       → si no → payout.status = pending
```

## Comandos del Makefile

| Comando | Acción |
|---|---|
| `make setup` | Copia `.env.example` y ejecuta `pnpm install` |
| `make dev` | Levanta Docker + turbo dev (api:3001, web:3000) |
| `make migrate` | Drizzle push — crea/actualiza tablas |
| `make seed` | Popula datos iniciales |
| `make build` | Build de todas las apps |
| `make lint` | ESLint en todas las apps |
| `make test` | Vitest en todas las apps |
| `make typecheck` | tsc --noEmit en todas las apps |

## Decisiones técnicas y desviaciones (FASE 0)

| # | Especificación original | Decisión aplicada | Motivo |
|---|---|---|---|
| 1 | Next.js 16.2.x | Se usó inicialmente `15.3.0`, corregido a `16.2.0` | Error de escritura en el primer commit |
| 2 | `Makefile dev` con `pnpm --filter api dev & pnpm --filter web dev` | Se usa `pnpm dev` vía turbo | Turborepo orquesta los procesos en paralelo; funcionalidad idéntica |
| 3 | Directorio `marketplace/` no existe en el árbol del prompt | Existe en `main` — es código legacy del repo anterior | **Pendiente de limpieza manual** antes de deploy. No afecta el workspace pnpm porque `pnpm-workspace.yaml` solo incluye `apps/*` y `packages/*` |

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
~$3.32/mes (Fly.io shared-cpu-1x 512MB). Stripe Connect Express solo cobra % por transferencia exitosa.
