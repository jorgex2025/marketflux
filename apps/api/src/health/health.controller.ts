import { Controller, Get } from '@nestjs/common';
import { registry } from '@marketflux/monitoring';

@Controller()
export class HealthController {
  /** GET /health — usado por Fly.io y Docker healthcheck */
  @Get('health')
  health() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
    };
  }

  /** GET /metrics — scrapeado por Prometheus */
  @Get('metrics')
  async metrics() {
    const metrics = await registry.metrics();
    return metrics;
  }
}
