Prompt Mastro:

## Prompt corregido (v7)

Trabaja estrictamente una fase a la vez; no avances hasta que la fase actual compile, corra y pase su checklist. Respeta el Ã¡rbol de carpetas, las versiones fijadas y TypeScript estricto sin any. Si hay ambigÃ¼edad, elige la soluciÃ³n mÃ¡s simple. Si durante la implementaciÃ³n encuentras una inconsistencia o incompatibilidad real entre librerÃ­as, frameworks, SDKs, versiones o infraestructura, puedes apartarte de la instrucciÃ³n exacta y aplicar una soluciÃ³n alternativa siempre que sea estable, mantenible, compatible con las fases siguientes y cumpla el objetivo funcional de la fase; toda desviaciÃ³n debe documentarse en el README y reportarse al cerrar la fase. Prioriza cambios pequeÃ±os, verificables y reversibles, y antes de dar una fase por terminada ejecuta typecheck, lint, build y las validaciones necesarias, reportando el resultado.

```markdown
# ðŸš€ Marketplace Multivendor â€” Prompt de Desarrollo por Fases (v7)

## REGLAS GLOBALES

1. Ejecuta una fase a la vez. No avances hasta que compile, corra y pase su checklist.
2. Ante ambigÃ¼edad, elige lo mÃ¡s simple y documÃ©ntalo en el README.
3. Si durante la implementaciÃ³n aparece una inconsistencia, incompatibilidad real entre librerÃ­as, limitaciÃ³n del framework o conflicto tÃ©cnico con la especificaciÃ³n, el agente puede apartarse de la instrucciÃ³n exacta y aplicar la soluciÃ³n mÃ¡s simple, estable y mantenible que cumpla el objetivo funcional de la fase.
4. Toda desviaciÃ³n respecto a la especificaciÃ³n original debe quedar documentada en el README y explicarse brevemente al cerrar la fase.
5 TypeScript estricto (`strict: true`). Cero `any` â€” usar `unknown` + type guards.
6. Convenciones: snake_case en BD, camelCase en TypeScript.
7. Cada mÃ³dulo NestJS sigue esta estructura interna:
   ```
   modulo/
   â”œâ”€â”€ modulo.module.ts
   â”œâ”€â”€ modulo.controller.ts
   â”œâ”€â”€ modulo.service.ts
   â”œâ”€â”€ dto/
   â”‚   â”œâ”€â”€ create-modulo.dto.ts
   â”‚   â””â”€â”€ update-modulo.dto.ts
   â””â”€â”€ modulo.guard.ts          # solo si tiene guards propios
   ```
8. Formato estÃ¡ndar de respuesta API:
   ```typescript
   // Ã‰xito singular
   { data: T }

   // Ã‰xito paginado
   { data: T[], meta: { page: number, limit: number, total: number, totalPages: number } }

   // Error
   { error: { code: string, message: string, details?: unknown } }
   ```

   Excepciones (no usan el formato estÃ¡ndar):
   - **Webhooks** (Stripe/MP): retornan `200` con `{ received: true }` o body vacÃ­o
   - **`GET /api/products/export`**: stream CSV con `Content-Type: text/csv`
   - **`POST /api/storage/upload`**: acepta `multipart/form-data`, retorna `{ data: { url, key } }`
   - **`POST /api/products/import`**: acepta `multipart/form-data`
   - **WebSocket events**: no son HTTP, usan payload propio del evento
   - **`GET /api/health`**: retorna `{ status: 'ok', timestamp }` directamente

9 Tests: Vitest para unit tests, cada fase debe tener al menos tests de los services principales.
   Formato: `modulo.service.spec.ts` junto al service.

---

## STACK (fuente Ãºnica de verdad)
## STACK (fuente Ãºnica de verdad)

| Capa              | TecnologÃ­a                                    | VersiÃ³n        |
| ----------------- | --------------------------------------------- | -------------- |
| Frontend          | Next.js + Tailwind + shadcn/ui + TanStack Query | 16.2.x / React 19 |
| Backend           | NestJS modular                                | 11.x           |
| Auth              | Better Auth (self-hosted, Drizzle adapter)    | 1.5.x          |
| DB                | Neon Postgres + Drizzle ORM                   | Drizzle 0.44.x |
| Cache / Colas     | Upstash Redis + BullMQ                        | BullMQ 5.x     |
| BÃºsqueda          | Meilisearch                                   | 1.13.x         |
| Pagos             | Stripe Connect Express + MercadoPago          | Stripe SDK 21.x |
| Real-time         | Socket.io + Redis pub/sub                     | Socket.io 4.x  |
| Storage           | Cloudflare R2 (S3-compatible)                 | â€”              |
| Deploy API        | Fly.io (shared-cpu-1x 512MB, ~$3.32/mes)     | flyctl         |
| Deploy Web        | Cloudflare Workers vÃ­a @opennextjs/cloudflare | wrangler       |
| Tests             | Vitest                                        | 3.x            |
| CI/CD             | GitHub Actions                                | â€”              |

> **Costos fijos:** ~$3.32/mes (Fly.io). Stripe Connect Express solo cobra % por transferencia.
> **Versiones fijadas.** Solo actualizar si hay incompatibilidad documentada.
> No usar betas ni release candidates.

---

## ÃRBOL DE CARPETAS (contrato)

```
marketplace/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ web/                                         # Next.js
â”‚   â”‚   â”œâ”€â”€ middleware.ts                            # auth + maintenance guard
â”‚   â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ login/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ register/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ forgot-password/page.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ verify-email/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ (shop)/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx                         # ISR revalidate:60
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ search/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ products/[slug]/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ stores/[slug]/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ categories/[slug]/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ cart/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ checkout/page.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ orders/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ page.tsx
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ [id]/page.tsx
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ [id]/return/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ (account)/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx                       # protegido: cualquier usuario autenticado
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ profile/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ addresses/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ wishlist/page.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ settings/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ (vendor)/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx                       # protegido: seller|admin
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ onboarding/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ products/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ new/page.tsx
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ [id]/edit/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ inventory/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ orders/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ returns/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ payouts/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ reviews/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ chat/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ coupons/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ shipping/page.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ store/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ (admin)/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx                       # protegido: admin
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ products/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ orders/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ users/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ vendors/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ commissions/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ payouts/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ reviews/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ disputes/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ returns/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ reports/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ categories/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ banners/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ coupons/page.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ audit/page.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ config/page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ sitemap.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ robots.ts
â”‚   â”‚   â”‚   â””â”€â”€ api/auth/[...all]/route.ts
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ ui/                                  # shadcn/ui
â”‚   â”‚   â”‚   â”œâ”€â”€ product-card.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ product-variant-picker.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ cart-drawer.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ search-bar.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ review-card.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ review-form.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ star-rating.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ vendor-card.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ reputation-badge.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ chat-window.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ notification-bell.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ bulk-action-bar.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ banner-carousel.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ flash-sale-countdown.tsx
â”‚   â”‚   â”‚   â””â”€â”€ stats/
â”‚   â”‚   â”‚       â”œâ”€â”€ kpi-card.tsx
â”‚   â”‚   â”‚       â”œâ”€â”€ revenue-chart.tsx
â”‚   â”‚   â”‚       â”œâ”€â”€ orders-chart.tsx
â”‚   â”‚   â”‚       â”œâ”€â”€ commission-chart.tsx
â”‚   â”‚   â”‚       â””â”€â”€ top-products-table.tsx
â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â”œâ”€â”€ use-auth.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ use-cart.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ use-socket.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ use-debounce.ts
â”‚   â”‚   â”‚   â””â”€â”€ use-infinite-products.ts
â”‚   â”‚   â”œâ”€â”€ stores/
â”‚   â”‚   â”‚   â”œâ”€â”€ cart-store.ts                        # Zustand
â”‚   â”‚   â”‚   â””â”€â”€ notification-store.ts
â”‚   â”‚   â””â”€â”€ lib/
â”‚   â”‚       â”œâ”€â”€ api-client.ts
â”‚   â”‚       â”œâ”€â”€ auth-client.ts
â”‚   â”‚       â”œâ”€â”€ query-client.ts
â”‚   â”‚       â””â”€â”€ socket-client.ts
â”‚   â”‚
â”‚   â””â”€â”€ api/                                         # NestJS 11.x
â”‚       â”œâ”€â”€ Dockerfile
â”‚       â”œâ”€â”€ vitest.config.ts
â”‚       â””â”€â”€ src/
â”‚           â”œâ”€â”€ main.ts
â”‚           â”œâ”€â”€ app.module.ts
â”‚           â”œâ”€â”€ common/
â”‚           â”‚   â”œâ”€â”€ decorators/
â”‚           â”‚   â”‚   â”œâ”€â”€ roles.decorator.ts
â”‚           â”‚   â”‚   â””â”€â”€ public.decorator.ts
â”‚           â”‚   â”œâ”€â”€ guards/
â”‚           â”‚   â”‚   â”œâ”€â”€ auth.guard.ts
â”‚           â”‚   â”‚   â”œâ”€â”€ roles.guard.ts
â”‚           â”‚   â”‚   â””â”€â”€ maintenance.guard.ts
â”‚           â”‚   â”œâ”€â”€ interceptors/
â”‚           â”‚   â”‚   â””â”€â”€ audit.interceptor.ts
â”‚           â”‚   â”œâ”€â”€ pipes/
â”‚           â”‚   â”‚   â””â”€â”€ parse-uuid.pipe.ts
â”‚           â”‚   â””â”€â”€ filters/
â”‚           â”‚       â””â”€â”€ http-exception.filter.ts
â”‚           â”œâ”€â”€ storage/
â”‚           â”‚   â”œâ”€â”€ storage.module.ts
â”‚           â”‚   â”œâ”€â”€ storage.controller.ts
â”‚           â”‚   â””â”€â”€ storage.service.ts               # R2/S3 upload
â”‚           â”œâ”€â”€ auth/
â”‚           â”‚   â”œâ”€â”€ auth.module.ts
â”‚           â”‚   â”œâ”€â”€ auth.controller.ts
â”‚           â”‚   â””â”€â”€ auth.service.ts
â”‚           â”œâ”€â”€ vendors/
â”‚           â”œâ”€â”€ products/
â”‚           â”œâ”€â”€ inventory/
â”‚           â”œâ”€â”€ categories/
â”‚           â”œâ”€â”€ reviews/
â”‚           â”œâ”€â”€ reputation/
â”‚           â”œâ”€â”€ orders/
â”‚           â”œâ”€â”€ payments/
â”‚           â”œâ”€â”€ commissions/
â”‚           â”œâ”€â”€ payouts/
â”‚           â”œâ”€â”€ shipping/
â”‚           â”œâ”€â”€ returns/
â”‚           â”œâ”€â”€ disputes/
â”‚           â”œâ”€â”€ coupons/
â”‚           â”œâ”€â”€ wishlists/
â”‚           â”œâ”€â”€ chat/
â”‚           â”‚   â”œâ”€â”€ chat.module.ts
â”‚           â”‚   â”œâ”€â”€ chat.controller.ts
â”‚           â”‚   â”œâ”€â”€ chat.service.ts
â”‚           â”‚   â””â”€â”€ chat.gateway.ts                  # WebSocket
â”‚           â”œâ”€â”€ notifications/
â”‚           â”‚   â”œâ”€â”€ notifications.module.ts
â”‚           â”‚   â”œâ”€â”€ notifications.controller.ts
â”‚           â”‚   â”œâ”€â”€ notifications.service.ts
â”‚           â”‚   â””â”€â”€ notifications.gateway.ts         # WebSocket
â”‚           â”œâ”€â”€ analytics/
â”‚           â”œâ”€â”€ search/
â”‚           â”œâ”€â”€ banners/
â”‚           â”œâ”€â”€ config/
â”‚           â”œâ”€â”€ audit/
â”‚           â”œâ”€â”€ reports/
â”‚           â”œâ”€â”€ queue/
â”‚           â”‚   â”œâ”€â”€ queue.module.ts
â”‚           â”‚   â””â”€â”€ processors/
â”‚           â”‚       â”œâ”€â”€ bulk.processor.ts
â”‚           â”‚       â”œâ”€â”€ reputation.processor.ts
â”‚           â”‚       â”œâ”€â”€ reservation-cleanup.processor.ts
â”‚           â”‚       â”œâ”€â”€ notification.processor.ts
â”‚           â”‚       â”œâ”€â”€ payment.processor.ts
â”‚           â”‚       â”œâ”€â”€ payout.processor.ts
â”‚           â”‚       â”œâ”€â”€ inventory-alert.processor.ts
â”‚           â”‚       â””â”€â”€ indexing.processor.ts
â”‚           â””â”€â”€ database/
â”‚               â”œâ”€â”€ database.module.ts
â”‚               â”œâ”€â”€ migrations/
â”‚               â”œâ”€â”€ seed.ts
â”‚               â””â”€â”€ schema/
â”‚                   â”œâ”€â”€ index.ts                     # re-exporta todo en orden
â”‚                   â”œâ”€â”€ auth.schema.ts               # users, sessions, accounts
â”‚                   â”œâ”€â”€ catalog.schema.ts             # categories, category_attributes, products, product_variants
â”‚                   â”œâ”€â”€ inventory.schema.ts           # inventory_reservations, inventory_alerts, carts, cart_items
â”‚                   â”œâ”€â”€ orders.schema.ts              # orders, order_items
â”‚                   â”œâ”€â”€ payments.schema.ts            # payments, commissions, payouts, payout_items
â”‚                   â”œâ”€â”€ shipping.schema.ts            # shipping_zones, shipping_methods, shipments
â”‚                   â”œâ”€â”€ reviews.schema.ts             # reviews, review_helpful, seller_reputation, returns, return_items, disputes
â”‚                   â”œâ”€â”€ chat.schema.ts                # conversations, messages, notifications
â”‚                   â””â”€â”€ config.schema.ts              # wishlists, wishlist_items, coupons, coupon_usage, banners, marketplace_config, audit_logs, reports
â”‚
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ types/src/index.ts                           # tipos compartidos web â†” api
â”‚   â”œâ”€â”€ validators/src/                              # Zod schemas compartidos
â”‚   â”‚   â”œâ”€â”€ index.ts
â”‚   â”‚   â”œâ”€â”€ product.ts
â”‚   â”‚   â”œâ”€â”€ order.ts
â”‚   â”‚   â”œâ”€â”€ auth.ts
â”‚   â”‚   â””â”€â”€ common.ts                               # paginaciÃ³n, UUID, etc.
â”‚   â”œâ”€â”€ eslint-config/index.js
â”‚   â””â”€â”€ typescript-config/base.json
â”œâ”€â”€ turbo.json
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ wrangler.jsonc                                   # @opennextjs/cloudflare config
â”œâ”€â”€ fly.toml
â”œâ”€â”€ Makefile
â”œâ”€â”€ .github/workflows/ci.yml
â”œâ”€â”€ .github/workflows/deploy.yml
â””â”€â”€ README.md
```

---

## VARIABLES DE ENTORNO

**`apps/api/.env.example`**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BETTER_AUTH_SECRET=change-this-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3001
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=marketplace-uploads
R2_PUBLIC_URL=
FRONTEND_URL=http://localhost:3000
WS_CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=3001
```

