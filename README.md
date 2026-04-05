# MarketFlux — Marketplace Multivendor

Plataforma de e-commerce multivendor completa, construida con Next.js 16, NestJS, Drizzle ORM y PostgreSQL.

## 🚀 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js 16 (App Router, Turbopack) | 16.2.0 |
| **Backend** | NestJS 11 | 11.x |
| **Base de datos** | PostgreSQL + Drizzle ORM | 16+ |
| **Auth** | Better Auth | latest |
| **Búsqueda** | Meilisearch | v1.13 |
| **Cache/Queues** | Redis + BullMQ | 7+ |
| **Pagos** | Stripe + MercadoPago | latest |
| **Storage** | Cloudflare R2 + Sharp | S3 compatible |
| **Deploy API** | Fly.io (Docker) | latest |
| **Deploy Web** | Cloudflare Workers (@opennextjs) | latest |
| **Package manager** | pnpm (monorepo) | 10.11+ |
| **Tests** | Vitest + Playwright | latest |
| **CI/CD** | GitHub Actions | latest |

## 📁 Estructura del Proyecto

```
marketflux/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         # Autenticación (Better Auth)
│   │   │   ├── products/     # Catálogo de productos
│   │   │   ├── orders/       # Gestión de órdenes
│   │   │   ├── cart/         # Carrito de compras
│   │   │   ├── payments/     # Stripe/MercadoPago
│   │   │   ├── commissions/  # Cálculo de comisiones
│   │   │   ├── payouts/      # Pagos a vendedores
│   │   │   ├── vendors/      # Tiendas de vendedores
│   │   │   ├── categories/   # Categorías jerárquicas
│   │   │   ├── inventory/    # Gestión de stock
│   │   │   ├── shipping/     # Zonas y métodos de envío
│   │   │   ├── returns/      # Devoluciones y reembolsos
│   │   │   ├── disputes/     # Resolución de disputas
│   │   │   ├── reviews/      # Reviews con moderación
│   │   │   ├── chat/         # Chat buyer↔seller en tiempo real
│   │   │   ├── notifications/# Notificaciones in-app + WebSocket
│   │   │   ├── coupons/      # Cupones y flash sales
│   │   │   ├── banners/      # Banners promocionales
│   │   │   ├── wishlists/    # Lista de deseos
│   │   │   ├── reports/      # Reportes y analytics
│   │   │   ├── analytics/    # Dashboards de métricas
│   │   │   ├── storage/      # Upload a R2 con Sharp
│   │   │   ├── search/       # Integración Meilisearch
│   │   │   ├── config/       # Configuración del marketplace
│   │   │   ├── audit/        # Logs de auditoría
│   │   │   ├── queue/        # BullMQ processors
│   │   │   ├── reputation/   # Cálculo asíncrono de reputación
│   │   │   ├── database/     # Drizzle schema + seed
│   │   │   └── common/       # Guards, interceptors, pipes, decorators
│   │   └── vitest.config.ts
│   └── web/                  # Next.js frontend
│       ├── app/              # App Router (shop, admin, vendor, auth, account)
│       ├── components/       # Componentes reutilizables
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utilidades (auth-client, query-client, socket)
│       └── stores/           # Zustand stores
├── packages/                 # Shared packages
├── fly.toml                  # Fly.io deployment config
├── wrangler.jsonc            # Cloudflare Workers config
├── Dockerfile.api            # Multi-stage Docker build
└── Makefile                  # Comandos de desarrollo
```

## 🛠️ Setup Local

### Requisitos

- Node.js 22+
- pnpm 10.11+
- Docker + Docker Compose
- Git

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/jorgex2025/marketflux.git
cd marketflux

# 2. Instalar dependencias
make setup
# o: pnpm install

# 3. Iniciar infraestructura (PostgreSQL, Redis, Meilisearch)
make docker-up
# o: docker compose up -d

# 4. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Aplicar migraciones
make migrate
# o: pnpm --filter api db:push

# 6. Cargar datos de prueba
make seed
# o: pnpm --filter api db:seed

# 7. Iniciar servidores de desarrollo
make dev
# o: pnpm dev
```

Acceso:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Health**: http://localhost:3001/api/health

### Usuarios de Prueba (Seed)

| Email | Rol | Descripción |
|-------|-----|-------------|
| `admin@marketflux.com` | admin | Panel de administración completo |
| `seller@marketflux.com` | seller | Tienda "TechStore" activa |
| `seller2@marketflux.com` | seller | Tienda "FashionHub" activa |
| `buyer@marketflux.com` | buyer | Comprador con órdenes |
| `buyer2@marketflux.com` | buyer | Comprador secundario |

## 📋 Comandos del Makefile

| Comando | Descripción |
|---------|-------------|
| `make setup` | Instalar dependencias |
| `make docker-up` | Iniciar PostgreSQL, Redis, Meilisearch |
| `make docker-down` | Detener servicios Docker |
| `make migrate` | Aplicar migraciones de base de datos |
| `make seed` | Cargar datos de prueba |
| `make dev` | Iniciar todos los servidores de desarrollo |
| `make test` | Ejecutar tests unitarios |
| `make lint` | Ejecutar linter |
| `make typecheck` | Verificar TypeScript |

## 🧪 Testing

```bash
# Tests unitarios
pnpm --filter api test

