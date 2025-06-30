import { utilities as nestWinstonModuleUtilities } from "nest-winston";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";
import * as path from "path";
import * as fs from "fs";

const { combine, timestamp, label, printf, json, errors, colorize } =
  winston.format;

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL =
  process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug");
const LOG_DIR = process.env.LOG_DIR || "logs";
const APP_NAME = process.env.APP_NAME || "TaxiApp";

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Custom format for structured logging
const productionFormat = printf(
  ({ timestamp, level, message, context, trace, ...meta }) => {
    const logEntry: Record<string, any> = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: APP_NAME,
    };

    if (context) logEntry.context = context;
    if (trace) logEntry.trace = trace;
    if (Object.keys(meta).length) logEntry.meta = meta;

    return JSON.stringify(logEntry);
  }
);

// Development format for console readability
const developmentFormat = printf(
  ({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? ` [${context}]` : "";
    const traceStr = trace ? `\n${trace}` : "";
    return `${timestamp} ${level}:${contextStr} ${message}${traceStr}`;
  }
);

// Base transport configurations
const createDailyRotateTransport = (
  filename: string,
  level: string
): DailyRotateFile => {
  return new (DailyRotateFile as any)({
    filename: path.join(LOG_DIR, `${filename}-%DATE%.log`),
    datePattern: "YYYY-MM-DD",
    level,
    maxSize: "20m",
    maxFiles: "14d",
    auditFile: path.join(LOG_DIR, `${filename}-audit.json`),
    format: combine(
      timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      errors({ stack: true }),
      productionFormat
    ),
  });
};

// Console transport configuration
const createConsoleTransport = () => {
  if (NODE_ENV === "production") {
    return new winston.transports.Console({
      level: "error",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        errors({ stack: true }),
        productionFormat
      ),
    });
  }

  return new winston.transports.Console({
    level: LOG_LEVEL,
    format: combine(
      timestamp({ format: "HH:mm:ss.SSS" }),
      colorize({ all: true }),
      errors({ stack: true }),
      nestWinstonModuleUtilities.format.nestLike(APP_NAME, {
        prettyPrint: true,
        colors: true,
      })
    ),
  });
};

// Transport array based on environment
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [createConsoleTransport()];

  // Add file transports for production and staging
  if (NODE_ENV !== "test") {
    transports.push(
      createDailyRotateTransport("error", "error"),
      createDailyRotateTransport("combined", "info"),
      createDailyRotateTransport("debug", "debug")
    );
  }

  return transports;
};

// Exception and rejection handlers
const getExceptionHandlers = (): winston.transport[] => {
  if (NODE_ENV === "test") {
    return [];
  }

  return [
    createDailyRotateTransport("exceptions", "error"),
    new winston.transports.Console({
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        errors({ stack: true }),
        NODE_ENV === "production" ? productionFormat : developmentFormat
      ),
    }),
  ];
};

const getRejectionHandlers = (): winston.transport[] => {
  if (NODE_ENV === "test") {
    return [];
  }

  return [
    createDailyRotateTransport("rejections", "error"),
    new winston.transports.Console({
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        errors({ stack: true }),
        NODE_ENV === "production" ? productionFormat : developmentFormat
      ),
    }),
  ];
};

// Create raw Winston logger for direct use in services
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: APP_NAME,
    environment: NODE_ENV,
  },
  transports: getTransports(),
  exceptionHandlers: getExceptionHandlers(),
  rejectionHandlers: getRejectionHandlers(),
  exitOnError: false,
  silent: NODE_ENV === "test",
});

// Create NestJS Winston logger for NestJS modules
export const winstonLogger = WinstonModule.createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: APP_NAME,
    environment: NODE_ENV,
  },
  transports: getTransports(),
  exceptionHandlers: getExceptionHandlers(),
  rejectionHandlers: getRejectionHandlers(),
  exitOnError: false,
  silent: NODE_ENV === "test",
});

// Type-safe logger interface for TypeScript
export interface AppLogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Export typed logger for better TypeScript support
export const typedLogger: AppLogger = logger;

// Health check function for monitoring
export const loggerHealthCheck = (): boolean => {
  try {
    logger.info("Logger health check");
    return true;
  } catch (error) {
    console.error("Logger health check failed:", error);
    return false;
  }
};
