import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { 
  usePerformanceMeasure, 
  debounce, 
  throttle, 
  measureOperation,
  batchUpdates as existingBatchUpdates
} from '@/lib/performance-utils';

/**
 * Hook for performance optimizations in React components
 * Uses existing performance utilities to avoid duplication
 */
export function usePerformanceOptimization(componentName: string) {
  const renderCount = useRef(0);
  
  // Use existing performance measurement hook
  usePerformanceMeasure(componentName);

  // Track render count
  useEffect(() => {
    renderCount.current += 1;
    
    // Log performance metrics in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${componentName}: Render #${renderCount.current}`);
    }
  });

  // Debounced callback helper using existing debounce utility
  const createDebouncedCallback = useCallback(<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number,
    callbackName: string
  ) => {
    return debounce((...args: unknown[]) => {
      measureOperation(`${componentName}-${callbackName}`, () => {
        (callback as (...args: unknown[]) => unknown)(...args);
      });
    }, delay);
  }, [componentName]);

  // Throttled callback helper using existing throttle utility
  const createThrottledCallback = useCallback(<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number,
    callbackName: string
  ) => {
    return throttle((...args: unknown[]) => {
      measureOperation(`${componentName}-${callbackName}`, () => {
        (callback as (...args: unknown[]) => unknown)(...args);
      });
    }, delay);
  }, [componentName]);

  // Batch updates helper using existing utility
  const batchUpdates = useCallback(<T>(
    updates: (() => T)[],
    batchSize = 10,
    operationName: string
  ): Promise<T[]> => {
    return measureOperation(`${componentName}-${operationName}`, () => 
      existingBatchUpdates(updates, batchSize)
    );
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    createDebouncedCallback,
    createThrottledCallback,
    batchUpdates,
  };
}

/**
 * Hook for optimizing list rendering with virtualization
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

/**
 * Hook for optimizing expensive data transformations
 * Uses existing memoize utility from performance-utils
 */
export function useDataTransformation<T, R>(
  data: T,
  transform: (data: T) => R,
  transformName = 'transform'
) {
  const memoizedTransform = useCallback(transform, [transform]);
  
  return useMemo(() => {
    return measureOperation(`data-${transformName}`, () => memoizedTransform(data));
  }, [data, memoizedTransform, transformName]);
}

// Note: Network optimization is handled by the existing useDataFetching hook
// which already includes debouncing, retry logic, and caching functionality
