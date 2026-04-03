import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();

// Recolectar métricas default de Node.js (CPU, memoria, event loop)
collectDefaultMetrics({ register: registry });

// ── HTTP Metrics ────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

// ── Business Metrics ───────────────────────────────────────────
export const ordersCreatedTotal = new Counter({
  name: 'orders_created_total',
  help: 'Total orders created',
  labelNames: ['status'],
  registers: [registry],
});

export const revenueTotal = new Counter({
  name: 'revenue_total_cents',
  help: 'Total revenue in cents',
  labelNames: ['currency'],
  registers: [registry],
});

export const activeUsersGauge = new Gauge({
  name: 'active_users_gauge',
  help: 'Currently active users (last 5 min)',
  registers: [registry],
});

export const queueDepthGauge = new Gauge({
  name: 'bullmq_queue_depth',
  help: 'BullMQ queue depth per queue',
  labelNames: ['queue'],
  registers: [registry],
});
