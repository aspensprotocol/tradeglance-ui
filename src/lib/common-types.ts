/**
 * Common types and interfaces used across the application
 * This file consolidates frequently used patterns to avoid duplication
 */

/**
 * Base interface for hooks that manage async data fetching
 */
export interface BaseAsyncState {
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
}

/**
 * Interface for hooks that manage async data with refresh capability
 */
export interface AsyncDataState<T> extends BaseAsyncState {
  data: T;
  refresh: () => Promise<void>;
  lastUpdate?: Date;
}

/**
 * Interface for hooks that manage lists/arrays of data
 */
export interface AsyncListState<T> extends BaseAsyncState {
  items: T[];
  refresh: () => Promise<void>;
  refetch?: () => Promise<void>; // Alias for backward compatibility
}

/**
 * Common loading states utility
 */
export interface LoadingStates {
  isLoading: boolean;
  isInitialLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
}

/**
 * Helper function to determine loading states
 */
export function getLoadingStates<T>(
  data: T | T[] | null,
  loading: boolean,
  initialLoading: boolean,
  error: string | null
): LoadingStates {
  const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
  
  return {
    isLoading: loading,
    isInitialLoading: initialLoading,
    hasError: !!error,
    isEmpty: isEmpty && !loading && !initialLoading,
  };
}

/**
 * Common retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

/**
 * Common polling configuration
 */
export interface PollingConfig {
  enabled: boolean;
  interval: number;
  maxAge: number; // Maximum age before data is considered stale
}

/**
 * Default polling configuration
 */
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  enabled: true,
  interval: 20000, // 20 seconds
  maxAge: 60000,   // 1 minute
};
