/**
 * Structured logger — usa pino en producción, console en dev.
 * Exporta una interfaz unificada para API y workers.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  [key: string]: unknown;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    process.env.NODE_ENV !== 'production' && console.debug(formatLog({ level: 'debug', message, ...meta })),

  info: (message: string, meta?: Record<string, unknown>) =>
    console.info(formatLog({ level: 'info', message, ...meta })),

  warn: (message: string, meta?: Record<string, unknown>) =>
    console.warn(formatLog({ level: 'warn', message, ...meta })),

  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const err = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { raw: error };
    console.error(formatLog({ level: 'error', message, error: err, ...meta }));
  },
};