**`apps/web/.env.local.example`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=change-this-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3001
```

---

## docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: marketplace
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.13
    ports: ["7700:7700"]
    environment:
      MEILI_MASTER_KEY: masterKey
    volumes: [meilisearch_data:/meili_data]

volumes:
  postgres_data:
  meilisearch_data:
```

---

## Makefile

```makefile
.PHONY: setup dev migrate seed build lint test

setup:
	cp apps/api/.env.example apps/api/.env
	cp apps/web/.env.local.example apps/web/.env.local
	pnpm install

dev:
	docker compose up -d
	pnpm --filter api dev &
	pnpm --filter web dev

migrate:
	pnpm --filter api drizzle-kit push

seed:
	pnpm --filter api tsx src/database/seed.ts

build:
	pnpm -r build

lint:
	pnpm -r lint

test:
	pnpm -r test
```

---

## FASES

### FASE 0 â€” Setup del monorepo

**Objetivo:** Monorepo funcional. Sin lÃ³gica de negocio.

**Tareas:**
1. Inicializar pnpm workspace con `apps/web`, `apps/api`, `packages/*`
2. Configurar `turbo.json` con tasks: build, dev, lint, test
3. Next.js con App Router + Tailwind + shadcn/ui inicializado
4. NestJS con estructura base (main.ts, app.module.ts)
5. Crear TODOS los archivos del Ã¡rbol con contenido placeholder:
   - Pages: `export default function Page() { return <div>TODO</div> }`
   - Modules NestJS: `@Module({}) export class XModule {}`
   - Schema files: `// TODO: Fase 1`
