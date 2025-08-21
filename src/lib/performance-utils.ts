import React from "react";

// Performance monitoring utilities for the application

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = import.meta.env.DEV;

  /**
   * Start timing a performance metric
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing a performance metric
   */
  end(name: string): number | undefined {
    if (!this.isEnabled) return undefined;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return undefined;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log performance metrics in development
    if (import.meta.env.DEV) {
      console.log(
        `⏱️ Performance: ${name} took ${metric.duration.toFixed(2)}ms`,
        metric.metadata,
      );
    }

    return metric.duration;
  }

  /**
   * Measure the execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all performance metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render performance
export const usePerformanceMeasure = (componentName: string) => {
  React.useEffect(() => {
    performanceMonitor.start(`${componentName}-render`);

    return () => {
      performanceMonitor.end(`${componentName}-render`);
    };
  });
};

// Utility function to measure expensive operations
export const measureOperation = <T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, unknown>,
): T => {
  return performanceMonitor.measureSync(name, operation, metadata);
};

// Utility function to measure async operations
export const measureAsyncOperation = <T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> => {
  return performanceMonitor.measureAsync(name, operation, metadata);
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = <T extends (...args: unknown[]) => unknown>(
  func: T,
  getKey?: (...args: Parameters<T>) => string,
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
};

// Batch updates utility for performance
export const batchUpdates = <T>(
  updates: (() => T)[],
  batchSize = 10,
): Promise<T[]> => {
  return new Promise((resolve) => {
    const results: T[] = [];
    let currentIndex = 0;

    const processBatch = () => {
      const batch = updates.slice(currentIndex, currentIndex + batchSize);
      currentIndex += batchSize;

      batch.forEach((update) => {
        try {
          results.push(update());
        } catch (error) {
          console.error("Error in batch update:", error);
        }
      });

      if (currentIndex < updates.length) {
        // Use requestIdleCallback for better performance
        if ("requestIdleCallback" in window) {
          requestIdleCallback(processBatch);
        } else {
          setTimeout(processBatch, 0);
        }
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
};

export default performanceMonitor;
