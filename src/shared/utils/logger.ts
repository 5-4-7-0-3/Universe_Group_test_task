import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, correlationId, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      correlationId,
      service,
      ...meta,
    });
  })
);

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

export class CorrelationIdGenerator {
  static generate(): string {
    return uuidv4();
  }
}

export interface LogContext {
  correlationId?: string;
  service?: string;
  [key: string]: any;
}

export class Logger {
  constructor(private context: LogContext = {}) {}

  private log(level: string, message: string, meta: any = {}) {
    logger.log(level, message, { ...this.context, ...meta });
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.log('error', message, { error: error?.stack, ...meta });
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  withCorrelationId(correlationId: string): Logger {
    return new Logger({ ...this.context, correlationId });
  }

  withService(service: string): Logger {
    return new Logger({ ...this.context, service });
  }
}