6. `packages/types`, `packages/validators`, `packages/eslint-config`, `packages/typescript-config`
7. docker-compose.yml, Makefile, .env files
8. `.github/workflows/ci.yml` y `deploy.yml` (estructura base)

**Checklist:**
- [ ] `pnpm install` sin errores
- [ ] `docker compose up -d` levanta postgres, redis y meilisearch
- [ ] `pnpm dev` arranca api en :3001 y web en :3000
- [ ] `tsc --noEmit` pasa en ambas apps
- [ ] ESLint pasa sin errores
- [ ] Todos los archivos del Ã¡rbol existen (verificar con `find`)

---

### FASE 1 â€” Base de datos y seed

**Objetivo:** Schema Drizzle completo + migraciÃ³n + seed funcional.

**Orden de implementaciÃ³n de schemas** (resuelve dependencias):
1. `auth.schema.ts` â€” users (no depende de nada)
2. `config.schema.ts` â€” marketplace_config, audit_logs, banners, coupons, coupon_usage, wishlists, wishlist_items, reports
3. `catalog.schema.ts` â€” categories, category_attributes, stores (â†’users), products (â†’users, stores, categories), product_variants
4. `shipping.schema.ts` â€” shipping_zones, shipping_methods, shipments
5. `orders.schema.ts` â€” orders (â†’users, coupons, shipping_methods), order_items
6. `payments.schema.ts` â€” payments, commissions, payouts, payout_items
7. `inventory.schema.ts` â€” inventory_reservations (â†’products, variants, orders), inventory_alerts, carts, cart_items
8. `reviews.schema.ts` â€” reviews, review_helpful, seller_reputation, returns, return_items, disputes
9. `chat.schema.ts` â€” conversations, messages, notifications