# Tests con coverage
pnpm --filter api test:cov

# Tests E2E
pnpm --filter @marketflux/e2e test

# Typecheck
pnpm --filter api typecheck
```

**Estado actual**: 141 tests passing, 0 failures, 34 archivos de test.

## 📡 API Endpoints

Ver [API.md](./API.md) para documentación completa de todos los endpoints.

Resumen por módulo:

| Módulo | Endpoints | Auth |
|--------|-----------|------|
| Auth | register, login, session, verify | Public/Protected |
| Products | CRUD, search, featured, variants | Public/Protected |
| Orders | create, list, detail, status | Protected |
| Cart | add, update, remove, clear | Protected |
| Payments | create intent, webhook, status | Protected |
| Vendors/Stores | CRUD, findBySlug, onboarding | Mixed |
| Categories | CRUD, tree | Public/Admin |
| Reviews | create, moderate, helpful | Mixed |
| Shipping | zones, methods, shipments | Mixed |
| Returns | create, approve, reject, refund | Protected |
| Disputes | create, resolve, list | Mixed |
| Chat | conversations, messages | Protected |
| Notifications | list, markRead, WebSocket | Protected |
| Coupons | CRUD, validate, flash sales | Mixed |
| Banners | CRUD, getActive | Mixed |
| Wishlists | getOrCreate, add, remove, list | Protected |
| Commissions | CRUD, getEffectiveRate | Admin |
| Payouts | process, balance, summary | Mixed |
| Reports | CRUD, generateSalesReport | Admin |
| Analytics | seller/admin overview | Protected |
| Storage | upload, delete, signed URLs | Mixed |
| Config | get, set, getAll | Admin |
| Audit | list, filter | Admin |
| Search | search, index, bulk | Mixed |
| Inventory | stock, reservations | Protected |

## 🚀 Deploy

### API → Fly.io

```bash
fly deploy --config fly.toml
fly secrets set DATABASE_URL="..." STRIPE_SECRET_KEY="..." --config fly.toml
```

### Web → Cloudflare Workers

```bash
pnpm --filter web build
wrangler deploy
```

### CI/CD Automático

Push a `main` dispara:
1. Lint + Typecheck + Tests
2. Build Docker + Deploy API a Fly.io
3. Build Next.js + Deploy Web a Cloudflare Workers

Ver [.github/workflows/](./.github/workflows/) para detalles.

## 🔐 Variables de Entorno

Ver [.env.example](./.env.example) para todas las variables disponibles.

**Críticas para producción:**
- `DATABASE_URL` — Conexión PostgreSQL
- `JWT_SECRET` — Firma de tokens (mínimo 32 caracteres)
- `STRIPE_SECRET_KEY` — Clave secreta de Stripe
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — Cloudflare R2
- `REDIS_URL` — Redis para BullMQ + WebSockets

## 📚 Documentación

| Archivo | Contenido |
|---------|-----------|
| [API.md](./API.md) | Documentación completa de endpoints REST |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guía de deploy paso a paso |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Decisiones técnicas y arquitectura |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de cambios |
| [ESTADO_AGENTE.md](./ESTADO_AGENTE.md) | Estado actual del desarrollo |

## 📊 Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js 16  │────▶│  NestJS API │
│             │     │  (CF Workers)│     │  (Fly.io)   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │ Neon         │          │ Upstash      │          │ Meilisearch  │
            │ PostgreSQL   │          │ Redis        │          │ Cloud        │
            │ (DB)         │          │ (Cache/Queue)│          │ (Search)     │
            └──────────────┘          └──────────────┘          └──────────────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │ Cloudflare   │
                                        │ R2           │
                                        │ (Storage)    │
                                        └──────────────┘
```

## 🔧 Troubleshooting

### Error: "Connection refused" en PostgreSQL
```bash
make docker-up
# Verificar: docker ps | grep postgres
```

### Error: "Module not found" después de git pull
```bash
pnpm install
```

### Error: "Migration already applied"
```bash
pnpm --filter api db:push --force
```

### Puerto 3000 o 3001 ocupado
```bash
lsof -i :3000  # Encontrar proceso
kill -9 <PID>  # Matar proceso
```

## 📝 Licencia

MIT
