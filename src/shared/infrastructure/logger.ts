/**
 * Logger interface and implementations
 */

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, context || '');
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, context || '');
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context || '');
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, error, context || '');
  }
}

let loggerInstance: Logger = new ConsoleLogger();

export function setLogger(logger: Logger): void {
  loggerInstance = logger;
}

export function getLogger(): Logger {
  return loggerInstance;
}