**Schema completo:** (usar la especificaciÃ³n de tablas del documento anterior â€” 36 tablas total)

**Seed mÃ­nimo:**
- 1 admin, 2 sellers, 3 buyers (6 users)
- 2 stores activas
- 3 categorÃ­as con jerarquÃ­a (ElectrÃ³nica â†’ Celulares, Ropa)
- 5 productos con variantes, stock > 0, distribuidos entre las 2 stores
- 2 Ã³rdenes: 1 con status='paid', 1 con status='delivered'
- 1 review aprobada en el producto de la orden delivered
- 1 cupÃ³n activo (10% descuento, code='WELCOME10')
- 1 banner activo (position='hero')
- marketplace_config con: commission_global_rate=0.10, maintenance_mode=false,
  review_auto_approve=false, payout_schedule='biweekly', vendor_onboarding_mode='manual'

**Checklist:**
- [ ] `make migrate` crea todas las tablas sin errores
- [ ] `make seed` popula sin errores (idempotente â€” puede correrse mÃºltiples veces)
- [ ] `SELECT count(*) FROM information_schema.tables WHERE table_schema='public'` â‰¥ 36
- [ ] `SELECT count(*) FROM users` = 6
- [ ] `SELECT count(*) FROM products` = 5
- [ ] Tests: seed.spec.ts verifica conteos post-seed

---

### FASE 2 â€” AutenticaciÃ³n, roles y auditorÃ­a

**Objetivo:** Auth funcional + guards + audit automÃ¡tico + pÃ¡ginas de auth en frontend.

**Backend:**
- Better Auth con Drizzle adapter en `auth.service.ts`
- `common/guards/auth.guard.ts` â€” valida sesiÃ³n Better Auth
- `common/guards/roles.guard.ts` â€” chequea `@Roles('admin')`
- `common/guards/maintenance.guard.ts` â€” si `maintenance_mode=true`, retorna 503 a no-admins
- `common/decorators/roles.decorator.ts` â€” `@Roles(...roles)`
- `common/decorators/public.decorator.ts` â€” `@Public()` excluye de auth
- `common/interceptors/audit.interceptor.ts` â€” POST/PATCH/DELETE â†’ audit_logs
- `common/filters/http-exception.filter.ts` â€” formato de error estÃ¡ndar
- `GET /api/health` â€” `@Public()`, retorna `{ status: 'ok', timestamp }`
- `main.ts`: ValidationPipe global, CORS (FRONTEND_URL), rate limiting (100/min global, 10/min payments)

**Frontend:**
- `middleware.ts` â€” protege rutas (account), (vendor), (admin), checkout, orders
- `(auth)/login/page.tsx` â€” formulario funcional
- `(auth)/register/page.tsx` â€” formulario funcional, rol buyer por defecto
- `(auth)/forgot-password/page.tsx` â€” placeholder funcional
- `(auth)/verify-email/page.tsx` â€” placeholder funcional
- `lib/auth-client.ts` â€” Better Auth client configurado
- `hooks/use-auth.ts` â€” hook para session/user/logout

**Checklist:**
- [ ] `POST /api/auth/sign-up` crea usuario con rol buyer
- [ ] `POST /api/auth/sign-in` retorna sesiÃ³n vÃ¡lida
- [ ] Ruta protegida retorna 401 sin sesiÃ³n
- [ ] Ruta admin retorna 403 para buyer
- [ ] `GET /api/health` retorna 200 sin auth
- [ ] MutaciÃ³n autenticada genera registro en audit_logs
- [ ] Frontend: login â†’ redirect a home con sesiÃ³n activa
- [ ] Frontend: acceso a /vendor/dashboard sin auth â†’ redirect a /login
- [ ] Tests: auth.service.spec.ts, auth.guard.spec.ts

---

### FASE 3 â€” CatÃ¡logo, categorÃ­as y tiendas + Storage

**Objetivo:** CRUD completo de catÃ¡logo + bÃºsqueda Meilisearch + uploads R2.

**Backend â€” Storage (implementar primero, lo necesitan products e stores):**
```
POST   /api/storage/upload          [auth] multipart â†’ R2, retorna { url, key }
DELETE /api/storage/:key            [auth] elimina de R2
```

**Backend â€” CategorÃ­as:**
```
GET    /api/categories                              [pÃºblico â€” Ã¡rbol]
GET    /api/categories/:id/attributes               [pÃºblico]
POST   /api/categories                              [admin]
PATCH  /api/categories/:id                          [admin]
DELETE /api/categories/:id                          [admin]
POST   /api/categories/:id/attributes               [admin]
PATCH  /api/categories/:id/attributes/:attrId       [admin]
DELETE /api/categories/:id/attributes/:attrId       [admin]
```

**Backend â€” Tiendas:**
```
GET    /api/stores?page=&limit=&status=             [pÃºblico]
GET    /api/stores/:slug                            [pÃºblico]
GET    /api/stores/:slug/products                   [pÃºblico]
GET    /api/stores/:slug/reviews                    [pÃºblico]
PATCH  /api/stores/me                               [seller]
GET    /api/stores/me/stats                         [seller]
POST   /api/stores/onboarding                       [seller] { step, data }
```

**Backend â€” Productos:**
```
GET    /api/products?q=&category=&store=&minPrice=&maxPrice=&rating=&featured=&page=&limit=  [pÃºblico]
GET    /api/products/:slug                          [pÃºblico]
POST   /api/products                                [seller|admin]
PATCH  /api/products/:id                            [seller(propietario)|admin]
DELETE /api/products/:id                            [admin]
POST   /api/products/bulk                           [seller|admin] â†’ BullMQ jobId
GET    /api/products/bulk/:jobId/status              [seller|admin]
POST   /api/products/import                         [seller|admin] multipart CSV
GET    /api/products/export                         [seller|admin] CSV download
```

