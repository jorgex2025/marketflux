# Marketflux Architecture

Marketflux es un marketplace multivendor construido como monorepo con Turborepo, separando la API (NestJS) y el frontend web (Next.js) en aplicaciones independientes con paquetes compartidos.

## Monorepo Structure

```
marketflux/
├── apps/
│   ├── api/                 # NestJS backend (puerto 3001)
│   │   ├── src/
│   │   │   ├── auth/        # Better Auth integration
│   │   │   ├── products/    # Catálogo de productos
│   │   │   ├── orders/      # Gestión de pedidos
│   │   │   ├── payments/    # Stripe integration
│   │   │   ├── cart/        # Carrito de compras
│   │   │   ├── categories/  # Categorías de productos
│   │   │   ├── inventory/   # Control de inventario
│   │   │   ├── vendors/     # Gestión de vendedores
│   │   │   ├── shipping/    # Envíos y tracking
│   │   │   ├── reviews/     # Reseñas y ratings
│   │   │   ├── search/      # Meilisearch integration
│   │   │   ├── queue/       # BullMQ job processors
│   │   │   ├── notifications/ # Email y notificaciones
│   │   │   ├── analytics/   # Métricas y reportes
│   │   │   ├── chat/        # WebSocket chat (Socket.IO)
│   │   │   ├── disputes/    # Resolución de disputas
│   │   │   ├── returns/     # Devoluciones
│   │   │   ├── coupons/     # Cupones y descuentos
│   │   │   ├── commissions/ # Comisiones de vendedores
│   │   │   ├── payouts/     # Pagos a vendedores
│   │   │   ├── reputation/  # Sistema de reputación
│   │   │   ├── banners/     # Banners promocionales
│   │   │   ├── wishlists/   # Listas de deseos
│   │   │   ├── storage/     # Cloudflare R2 (S3)
│   │   │   ├── security/    # Rate limiting, throttling
│   │   │   ├── audit/       # Audit logging
│   │   │   ├── reports/     # Reportes generados
│   │   │   ├── database/    # Drizzle schema y migraciones
│   │   │   └── common/      # Utilidades compartidas
│   │   ├── Dockerfile
│   │   └── drizzle.config.ts
│   ├── web/                 # Next.js frontend (puerto 3000)
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React componentes
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilidades del frontend
│   │   ├── stores/          # State management
│   │   ├── middleware.ts    # Next.js middleware
│   │   ├── Dockerfile
│   │   └── vercel.json
│   └── e2e/                 # End-to-end tests (Playwright)
├── packages/
│   ├── types/               # TypeScript tipos compartidos
│   ├── validators/          # Zod validators compartidos
│   ├── eslint-config/       # ESLint config compartido
│   ├── typescript-config/   # tsconfig compartido
│   └── monitoring/          # Sentry/monitoring utilities
├── infra/                   # Infrastructure as code
├── docker-compose.yml       # Servicios locales (Postgres, Redis, Meilisearch)
├── fly.api.toml             # Fly.io deploy config (API)
├── turbo.json               # Turborepo pipeline config
├── wrangler.jsonc           # Cloudflare Workers config
└── Makefile                 # Comandos comunes
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | SSR/SSG, routing, API client |
| Backend | NestJS 11 | API REST, WebSockets, modular architecture |
| Database | PostgreSQL 16 (Neon) | Datos persistentes, transacciones ACID |
| ORM | Drizzle ORM | Type-safe queries, migraciones |
| Cache/Queue | Redis 7 + BullMQ | Job queue, rate limiting, cache |
| Search | Meilisearch v1.13 | Full-text search, filtros, facets |
| Auth | Better Auth | Session-based auth, OAuth providers |
| Payments | Stripe Connect | Pagos, split payments, payouts |
| Storage | Cloudflare R2 (S3 API) | Imágenes de productos, archivos |
| Real-time | Socket.IO | Chat en tiempo real, notificaciones |
| Testing | Vitest + Playwright | Unit/integration tests + E2E |
| Monitoring | Sentry | Error tracking, performance |
| Deploy API | Fly.io | Container deployment, edge regions |
| Deploy Web | Vercel | Serverless frontend deployment |
| CI/CD | GitHub Actions | Build, test, deploy automation |
| Monorepo | Turborepo + pnpm | Task orchestration, workspace management |

## Data Flow Architecture

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ─────────────► │   Next.js Web    │
│   (Client)  │ ◄───────────── │   (Vercel)       │
└─────────────┘                └────────┬─────────┘
                                        │
                              API calls │ (fetch)
                                        ▼
                         ┌──────────────────────────┐
                         │    NestJS API            │
                         │    (Fly.io)              │
                         ├──────────────────────────┤
                         │  ┌────────────────────┐  │
                         │  │  Auth Middleware   │  │
                         │  │  (Better Auth)     │  │
                         │  └────────┬───────────┘  │
                         │           │              │
                         │  ┌────────▼───────────┐  │
                         │  │  Route Controllers │  │
                         │  │  products/orders/  │  │
                         │  │  payments/cart/    │  │
                         │  └────────┬───────────┘  │
                         │           │              │
                         └─────┬─────┼──────┬───────┘
                               │     │      │
                    ┌──────────▼─┐ ┌─▼──────┐ ┌▼────────────┐
                    │ PostgreSQL │ │ Redis  │ │ Meilisearch │
                    │  (Neon)    │ │+BullMQ │ │  (search)   │
                    └────────────┘ └───┬────┘ └─────────────┘
                                       │
                              ┌────────▼─────────┐
                              │  Job Processors  │
                              │  - emails        │
                              │  - inventory     │
                              │  - payouts       │
                              │  - search sync   │
                              └──────────────────┘
```

