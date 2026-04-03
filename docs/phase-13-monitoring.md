# Fase 13 — Monitoring, Alerting & Observabilidad

## Stack

| Herramienta | Rol | Plan |
|-------------|-----|------|
| **Sentry** | Error tracking + performance | Free (5k errores/mes) |
| **Prometheus** | Métricas scraping | Self-hosted (infra/) |
| **Grafana** | Dashboards | Self-hosted (infra/) |
| **GitHub Actions** | Uptime check cada 5 min | Free |
| **prom-client** | Exponer `/metrics` en NestJS | Open source |

## Arquitectura

```
NestJS API
  ├── GET /health          ← Fly.io healthcheck
  ├── GET /metrics         ← Prometheus scrape
  ├── MetricsInterceptor   ← mide cada request
  └── SentryExceptionFilter ← captura errores 5xx

Next.js Web
  └── instrumentation.ts   ← Sentry frontend
  └── global-error.tsx     ← captura errores UI

Prometheus ──► scrape /metrics cada 15s
Grafana ────► dashboards en tiempo real
Alertmanager ─► notificaciones por email/Slack
```

## Métricas expuestas

- `http_requests_total` — por método, ruta, status code
- `http_request_duration_seconds` — histograma p50/p95/p99
- `orders_created_total` — por estado
- `revenue_total_cents` — por moneda
- `active_users_gauge` — usuarios activos últimos 5 min
- `bullmq_queue_depth` — profundidad de cada queue
- Métricas default de Node.js (CPU, memoria, GC, event loop lag)

## Alertas configuradas

| Alerta | Condición | Severidad |
|--------|-----------|----------|
| `HighErrorRate` | Errores 5xx > 5% por 2 min | Critical |
| `HighLatency` | p95 > 2s por 5 min | Warning |
| `ApiDown` | Prometheus no puede scrapear | Critical |
| `QueueDepthHigh` | Queue > 1000 jobs por 5 min | Warning |

## Setup Sentry

```bash
# 1. Crear proyecto en https://sentry.io
# 2. Obtener DSN
# 3. Agregar a .env:
SENTRY_DSN="https://xxx@oXXX.ingest.sentry.io/XXX"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@oXXX.ingest.sentry.io/XXX"

# 4. Agregar como GitHub Secret:
# SENTRY_DSN
```

## Setup Grafana + Prometheus (local)

```bash
# Iniciar todo el stack de monitoreo
docker-compose -f docker-compose.monitoring.yml up -d

# Grafana: http://localhost:3030 (admin/admin)
# Prometheus: http://localhost:9090
# Importar dashboard: infra/grafana/dashboards/api-overview.json
```

## Uptime Check

El workflow `.github/workflows/uptime.yml` hace ping cada 5 minutos.
Si falla, crea automáticamente un Issue con label `incident` + `priority: critical`.