**Backend â€” Variantes:**
```
GET    /api/products/:id/variants                   [pÃºblico]
POST   /api/products/:id/variants                   [seller|admin]
PATCH  /api/products/:id/variants/:vid              [seller|admin]
DELETE /api/products/:id/variants/:vid              [seller|admin]
```

**Meilisearch:** Al crear/actualizar/eliminar producto â†’ sincronizar con Meilisearch.
`GET /api/products?q=` delega a Meilisearch cuando `q` estÃ¡ presente.

**Frontend:**
- `(shop)/page.tsx` â€” grid de productos, filtros, ISR revalidate:60
- `(shop)/search/page.tsx` â€” resultados de bÃºsqueda con Meilisearch
- `(shop)/products/[slug]/page.tsx` â€” detalle + variantes + galerÃ­a de imÃ¡genes
- `(shop)/stores/[slug]/page.tsx` â€” storefront pÃºblico
- `(shop)/categories/[slug]/page.tsx` â€” listado filtrado
- Componentes: `product-card`, `product-variant-picker`, `search-bar`, `vendor-card`
- `hooks/use-infinite-products.ts` â€” infinite scroll / load more
- `hooks/use-debounce.ts` â€” para search

**Checklist:**
- [ ] Upload de imagen retorna URL pÃºblica accesible
- [ ] `GET /api/categories` retorna Ã¡rbol con children anidados
- [ ] `GET /api/products?category=X` filtra correctamente
- [ ] `GET /api/products?q=celular` retorna resultados de Meilisearch
- [ ] `GET /api/stores/:slug` retorna tienda con stats
- [ ] PaginaciÃ³n funciona: `?page=2&limit=10`
- [ ] Frontend renderiza productos desde API real
- [ ] Bulk action retorna jobId, status endpoint refleja progreso
- [ ] Tests: products.service.spec.ts, categories.service.spec.ts

---

### FASE 4 â€” Inventario, carrito y Ã³rdenes

**Objetivo:** Flujo completo carrito â†’ orden con reserva de inventario.

**Backend â€” Inventario:**
```
GET    /api/inventory/:productId                    [seller]
PATCH  /api/inventory/:productId                    [seller] { stock }
PATCH  /api/inventory/:productId/variants/:vid      [seller] { stock }
GET    /api/inventory/alerts                        [seller]
POST   /api/inventory/alerts                        [seller] { productId, variantId?, threshold }
DELETE /api/inventory/alerts/:id                    [seller]
```

**Backend â€” Carrito:**
```
GET    /api/cart                                    [auth]
POST   /api/cart/items                              [auth] { productId, variantId?, qty }
PATCH  /api/cart/items/:id                          [auth] { qty }
DELETE /api/cart/items/:id                          [auth]
POST   /api/cart/coupon                             [auth] { code }
DELETE /api/cart/coupon                             [auth]
```

**Backend â€” Ã“rdenes:**
```
POST   /api/orders                                  [auth] â€” crea desde carrito
GET    /api/orders                                  [auth] â€” historial del user
GET    /api/orders/:id                              [auth]
PATCH  /api/orders/:id/cancel                       [buyer, solo status=pending]
GET    /api/orders/:id/items/:itemId/review-eligible [auth]
```

**Flujo de inventario (contrato obligatorio):**
1. `POST /api/orders` â†’ crea `inventory_reservations` con `expires_at = now + 15min`, `status='reserved'`
2. Webhook de pago confirmado â†’ `status='confirmed'`, descontar `stock` real del producto/variante
3. CancelaciÃ³n â†’ `status='released'`, restaurar stock
4. `reservation-cleanup.processor` (BullMQ cron cada 5min) â†’ libera reservas con `expires_at < now AND status='reserved'`
5. `commission_rate` en `order_items` se captura al crear la orden (snapshot inmutable)

**Frontend:**
- `(shop)/cart/page.tsx` â€” con `cart-drawer.tsx` + cupÃ³n
- `(shop)/checkout/page.tsx` â€” placeholder (se conecta a pago en Fase 5)
- `(shop)/orders/page.tsx` â€” historial del comprador
- `(shop)/orders/[id]/page.tsx` â€” detalle con tracking
- `stores/cart-store.ts` â€” Zustand store para estado local del carrito
- `hooks/use-cart.ts`

**Checklist:**
- [ ] Agregar item al carrito y crear orden reserva stock
- [ ] No permite overselling (qty > stock disponible - reservado)
- [ ] Cancelar orden libera reserva y restaura stock
- [ ] Cron libera reservas expiradas (testear con expires_at en el pasado)
- [ ] `commission_rate` en order_items es inmutable post-creaciÃ³n
- [ ] Frontend: cart page muestra items con totales correctos
- [ ] Tests: orders.service.spec.ts, inventory.service.spec.ts

---

### FASE 5 â€” Pagos, comisiones y payouts

**Objetivo:** Stripe + MercadoPago integrados. Comisiones calculadas. Payouts funcionales.

**Backend â€” Pagos:**
```
POST   /api/payments/stripe/intent                  [auth] { orderId }
POST   /api/payments/stripe/webhook                 [pÃºblico, validar Stripe-Signature]
POST   /api/payments/mercadopago/preference         [auth] { orderId }
POST   /api/payments/mercadopago/webhook            [pÃºblico, validar firma]
```

**Backend â€” Comisiones:**
```
GET    /api/commissions                             [admin]
POST   /api/commissions                             [admin] { type, referenceId?, rate }
PATCH  /api/commissions/:id                         [admin]
DELETE /api/commissions/:id                         [admin]
GET    /api/commissions/effective/:sellerId         [seller|admin]
```
Prioridad: vendor-specific > category-specific > global

**Backend â€” Payouts:**
```
GET    /api/payouts                                 [seller â€” propios]
GET    /api/payouts/:id                             [seller]
GET    /api/payouts/pending-balance                 [seller]
GET    /api/payouts/admin                           [admin â€” todos]
POST   /api/payouts/process                         [admin] { sellerId, periodStart, periodEnd }
GET    /api/payouts/admin/summary                   [admin]
```

