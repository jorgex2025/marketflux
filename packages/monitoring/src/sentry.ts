import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentryServer(dsn: string, environment: string) {
  Sentry.init({
    dsn,
    environment,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Captura 100% de trazas en dev, 10% en prod
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // No enviar datos sensibles
    beforeSend(event) {
      if (event.request?.data) {
        // Redactar campos sensibles
        const sensitive = ['password', 'token', 'secret', 'card', 'cvv'];
        const data = event.request.data as Record<string, unknown>;
        sensitive.forEach((key) => {
          if (data[key]) data[key] = '[REDACTED]';
        });
      }
      return event;
    },
  });
}

export { Sentry };
