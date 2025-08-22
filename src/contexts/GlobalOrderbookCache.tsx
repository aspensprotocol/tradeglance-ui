import React, { useState, useCallback, useRef, useEffect } from "react";
import { GlobalOrderbookCacheContext } from "./global-orderbook-context";
import type { CachedOrderbookData, GlobalOrderbookCacheContextType, SharedOrderbookData } from "../lib/shared-types";

interface GlobalOrderbookCacheProviderProps {
  children: React.ReactNode;
}

export function GlobalOrderbookCacheProvider({ children }: GlobalOrderbookCacheProviderProps): JSX.Element {
  const [cache, setCache] = useState<Map<string, CachedOrderbookData>>(new Map());
  const cacheTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up stale cache entries every 5 minutes
  useEffect(() => {
    cacheTimeoutRef.current = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      setCache(prevCache => {
        const newCache = new Map();
        for (const [marketId, data] of prevCache.entries()) {
          if (now - data.lastUpdate.getTime() < staleThreshold) {
            newCache.set(marketId, data);
          }
        }
        return newCache;
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      if (cacheTimeoutRef.current) {
        clearInterval(cacheTimeoutRef.current);
      }
    };
  }, []);

  const getCachedData = useCallback((marketId: string, filterByTrader?: string): CachedOrderbookData | null => {
    // Create a cache key that includes the filter
    const cacheKey = filterByTrader ? `${marketId}:${filterByTrader}` : marketId;
    const cached = cache.get(cacheKey);
    
    // Enhanced debugging with stack trace
    const stackTrace = new Error().stack;
    console.log("🔍 GlobalCache getCachedData:", {
      marketId,
      filterByTrader,
      cacheKey,
      hasCached: !!cached,
      cacheSize: cache.size,
      allCacheKeys: Array.from(cache.keys()),
      timestamp: new Date().toISOString(),
      stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n'), // First few lines of stack
    });
    
    if (!cached) return null;

    // Check if data is stale (older than 5 minutes)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const age = now - cached.lastUpdate.getTime();
    console.log("🔍 GlobalCache data age check:", {
      marketId,
      filterByTrader,
      cacheKey,
      ageMs: age,
      maxAgeMs: maxAge,
      isStale: age > maxAge,
      lastUpdate: cached.lastUpdate.toISOString(),
    });
    
    if (age > maxAge) {
      console.log("🗑️ GlobalCache removing stale data for:", cacheKey);
      // Remove stale data
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      return null;
    }

    console.log("✅ GlobalCache returning cached data for:", cacheKey);
    return cached;
  }, [cache]);

  const setCachedData = useCallback((marketId: string, data: SharedOrderbookData, filterByTrader?: string) => {
    // Create a cache key that includes the filter
    const cacheKey = filterByTrader ? `${marketId}:${filterByTrader}` : marketId;
    
    // Enhanced debugging with stack trace
    const stackTrace = new Error().stack;
    console.log("💾 GlobalCache setCachedData:", {
      marketId,
      filterByTrader,
      cacheKey,
      orderBookBids: data.orderbook?.bids?.length || 0,
      orderBookAsks: data.orderbook?.asks?.length || 0,
      openOrders: data.openOrders?.length || 0,
      timestamp: new Date().toISOString(),
      stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n'), // First few lines of stack
    });
    
    // VISIBLE DEBUG: Show when data is being cached
    if (typeof window !== 'undefined' && marketId) {
      console.warn("💾 CACHING DATA FOR MARKET:", cacheKey);
    }
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, {
        marketId,
        orderbook: data.orderbook,
        openOrders: data.openOrders,
        lastUpdate: data.lastUpdate,
        filterByTrader, // Store the filter for reference
      });
      console.log("💾 GlobalCache updated, new size:", newCache.size);
      return newCache;
    });
  }, []);

  const clearCache = useCallback((marketId?: string, filterByTrader?: string) => {
    if (marketId) {
      if (filterByTrader) {
        // Clear specific filtered data
        const cacheKey = `${marketId}:${filterByTrader}`;
        console.log("🗑️ GlobalCache clearing specific filtered market:", cacheKey);
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(cacheKey);
          return newCache;
        });
      } else {
        // Clear all data for this market (both filtered and unfiltered)
        console.log("🗑️ GlobalCache clearing all data for market:", marketId);
        setCache(prev => {
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
      console.log("🗑️ GlobalCache clearing all cache");
      setCache(new Map());
    }
  }, []);

  // Add a method to check if we should clear cache (prevent unnecessary clearing)
  const shouldClearCache = useCallback((marketId: string, filterByTrader?: string): boolean => {
    // Don't clear cache if we have recent data
    const cached = getCachedData(marketId, filterByTrader);
    if (cached) {
      const age = Date.now() - cached.lastUpdate.getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (age < maxAge) {
        console.log("🔒 GlobalCache: Preventing cache clear for recent data:", {
          marketId,
          filterByTrader,
          ageMs: age,
          maxAgeMs: maxAge,
        });
        return false;
      }
    }
    return true;
  }, [getCachedData]);

  const isDataStale = useCallback((marketId: string, maxAgeMs: number = 5 * 60 * 1000, filterByTrader?: string): boolean => {
    // Create a cache key that includes the filter
    const cacheKey = filterByTrader ? `${marketId}:${filterByTrader}` : marketId;
    const cached = cache.get(cacheKey);
    if (!cached) {
      console.log("🔍 GlobalCache isDataStale: No cached data for:", cacheKey);
      return true;
    }

    const now = Date.now();
    const age = now - cached.lastUpdate.getTime();
    const isStale = age > maxAgeMs;
    
    console.log("🔍 GlobalCache isDataStale check:", {
      marketId,
      filterByTrader,
      cacheKey,
      ageMs: age,
      maxAgeMs,
      isStale,
      lastUpdate: cached.lastUpdate.toISOString(),
    });
    
    return isStale;
  }, [cache]);

  const getCacheStats = useCallback(() => {
    const stats = {
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
    };
    
    console.log("📊 GlobalCache Stats:", stats);
    return stats;
  }, [cache]);

  const contextValue: GlobalOrderbookCacheContextType = {
    getCachedData,
    setCachedData,
    clearCache,
    isDataStale,
    getCacheStats,
    shouldClearCache,
  };

  return (
    <GlobalOrderbookCacheContext.Provider value={contextValue}>
      {children}
    </GlobalOrderbookCacheContext.Provider>
  );
}