**LÃ³gica de payout:**
- Calcula `net = gross - commission` por order_items del perÃ­odo con status delivered
- Si `stores.stripe_account_id` existe â†’ `stripe.transfers.create`, `status='paid'`
- Si no existe â†’ `status='pending'`, `notes='sin Stripe Connect configurado'`

**Frontend:**
- `(shop)/checkout/page.tsx` â€” selecciÃ³n de mÃ©todo de pago + Stripe Elements
- `(vendor)/payouts/page.tsx` â€” historial de liquidaciones

**Checklist:**
- [ ] Webhook Stripe valida firma y retorna 400 si invÃ¡lida
- [ ] Webhook MercadoPago valida firma
- [ ] Pago exitoso â†’ `order.status='paid'`, confirma reserva de inventario
- [ ] `GET /api/commissions/effective/:sellerId` retorna rate correcto (cascada)
- [ ] Payout con Stripe Connect ejecuta transfer (test mode)
- [ ] Payout sin Connect queda en pending
- [ ] Tests: payments.service.spec.ts, commissions.service.spec.ts

---

### FASE 6 â€” Reviews, reputaciÃ³n y moderaciÃ³n

**Objetivo:** Sistema de reviews con moderaciÃ³n + cÃ¡lculo async de reputaciÃ³n.

**Backend â€” Reviews:**
```
GET    /api/reviews/product/:productId?rating=&page=&limit=  [pÃºblico, solo approved]
POST   /api/reviews                                 [buyer, requiere order delivered]
PATCH  /api/reviews/:id                             [dueÃ±o, solo status=pending]
DELETE /api/reviews/:id                             [admin]
POST   /api/reviews/:id/reply                       [seller propietario del producto]
POST   /api/reviews/:id/helpful                     [auth]
GET    /api/reviews/pending                         [admin]
PATCH  /api/reviews/:id/moderate                    [admin] { status: 'approved'|'rejected' }
```

**Backend â€” ReputaciÃ³n:**
```
GET    /api/reputation/:sellerId                    [pÃºblico]
```

**LÃ³gica de reputaciÃ³n (BullMQ `reputation.processor`):**
Trigger: al aprobar review â†’ encolar job
- `avg_rating` = promedio reviews aprobadas del seller
- `response_rate` = % reviews con seller_reply
- `avg_response_h` = promedio horas entre review.created_at y seller_reply_at
- `fulfilled_orders` = count orders delivered del seller
- `dispute_count` = count disputes del seller
- `score` = `(avg_rating * 20) * 0.4 + (response_rate * 100) * 0.2 + (fulfillment_rate * 100) * 0.3 - (dispute_penalty) * 0.1`
  donde `fulfillment_rate = fulfilled / total_orders`, `dispute_penalty = min(dispute_count * 5, 100)`
- `badge`: none (score < 30), rising (â‰¥ 30), trusted (â‰¥ 60 AND avg_rating â‰¥ 4.0), top_seller (â‰¥ 80 AND avg_rating â‰¥ 4.5)

**Frontend:**
- `review-card.tsx`, `review-form.tsx`, `star-rating.tsx` â€” funcionales
- `reputation-badge.tsx` â€” muestra badge del seller
- `(vendor)/reviews/page.tsx` â€” listado con opciÃ³n de reply
- `(admin)/reviews/page.tsx` â€” moderaciÃ³n pending

**Checklist:**
- [ ] No puede crear review sin order delivered para ese producto
- [ ] Helpful no permite duplicados (UNIQUE constraint)
- [ ] Aprobar review dispara recalculo de reputaciÃ³n async
- [ ] Badge asignado correctamente segÃºn fÃ³rmula
- [ ] Admin puede listar y moderar reviews pending
- [ ] Tests: reviews.service.spec.ts, reputation.processor.spec.ts

---

### FASE 7 â€” Shipping, devoluciones y disputas

**Objetivo:** GestiÃ³n de envÃ­os, devoluciones con reembolso, y disputas buyer-seller.

**Backend â€” Shipping:**
```
GET    /api/shipping/zones                          [admin]
POST   /api/shipping/zones                          [admin]
PATCH  /api/shipping/zones/:id                      [admin]
GET    /api/shipping/methods?country=               [pÃºblico]
POST   /api/shipping/methods                        [admin]
PATCH  /api/shipping/methods/:id                    [admin]
GET    /api/shipping/shipments                      [seller â€” propios]
POST   /api/shipping/shipments                      [seller] { orderId, trackingNumber, carrier }
PATCH  /api/shipping/shipments/:id                  [seller]
GET    /api/shipping/track/:trackingNumber          [pÃºblico]
```

**Backend â€” Returns:**
```
POST   /api/returns                                 [buyer] { orderId, reason, description, evidence?, items }
GET    /api/returns/my                              [buyer]
GET    /api/returns                                 [seller|admin]
GET    /api/returns/:id                             [auth â€” participante]
PATCH  /api/returns/:id/approve                     [seller|admin]
PATCH  /api/returns/:id/reject                      [seller|admin] { reason }
POST   /api/returns/:id/refund                      [admin] â€” ejecuta refund vÃ­a Stripe
```

**Backend â€” Disputes:**
```
POST   /api/disputes                                [buyer] { orderId, reason, description, evidence? }
GET    /api/disputes/my                             [auth]
GET    /api/disputes                                [admin]
GET    /api/disputes/:id                            [auth â€” participante]
PATCH  /api/disputes/:id                            [admin] { resolution, status }
```

**Frontend:**
- `(shop)/orders/[id]/return/page.tsx` â€” formulario de devoluciÃ³n
- `(vendor)/returns/page.tsx` â€” listado para aprobar/rechazar
- `(vendor)/shipping/page.tsx` â€” crear shipments
- `(admin)/returns/page.tsx` y `(admin)/disputes/page.tsx`

**Checklist:**
- [ ] Shipment se vincula correctamente a order, actualiza status
- [ ] Return solo se puede solicitar en Ã³rdenes delivered
- [ ] Admin puede emitir refund vÃ­a Stripe (test mode)
- [ ] Dispute solo sobre Ã³rdenes del buyer
- [ ] Guards correctos en todos los endpoints
- [ ] Tests: returns.service.spec.ts, disputes.service.spec.ts

