export interface LogContext {
  requestId?: string;
  endpoint?: string;
  userId?: string;
  orderId?: string;
  [key: string]: unknown;
}

/**
 * Enterprise Structured Logging Utility
 * Emits standardized JSON logs in production for Datadog / CloudWatch / Axiom ingestion,
 * and clean readable logs during development.
 */
class Logger {
  private formatLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: LogContext, error?: unknown) {
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';

    const logPayload: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...(context || {}),
    };

    if (error) {
      if (error instanceof Error) {
        logPayload.error = {
          message: error.message,
          name: error.name,
          stack: error.stack,
        };
      } else {
        logPayload.error = error;
      }
    }

    if (isProduction) {
      return JSON.stringify(logPayload);
    }

    const contextStr = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    const errStr = error ? `\n  Details: ${error instanceof Error ? error.stack || error.message : JSON.stringify(error)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}${errStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    console.error(this.formatLog('ERROR', message, context, error));
  }
}

export const logger = new Logger();

/**
 * Helper to extract or generate a unique request ID for correlation across distributed calls
 */
export function getRequestId(req: Request): string {
  const existingId = req.headers.get('x-request-id');
  if (existingId) return existingId;
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