### Request Flow

1. **Client Request**: Next.js frontend sends HTTP request to `/api`
2. **Auth Middleware**: Better Auth validates session and permissions
3. **Route Controller**: NestJS handles routing, validation (class-validator)
4. **Service Layer**: Business logic execution
5. **Data Layer**: Drizzle ORM queries PostgreSQL
6. **Cache Layer**: Redis caches frequent queries
7. **Search**: Meilisearch handles product search queries
8. **Async Jobs**: BullMQ queues background tasks (emails, indexing, webhooks)
9. **Response**: JSON response returned to client

## Key Architectural Decisions

### Monorepo with Turborepo
- **Decision**: Use Turborepo for task orchestration across packages
- **Rationale**: Shared types, validators, and configs prevent duplication and ensure consistency
- **Benefit**: Single source of truth for types across frontend and backend

### NestJS + Next.js Separation
- **Decision**: Separate backend API from frontend application
- **Rationale**: Independent scaling, clearer boundaries, easier to add mobile clients later
- **Benefit**: Backend can be deployed separately (Fly.io) from frontend (Vercel)

### Drizzle ORM over Prisma
- **Decision**: Use Drizzle for database access
- **Rationale**: Better TypeScript integration, lighter runtime, SQL-like syntax, serverless compatible
- **Benefit**: Type-safe queries with minimal overhead

### Better Auth for Authentication
- **Decision**: Use Better Auth instead of custom JWT implementation
- **Rationale**: Secure by default, handles sessions, CSRF, and password hashing
- **Benefit**: Reduced security surface, built-in best practices

### Stripe Connect for Multivendor Payments
- **Decision**: Use Stripe Connect instead of standard Stripe Checkout
- **Rationale**: Native marketplace support: split payments, automatic commissions, vendor payouts, dispute handling
- **Benefit**: End-to-end payment flow for multivendor scenarios

### BullMQ for Job Processing
- **Decision**: Use Redis-backed job queue for async operations
- **Rationale**: Reliable job processing with retry logic and concurrency control
- **Use Cases**: Email notifications, search index updates, webhook processing, payment reconciliation, payout scheduling

### Meilisearch for Product Search
- **Decision**: Dedicated search engine instead of PostgreSQL full-text search
- **Rationale**: Better relevance ranking, typo tolerance, faceted search
- **Benefit**: Superior user experience for product discovery

### Cloudflare R2 for Storage
- **Decision**: Use R2 instead of AWS S3
- **Rationale**: Zero egress fees, S3-compatible API, CDN integration
- **Benefit**: Cost-effective media storage for product images

### Socket.IO for Real-time Communication
- **Decision**: WebSocket via Socket.IO for chat and notifications
- **Rationale**: NestJS native WebSocket gateway support, automatic reconnection, rooms
- **Benefit**: Real-time buyer-seller communication and live order updates

### Deploy Separado por App
- **Decision**: API en Fly.io, Web en Vercel
- **Rationale**: Fly.io ofrece containers persistentes (necesario para WebSockets y BullMQ). Vercel optimiza Next.js automáticamente.
- **Benefit**: Cada plataforma optimizada para su caso de uso específico

### Socket.IO for Real-time Communication
- **Decision**: WebSocket via Socket.IO for chat and notifications
- **Rationale**: NestJS native WebSocket gateway support, automatic reconnection, rooms
- **Benefit**: Real-time buyer-seller communication and live order updates

### Deploy Separado por App
- **Decision**: API en Fly.io, Web en Vercel
- **Rationale**: Fly.io ofrece containers persistentes (necesario para WebSockets y BullMQ). Vercel optimiza Next.js automáticamente.
- **Benefit**: Cada plataforma optimizada para su caso de uso específico