---

### FASE 8 â€” Chat, notificaciones y realtime

**Objetivo:** Chat buyerâ†”seller en tiempo real + notificaciones in-app via WebSocket.

**Backend â€” REST:**
```
GET    /api/chat/conversations                      [auth]
GET    /api/chat/conversations/:id/messages          [auth â€” participante]
POST   /api/chat/conversations                      [auth] { sellerId, productId? }
POST   /api/chat/conversations/:id/messages          [auth] { body, attachments? }
PATCH  /api/chat/conversations/:id/read              [auth]

GET    /api/notifications?page=&limit=              [auth]
PATCH  /api/notifications/:id/read                  [auth]
PATCH  /api/notifications/read-all                  [auth]
```

**Backend â€” WebSocket (Socket.io Gateways):**
```
# chat.gateway.ts â€” namespace /chat
Events:
  join(conversationId)     â€” unirse a room
  leave(conversationId)    â€” salir de room
  message:send             â†’ persiste + emite message:receive a room
  typing:start             â†’ emite a room
  typing:stop              â†’ emite a room

# notifications.gateway.ts â€” namespace /notifications
Events:
  notification:new         â€” emitido al user room (userId)
```

**Triggers de notificaciÃ³n** (via `notification.processor` BullMQ):
- order_paid â†’ buyer + seller
- order_shipped â†’ buyer
- order_delivered â†’ buyer
- review_received â†’ seller
- message_received â†’ destinatario
- dispute_opened â†’ seller + admin
- return_requested â†’ seller
- payout_processed â†’ seller
- low_stock â†’ seller (cuando stock â‰¤ threshold del alert)

**Frontend:**
- `chat-window.tsx` â€” componente de chat completo
- `notification-bell.tsx` â€” badge con count + dropdown
- `(vendor)/chat/page.tsx` â€” listado de conversaciones
- `hooks/use-socket.ts` â€” conexiÃ³n + reconexiÃ³n automÃ¡tica
- `stores/notification-store.ts` â€” Zustand para unread count
- `lib/socket-client.ts` â€” singleton Socket.io

**Checklist:**
- [ ] Mensaje enviado aparece en tiempo real en el receptor
- [ ] Typing indicator se recibe solo en la conversaciÃ³n correcta
- [ ] NotificaciÃ³n in-app se emite al pagar, enviar y entregar orden
- [ ] `read_at` se actualiza al marcar como leÃ­do
- [ ] Redis pub/sub funciona (verificar con dos conexiones simultÃ¡neas)
- [ ] Tests: chat.service.spec.ts, chat.gateway.spec.ts

---

### FASE 9 â€” Cupones, banners y wishlist

**Objetivo:** Promociones, visual merchandising y lista de deseos.

**Backend â€” Cupones:**
```
POST   /api/coupons/validate                        [auth] { code, cartTotal }
GET    /api/coupons                                 [admin|seller â€” propios]
POST   /api/coupons                                 [admin|seller]
PATCH  /api/coupons/:id                             [admin|seller â€” propietario]
DELETE /api/coupons/:id                             [admin|seller]
GET    /api/coupons/flash-sales/active              [pÃºblico]
```

**Backend â€” Wishlist:**
```
GET    /api/wishlist                                [auth]
POST   /api/wishlist/items                          [auth] { productId }
DELETE /api/wishlist/items/:productId               [auth]
```

**Backend â€” Banners:**
```
GET    /api/banners?position=                       [pÃºblico â€” activos + vigentes]
POST   /api/banners                                 [admin]
PATCH  /api/banners/:id                             [admin]
DELETE /api/banners/:id                             [admin]
```

**Frontend:**
- `(account)/wishlist/page.tsx` â€” lista de favoritos
- `(vendor)/coupons/page.tsx` â€” CRUD cupones del seller
- `(admin)/coupons/page.tsx` â€” CRUD cupones globales
- `(admin)/banners/page.tsx` â€” gestiÃ³n de banners
- `banner-carousel.tsx` â€” en homepage
- `flash-sale-countdown.tsx` â€” countdown timer

**Checklist:**
- [ ] CupÃ³n expirado retorna error descriptivo
- [ ] CupÃ³n con usage_limit alcanzado retorna error
- [ ] Flash sale solo visible dentro de su ventana temporal
- [ ] Wishlist no permite duplicados (constraint + error claro)
- [ ] Banners filtrados por position y vigencia (starts_at â‰¤ now â‰¤ ends_at)
- [ ] Tests: coupons.service.spec.ts

---

### FASE 10 â€” Analytics, admin y paneles

**Objetivo:** Dashboards con mÃ©tricas reales + gestiÃ³n admin completa.

**Backend â€” Analytics seller:**
```
GET    /api/analytics/seller/overview               [seller]
GET    /api/analytics/seller/revenue?period=7d|30d|90d  [seller]
GET    /api/analytics/seller/products               [seller]
GET    /api/analytics/seller/reviews                [seller]
GET    /api/analytics/seller/conversion             [seller]
```

**Backend â€” Analytics admin:**
```
GET    /api/analytics/admin/overview                [admin]
GET    /api/analytics/admin/revenue?period=         [admin]
GET    /api/analytics/admin/sellers                 [admin]
GET    /api/analytics/admin/top-products            [admin]
GET    /api/analytics/admin/commissions             [admin]
```

**Backend â€” Admin management:**
```
GET    /api/admin/users?page=&role=&q=              [admin]
PATCH  /api/admin/users/:id                         [admin] { role, name }
GET    /api/admin/vendors?status=                   [admin]
PATCH  /api/admin/vendors/:id                       [admin] { status: 'active'|'suspended' }
```

**Backend â€” Config:**
```
GET    /api/config/public                           [pÃºblico â€” keys no sensibles]
GET    /api/config                                  [admin â€” todas]
PATCH  /api/config                                  [admin] { key, value }
```

**Backend â€” Audit:**
```
GET    /api/audit?entity=&userId=&action=&page=     [admin]
```

