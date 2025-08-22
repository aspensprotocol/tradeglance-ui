import React, { useState, useCallback, useRef, useEffect } from "react";
import { GlobalOrderbookCacheContext, type CachedOrderbookData, type GlobalOrderbookCacheContextType } from "./global-orderbook-context";

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

  const getCachedData = useCallback((marketId: string): CachedOrderbookData | null => {
    const cached = cache.get(marketId);
    console.log("🔍 GlobalCache getCachedData:", {
      marketId,
      hasCached: !!cached,
      cacheSize: cache.size,
      allCacheKeys: Array.from(cache.keys()),
      timestamp: new Date().toISOString(),
    });
    
    if (!cached) return null;

    // Check if data is stale (older than 5 minutes)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const age = now - cached.lastUpdate.getTime();
    console.log("🔍 GlobalCache data age check:", {
      marketId,
      ageMs: age,
      maxAgeMs: maxAge,
      isStale: age > maxAge,
      lastUpdate: cached.lastUpdate.toISOString(),
    });
    
    if (age > maxAge) {
      console.log("🗑️ GlobalCache removing stale data for:", marketId);
      // Remove stale data
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(marketId);
        return newCache;
      });
      return null;
    }

    console.log("✅ GlobalCache returning cached data for:", marketId);
    return cached;
  }, [cache]);

  const setCachedData = useCallback((marketId: string, data: Omit<CachedOrderbookData, 'marketId'>) => {
    console.log("💾 GlobalCache setCachedData:", {
      marketId,
      orderBookBids: data.orderbook?.bids?.length || 0,
      orderBookAsks: data.orderbook?.asks?.length || 0,
      openOrders: data.openOrders?.length || 0,
      timestamp: new Date().toISOString(),
    });
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(marketId, {
        ...data,
        marketId,
        lastUpdate: new Date(),
      });
      console.log("💾 GlobalCache updated, new size:", newCache.size);
      return newCache;
    });
  }, []);

  const clearCache = useCallback((marketId?: string) => {
    if (marketId) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(marketId);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  const isDataStale = useCallback((marketId: string, maxAgeMs: number = 5 * 60 * 1000): boolean => {
    const cached = cache.get(marketId);
    if (!cached) return true;

    const now = Date.now();
    return (now - cached.lastUpdate.getTime()) > maxAgeMs;
  }, [cache]);

  const contextValue: GlobalOrderbookCacheContextType = {
    getCachedData,
    setCachedData,
    clearCache,
    isDataStale,
  };

  return (
    <GlobalOrderbookCacheContext.Provider value={contextValue}>
      {children}
    </GlobalOrderbookCacheContext.Provider>
  );
}


