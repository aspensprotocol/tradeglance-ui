import { toast } from "../hooks/use-toast";

// Error types
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  WALLET = 'wallet',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

interface ErrorOptions {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  retry?: () => Promise<void>;
  silent?: boolean; // If true, don't show toast
}

// Default error messages by type
const DEFAULT_ERROR_MESSAGES = {
  [ErrorType.NETWORK]: 'Network connection error',
  [ErrorType.API]: 'API request failed',
  [ErrorType.WALLET]: 'Wallet connection error',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred'
};

/**
 * Handle application errors with consistent logging and user feedback
 */
export const handleError = (error: Error | unknown, options?: Partial<ErrorOptions>): void => {
  // Determine error type and extract message
  const errorType = options?.type || ErrorType.UNKNOWN;
  const errorMessage = options?.message || 
    (error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGES[errorType]);
  
  // Create full error options
  const fullOptions: ErrorOptions = {
    type: errorType,
    severity: options?.severity || ErrorSeverity.ERROR,
    message: errorMessage,
    details: options?.details || (error instanceof Error ? error.stack : undefined),
    retry: options?.retry,
    silent: options?.silent || false
  };

  // Log error to console with appropriate level
  console.group(`[${fullOptions.type.toUpperCase()}] ${fullOptions.message}`);
  console.error(error);
  if (fullOptions.details) {
    console.info('Details:', fullOptions.details);
  }
  console.groupEnd();

  // Show toast notification unless silent mode is enabled
  if (!fullOptions.silent) {
    toast({
      variant: fullOptions.severity === ErrorSeverity.INFO ? 'default' : 'destructive',
      title: fullOptions.message,
      description: fullOptions.details ? 
        `${fullOptions.details.substring(0, 100)}${fullOptions.details.length > 100 ? '...' : ''}` : 
        undefined,
      action: undefined
    });
  }
};

/**
 * Specialized handler for API connection errors
 */
export const handleApiError = (error: Error | unknown, endpoint?: string, retry?: () => Promise<void>): void => {
  handleError(error, {
    type: ErrorType.API,
    severity: ErrorSeverity.ERROR,
    message: `API connection error${endpoint ? ` (${endpoint})` : ''}`,
    retry
  });
};

/**
 * Specialized handler for wallet connection errors
 */
export const handleWalletError = (error: Error | unknown, retry?: () => Promise<void>): void => {
  handleError(error, {
    type: ErrorType.WALLET,
    severity: ErrorSeverity.WARNING,
    message: 'Wallet connection error',
    retry
  });
};

/**
 * Wrap an async function with error handling
 */
export const withErrorHandling = <T>(
  fn: () => Promise<T>,
  options?: Partial<ErrorOptions>
): Promise<T | undefined> => {
  return fn().catch(error => {
    handleError(error, options);
    return undefined;
  });
};