**Frontend:**
- `(vendor)/dashboard/page.tsx` â€” KPIs: GMV, orders, rating, pending balance
- `(admin)/dashboard/page.tsx` â€” KPIs: GMV, commissions, vendors, disputes
- stats components: `kpi-card`, `revenue-chart`, `orders-chart`, `commission-chart`, `top-products-table`
- `(admin)/users/page.tsx`, `vendors/page.tsx`, `audit/page.tsx`, `config/page.tsx`
- `(account)/profile/page.tsx`, `addresses/page.tsx`, `settings/page.tsx`

**Checklist:**
- [ ] GMV del seed consistente con Ã³rdenes creadas
- [ ] Seller dashboard muestra pending balance = sum(delivered order_items no pagados)
- [ ] Admin puede suspender vendor â†’ store.status='suspended'
- [ ] Audit log muestra historial de mutaciones reales
- [ ] Charts renderizan datos del seed con Recharts
- [ ] Tests: analytics.service.spec.ts

---

### FASE 11 â€” IntegraciÃ³n frontend completa

**Objetivo:** Todas las pÃ¡ginas funcionales, conectadas al backend, con UX completa.

**Tareas:**
1. Verificar que TODAS las pÃ¡ginas del Ã¡rbol estÃ¡n implementadas (no placeholders)
2. `generateMetadata()` en cada page dinÃ¡mica (products, stores, categories)
3. `sitemap.ts` dinÃ¡mico con productos y tiendas del seed
4. `robots.ts` configurado
5. `(vendor)/onboarding/page.tsx` â€” flujo de 4 pasos funcional
6. `(vendor)/products/new/page.tsx` y `[id]/edit/page.tsx` â€” con upload de imÃ¡genes
7. `(vendor)/store/page.tsx` â€” ediciÃ³n de perfil de tienda
8. ISR en homepage, SSR en pÃ¡ginas dinÃ¡micas con auth
9. Error boundaries y loading states en todas las rutas
10. Responsive: mobile-first con Tailwind

**Checklist:**
- [ ] Checkout completa pago real en test mode (Stripe)
- [ ] Dashboard vendor muestra datos del seed correctos
- [ ] Admin puede aprobar/suspender vendors
- [ ] Chat funciona en tiempo real buyer â†” seller
- [ ] Notification bell recibe eventos en vivo
- [ ] Sitemap incluye productos y tiendas
- [ ] `next build` sin errores TypeScript
- [ ] Todas las pÃ¡ginas tienen metadata
- [ ] No hay pÃ¡ginas placeholder (grep "TODO" retorna vacÃ­o)

---

### FASE 12 â€” Infra, CI/CD y documentaciÃ³n

**Objetivo:** Listo para deploy a producciÃ³n.

**Dockerfile (`apps/api/Dockerfile`):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN corepack enable && pnpm install --frozen-lockfile
COPY apps/api/ apps/api/
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json .
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**fly.toml:**
```toml
app = "marketplace-api"
primary_region = "gru"

[build]

[http_service]
  internal_port = 3001
  min_machines_running = 1

[env]
  NODE_ENV = "production"
  PORT = "3001"
```

**wrangler.jsonc:**
```jsonc
{
  "name": "marketplace-web",
  "compatibility_date": "2025-01-01",
  "main": ".open-next/worker.js",
  "assets": { "directory": ".open-next/assets" }
}
```

**CI (`.github/workflows/ci.yml`):**
```yaml
on: pull_request
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - run: grep -r '"any"' apps/ && exit 1 || true
```

**Deploy (`.github/workflows/deploy.yml`):**
```yaml
on:
  push:
    branches: [main]
jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**README.md** debe incluir:
- Arquitectura (diagrama ASCII)
- Setup local (paso a paso)
- Variables de entorno (quÃ© hace cada una)
- Comandos del Makefile
- Estructura de la API (endpoints agrupados)
- FÃ³rmula de reputaciÃ³n
- Flujo de pago y payout
- Decisiones tÃ©cnicas documentadas

**ValidaciÃ³n final:**
- [ ] `make setup && make dev` funciona en mÃ¡quina limpia
- [ ] `make migrate && make seed` sin errores
- [ ] `GET /api/health` â†’ 200
- [ ] `GET /api/products` â†’ productos del seed
- [ ] Auth: registro â†’ login â†’ rutas protegidas
- [ ] Meilisearch indexado y bÃºsqueda funcional
- [ ] Pago Stripe test completa flujo
- [ ] Payout Stripe Connect ejecuta transfer test
- [ ] `next build` sin errores
- [ ] `wrangler deploy --dry-run` sin errores
- [ ] `tsc --noEmit` en api y web sin errores
- [ ] `grep -r '"any"' apps/` retorna vacÃ­o
- [ ] No hay secretos en `NEXT_PUBLIC_*`
- [ ] Docker image buildea y corre sin errores
- [ ] README completo y actualizado
```

---

## Resumen de cambios v6 â†’ v7

| Problema | SoluciÃ³n |
|---|---|
| Prompt duplicado (~4000 lÃ­neas) | **Una sola copia** (~2000 lÃ­neas) |
| Versiones contradictorias | **Tabla Ãºnica** con nota de flexibilidad |
| Sin estructura interna de mÃ³dulos | **Regla global #5** + `common/` explÃ­cito |
| Sin formato de respuesta API | **Regla global #6** con ejemplos |
| Sin tests | **Vitest** en stack + tests por fase |
| Auth pages sin fase | **Fase 2** las implementa explÃ­citamente |
| Storage sin fase | **Fase 3** lo implementa antes de productos |
| Docker Meilisearch version wrong | **v1.13** consistente |
| Falta wrangler.jsonc en Ã¡rbol | **Agregado** en root |
| Sin orden de schemas | **Fase 1** tiene orden explÃ­cito de implementaciÃ³n |
| Sin hooks/stores detallados | **Archivos especÃ­ficos** listados en Ã¡rbol |
| Sin common/ en API | **Guards, decorators, interceptors, filters** explÃ­citos |
| Sin processors detallados | **4 processors** listados en `queue/processors/` |