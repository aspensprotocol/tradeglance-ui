import React, { useState, useCallback, useRef, useEffect } from "react";
import { GlobalOrderbookCacheContext } from "./global-orderbook-context";
import type {
  CachedOrderbookData,
  GlobalOrderbookCacheContextType,
  SharedOrderbookData,
} from "../lib/shared-types";

interface GlobalOrderbookCacheProviderProps {
  children: React.ReactNode;
}

export function GlobalOrderbookCacheProvider({
  children,
}: GlobalOrderbookCacheProviderProps): JSX.Element {
  const [cache, setCache] = useState<Map<string, CachedOrderbookData>>(
    new Map(),
  );
  const cacheTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up stale cache entries every 5 minutes
  useEffect(() => {
    cacheTimeoutRef.current = setInterval(
      () => {
        const now = Date.now();
        const staleThreshold = 5 * 60 * 1000; // 5 minutes

        setCache((prevCache) => {
          const newCache = new Map();
          for (const [marketId, data] of prevCache.entries()) {
            if (now - data.lastUpdate.getTime() < staleThreshold) {
              newCache.set(marketId, data);
            }
          }
          return newCache;
        });
      },
      5 * 60 * 1000,
    );

    return () => {
      if (cacheTimeoutRef.current) {
        clearInterval(cacheTimeoutRef.current);
      }
    };
  }, []);

  const getCachedData = useCallback(
    (marketId: string, filterByTrader?: string): CachedOrderbookData | null => {
      const cacheKey = filterByTrader
        ? `${marketId}:${filterByTrader}`
        : marketId;
      const cached = cache.get(cacheKey);

      if (!cached) {
        return null;
      }

      // Check if data is stale
      const now = Date.now();
      const ageMs = now - cached.lastUpdate.getTime();

      if (ageMs > 5 * 60 * 1000) {
        // 5 minutes
        // Remove stale data
        setCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(cacheKey);
          return newCache;
        });
        return null;
      }

      return cached;
    },
    [cache],
  );

  const setCachedData = useCallback(
    (marketId: string, data: SharedOrderbookData, filterByTrader?: string) => {
      // Create a cache key that includes the filter
      const cacheKey = filterByTrader
        ? `${marketId}:${filterByTrader}`
        : marketId;

      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          marketId,
          orderbook: data.orderbook,
          openOrders: data.openOrders,
          lastUpdate: data.lastUpdate,
          filterByTrader,
        });
        return newCache;
      });
    },
    [],
  );

  const clearCache = useCallback(
    (marketId?: string, filterByTrader?: string) => {
      if (marketId) {
        if (filterByTrader) {
          // Clear specific filtered data
          const cacheKey = `${marketId}:${filterByTrader}`;
          setCache((prev) => {
            const newCache = new Map(prev);
            newCache.delete(cacheKey);
            return newCache;
          });
        } else {
          // Clear all data for this market (both filtered and unfiltered)
          setCache((prev) => {
            const newCache = new Map(prev);
            // Remove all entries that start with this marketId
            for (const key of newCache.keys()) {
              if (key.startsWith(`${marketId}:`)) {
                newCache.delete(key);
              }
            }
            // Also remove the unfiltered entry
            newCache.delete(marketId);
            return newCache;
          });
        }
      } else {
        setCache(new Map());
      }
    },
    [],
  );

  const isDataStale = useCallback(
    (
      marketId: string,
      maxAgeMs: number = 5 * 60 * 1000,
      filterByTrader?: string,
    ): boolean => {
      // Create a cache key that includes the filter
      const cacheKey = filterByTrader
        ? `${marketId}:${filterByTrader}`
        : marketId;
      const cached = cache.get(cacheKey);
      if (!cached) {
        return true;
      }

      const now = Date.now();
      const age = now - cached.lastUpdate.getTime();
      return age > maxAgeMs;
    },
    [cache],
  );

  const contextValue: GlobalOrderbookCacheContextType = {
    getCachedData,
    setCachedData,
    clearCache,
    isDataStale,
    getCacheStats: () => ({
      totalEntries: cache.size,
      keys: Array.from(cache.keys()),
      entries: Array.from(cache.entries()).map(([key, data]) => ({
        key,
        marketId: data.marketId,
        filterByTrader: data.filterByTrader,
        hasOrderbook: !!data.orderbook,
        orderbookBids: data.orderbook?.bids?.length || 0,
        orderbookAsks: data.orderbook?.asks?.length || 0,
        hasOpenOrders: !!data.openOrders,
        openOrdersCount: data.openOrders?.length || 0,
        lastUpdate: data.lastUpdate.toISOString(),
        ageMs: Date.now() - data.lastUpdate.getTime(),
      })),
    }),
    shouldClearCache: (marketId: string, filterByTrader?: string) => {
      const cached = getCachedData(marketId, filterByTrader);
      if (cached) {
        const age = Date.now() - cached.lastUpdate.getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return age >= maxAge;
      }
      return true;
    },
  };

  return (
    <GlobalOrderbookCacheContext.Provider value={contextValue}>
      {children}
    </GlobalOrderbookCacheContext.Provider>
  );
}
