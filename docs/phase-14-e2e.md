# Fase 14 — E2E Tests con Playwright

## Estructura

```
apps/e2e/
├── playwright.config.ts          # Config multi-browser + auth state
├── tests/
│   ├── auth.setup.ts             # Setup: guarda cookies de buyer y seller
│   ├── pages/                    # Page Object Models
│   │   ├── auth.page.ts
│   │   ├── shop.page.ts
│   │   ├── cart.page.ts
│   │   └── seller-dashboard.page.ts
│   ├── auth.spec.ts              # Tests de autenticación
│   ├── shop.spec.ts              # Catalog + search + product detail
│   ├── cart.spec.ts              # Carrito
│   ├── checkout.spec.ts          # Flujo de checkout
│   ├── seller-dashboard.spec.ts  # Dashboard del vendor
│   └── api-health.spec.ts        # Smoke tests de API
└── .gitignore                    # Ignora .auth/, resultados
```

## Cobertura de tests

| Suite | Tests | Escenarios |
|-------|-------|------------|
| `auth.spec.ts` | 4 | Sign-in form, credenciales inválidas, redirect post-login, sign-up |
| `shop.spec.ts` | 4 | Homepage con productos, búsqueda, product detail, add to cart |
| `cart.spec.ts` | 3 | Carrito vacío, añadir producto, eliminar item |
| `checkout.spec.ts` | 2+1skip | Checkout visible, redirect a pago, Stripe (skipped en CI) |
| `seller-dashboard.spec.ts` | 3 | Dashboard autenticado, tabla de órdenes, navegar a crear producto |
| `api-health.spec.ts` | 5 | /health, /metrics, /categories, /products, 401 en cart sin auth |

## Ejecutar localmente

```bash
# Instalar browsers (primera vez)
pnpm --filter @marketflux/e2e exec playwright install

# Levantar stack local
make dev

# Correr todos los tests
pnpm --filter @marketflux/e2e test

# Modo UI (recomendado para desarrollo)
pnpm --filter @marketflux/e2e test:ui

# Solo API smoke tests
pnpm --filter @marketflux/e2e test tests/api-health.spec.ts

# Debug un test específico
pnpm --filter @marketflux/e2e test:debug tests/auth.spec.ts
```

## Auth State (storageState)

El setup en `auth.setup.ts` corre antes de los tests y guarda las cookies en `.auth/buyer.json` y `.auth/seller.json`.
Esas carpetas están en `.gitignore` — no se commitean.

## Variables de entorno (CI)

| Variable | Descripción |
|----------|-------------|
| `BASE_URL` | URL del frontend (default: `http://localhost:3000`) |
| `API_URL` | URL de la API (default: `http://localhost:3001`) |
| `TEST_BUYER_EMAIL` | Email del buyer de prueba |
| `TEST_BUYER_PASSWORD` | Password del buyer de prueba |
| `TEST_SELLER_EMAIL` | Email del seller de prueba |
| `TEST_SELLER_PASSWORD` | Password del seller de prueba |

## GitHub Secrets adicionales

Agregar en `Settings → Secrets → Actions`:
- `TEST_BUYER_EMAIL`
- `TEST_BUYER_PASSWORD`
- `TEST_SELLER_EMAIL`
- `TEST_SELLER_PASSWORD`

## Arquitectura de autenticación en tests

```
auth.setup.ts
  └── autentica buyer → guarda .auth/buyer.json
  └── autentica seller → guarda .auth/seller.json

chromium project
  └── usa storageState: .auth/buyer.json
  └── todos los tests ya están logueados como buyer

seller-dashboard.spec.ts
  └── test.use({ storageState: '.auth/seller.json' })
  └── override para usar cuenta de seller
```
