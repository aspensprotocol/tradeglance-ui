import { toast } from "../hooks/use-toast";

// Error types
export enum ErrorType {
  NETWORK = "network",
  API = "api",
  WALLET = "wallet",
  UNKNOWN = "unknown",
}

// Error severity levels
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

interface ErrorOptions {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  retry?: () => Promise<void>;
  silent?: boolean; // If true, don't show toast
}

// Error suppression tracking to prevent spam
const errorSuppressionMap = new Map<
  string,
  { count: number; lastSeen: number; suppressed: boolean }
>();
const SUPPRESSION_THRESHOLD = 3; // Number of errors before suppression
const SUPPRESSION_DURATION = 30000; // 30 seconds suppression

// Default error messages by type
const DEFAULT_ERROR_MESSAGES = {
  [ErrorType.NETWORK]: "Network connection error",
  [ErrorType.API]: "API request failed",
  [ErrorType.WALLET]: "Wallet connection error",
  [ErrorType.UNKNOWN]: "An unexpected error occurred",
};

/**
 * Handle application errors with consistent logging and user feedback
 */
export const handleError = (
  error: Error | unknown,
  options?: Partial<ErrorOptions>,
): void => {
  // Determine error type and extract message
  const errorType = options?.type || ErrorType.UNKNOWN;
  const errorMessage =
    options?.message ||
    (error instanceof Error
      ? error.message
      : DEFAULT_ERROR_MESSAGES[errorType]);

  // Create full error options
  const fullOptions: ErrorOptions = {
    type: errorType,
    severity: options?.severity || ErrorSeverity.ERROR,
    message: errorMessage,
    details:
      options?.details || (error instanceof Error ? error.stack : undefined),
    retry: options?.retry,
    silent: options?.silent || false,
  };

  // Create error key for suppression tracking
  const errorKey = `${errorType}-${errorMessage.substring(0, 100)}`;
  const now = Date.now();
  const suppressionData = errorSuppressionMap.get(errorKey);

  // Check if error should be suppressed
  if (suppressionData) {
    suppressionData.count++;
    suppressionData.lastSeen = now;

    if (suppressionData.count >= SUPPRESSION_THRESHOLD) {
      suppressionData.suppressed = true;
    }
  } else {
    errorSuppressionMap.set(errorKey, {
      count: 1,
      lastSeen: now,
      suppressed: false,
    });
  }

  // Log error to console with appropriate level
  console.group(`[${fullOptions.type.toUpperCase()}] ${fullOptions.message}`);
  console.error(error);
  if (fullOptions.details) {
    // Details are already logged above
  }
  console.groupEnd();

  // Show toast notification unless silent mode is enabled or error is suppressed
  if (
    !fullOptions.silent &&
    (!suppressionData?.suppressed ||
      now - suppressionData.lastSeen > SUPPRESSION_DURATION)
  ) {
    toast({
      variant:
        fullOptions.severity === ErrorSeverity.INFO ? "default" : "destructive",
      title: fullOptions.message,
      description: fullOptions.details
        ? `${fullOptions.details.substring(0, 100)}${fullOptions.details.length > 100 ? "..." : ""}`
        : undefined,
      action: undefined,
    });

    // Reset suppression if we show the toast
    if (suppressionData) {
      suppressionData.suppressed = false;
      suppressionData.count = 0;
    }
  }
};

/**
 * Specialized handler for API connection errors
 */
export const handleApiError = (
  error: Error | unknown,
  endpoint?: string,
  retry?: () => Promise<void>,
): void => {
  // Check if this is a network/connection error that should be suppressed
  const isNetworkError =
    error instanceof Error &&
    (error.message.includes("Failed to fetch") ||
      error.message.includes("network error") ||
      error.message.includes("connection") ||
      error.message.includes("ConnectError") ||
      error.message.includes("[unknown]") ||
      error.message.includes("ConnectError: [unknown] Failed to fetch") ||
      (error.message.includes("ConnectError") &&
        error.message.includes("Failed to fetch")) ||
      // More specific patterns for common spam errors
      error.message.includes("ConnectError: [unknown]") ||
      (error.message.includes("ConnectError") &&
        error.message.includes("[unknown]")) ||
      // Add 503 Service Unavailable and connection reset errors
      error.message.includes("503") ||
      error.message.includes("Service Unavailable") ||
      error.message.includes("upstream connect error") ||
      error.message.includes("reset before headers") ||
      error.message.includes("remote reset") ||
      error.message.includes("ERR_INCOMPLETE_CHUNKED_ENCODING"));

  // Create a more specific error key for API errors
  const apiErrorKey = `API-${endpoint || "unknown"}-${error instanceof Error ? error.message.substring(0, 100) : "unknown"}`;
  const now = Date.now();
  const suppressionData = errorSuppressionMap.get(apiErrorKey);

  // Check if error should be suppressed
  if (suppressionData) {
    suppressionData.count++;
    suppressionData.lastSeen = now;

    if (suppressionData.count >= SUPPRESSION_THRESHOLD) {
      suppressionData.suppressed = true;
    }
  } else {
    errorSuppressionMap.set(apiErrorKey, {
      count: 1,
      lastSeen: now,
      suppressed: false,
    });
  }

  // Only show toast for non-network errors or if not suppressed
  if (isNetworkError) {
    // Log the error but don't show toast for network errors
    console.warn(
      `API connection error${endpoint ? ` (${endpoint})` : ""}:`,
      error,
    );
    return;
  }

  // For non-network errors, check suppression
  if (
    suppressionData?.suppressed &&
    now - suppressionData.lastSeen < SUPPRESSION_DURATION
  ) {
    console.warn(
      `API error suppressed${endpoint ? ` (${endpoint})` : ""}:`,
      error,
    );
    return;
  }

  handleError(error, {
    type: ErrorType.API,
    severity: ErrorSeverity.ERROR,
    message: `API connection error${endpoint ? ` (${endpoint})` : ""}`,
    retry,
    silent: false,
  });
};

/**
 * Specialized handler for wallet connection errors
 */
export const handleWalletError = (
  error: Error | unknown,
  retry?: () => Promise<void>,
): void => {
  handleError(error, {
    type: ErrorType.WALLET,
    severity: ErrorSeverity.WARNING,
    message: "Wallet connection error",
    retry,
  });
};

/**
 * Wrap an async function with error handling
 */
export const withErrorHandling = <T>(
  fn: () => Promise<T>,
  options?: Partial<ErrorOptions>,
): Promise<T | undefined> => {
  return fn().catch((error) => {
    handleError(error, options);
    return undefined;
  });
};

/**
 * Clean up old suppression entries to prevent memory leaks
 */
export const cleanupErrorSuppression = (): void => {
  const now = Date.now();
  const cutoff = now - SUPPRESSION_DURATION * 2; // Remove entries older than 2x suppression duration

  for (const [key, data] of errorSuppressionMap.entries()) {
    if (data.lastSeen < cutoff) {
      errorSuppressionMap.delete(key);
    }
  }
};

// Clean up suppression map every 5 minutes
setInterval(cleanupErrorSuppression, 5 * 60 * 1000);

/**
 * Clear suppression for a specific error type to allow it to show again
 */
export const clearErrorSuppression = (errorType: ErrorType): void => {
  for (const [key] of errorSuppressionMap.entries()) {
    if (key.startsWith(errorType)) {
      errorSuppressionMap.delete(key);
    }
  }
};

/**
 * Clear all error suppressions to allow errors to show again
 * Useful when connection is restored
 */
export const clearAllErrorSuppressions = (): void => {
  errorSuppressionMap.clear();
};
