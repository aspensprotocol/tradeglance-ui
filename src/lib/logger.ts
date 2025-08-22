/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and formatting options
 */

// Log levels
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  prefix?: string;
  enableTimestamp: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  prefix: "🌲 TradeGlance",
  enableTimestamp: true,
};

// Current configuration
let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

// Log level priorities (higher number = higher priority)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Format a log message with optional timestamp and prefix
 */
function formatLogMessage(message: string, level: LogLevel): string {
  const parts: string[] = [];

  if (currentConfig.enableTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  if (currentConfig.prefix) {
    parts.push(`${currentConfig.prefix}`);
  }

  parts.push(`[${level.toUpperCase()}]`);
  parts.push(message);

  return parts.join(" ");
}

/**
 * Check if a log level should be displayed based on the current configuration
 */
function shouldLog(level: LogLevel): boolean {
  return (
    LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentConfig.minLevel]
  );
}

/**
 * Configure the logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Log a debug message
 */
export function debug(message: string, ...args: unknown[]): void {
  if (!shouldLog(LogLevel.DEBUG)) return;

  const formattedMessage = formatLogMessage(message, LogLevel.DEBUG);
  if (currentConfig.enableConsole) {
    console.debug(formattedMessage, ...args);
  }
}

/**
 * Log an info message
 */
export function info(message: string, ...args: unknown[]): void {
  if (!shouldLog(LogLevel.INFO)) return;

  const formattedMessage = formatLogMessage(message, LogLevel.INFO);
  if (currentConfig.enableConsole) {
    console.info(formattedMessage, ...args);
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  if (!shouldLog(LogLevel.WARN)) return;

  const formattedMessage = formatLogMessage(message, LogLevel.WARN);
  if (currentConfig.enableConsole) {
    console.warn(formattedMessage, ...args);
  }
}

/**
 * Log an error message
 */
export function error(message: string, ...args: unknown[]): void {
  if (!shouldLog(LogLevel.ERROR)) return;

  const formattedMessage = formatLogMessage(message, LogLevel.ERROR);
  if (currentConfig.enableConsole) {
    console.error(formattedMessage, ...args);
  }
}

/**
 * Create a logger instance with a specific context
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, ...args: unknown[]) =>
      debug(`[${context}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) =>
      info(`[${context}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) =>
      warn(`[${context}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) =>
      error(`[${context}] ${message}`, ...args),
  };
}

// Export a default logger
export default {
  debug,
  info,
  warn,
  error,
  createLogger,
  configureLogger,
};
