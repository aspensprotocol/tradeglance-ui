import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import type { TradingPair } from "@/lib/shared-types";
import type { BaseOrQuote } from "@/lib/shared-types";

interface CachedBalance {
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

interface BalanceCache {
  [key: string]: CachedBalance;
}

const CACHE_DURATION = 30000; // 30 seconds
const CACHE_CLEANUP_INTERVAL = 60000; // 1 minute

export const useBalanceCache = () => {
  const [cache, setCache] = useState<BalanceCache>({});
  const { address } = useAccount();
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Cleanup expired cache entries
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    setCache((prevCache) => {
      const newCache = { ...prevCache };
      Object.keys(newCache).forEach((key) => {
        if (newCache[key].expiresAt < now) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, []);

  // Set up cleanup interval
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(
      cleanupExpiredCache,
      CACHE_CLEANUP_INTERVAL,
    );
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanupExpiredCache]);

  // Get cached data or return null if expired/missing
  const getCachedData = useCallback(
    (key: string) => {
      const cached = cache[key];
      if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
      }
      return null;
    },
    [cache],
  );

  // Set cached data with expiration
  const setCachedData = useCallback((key: string, data: unknown) => {
    const now = Date.now();
    setCache((prevCache) => ({
      ...prevCache,
      [key]: {
        data,
        timestamp: now,
        expiresAt: now + CACHE_DURATION,
      },
    }));
  }, []);

  // Invalidate specific cache entry
  const invalidateCache = useCallback((key: string) => {
    setCache((prevCache) => {
      const newCache = { ...prevCache };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newCache[key];
      return newCache;
    });
  }, []);

  // Invalidate all cache
  const invalidateAllCache = useCallback(() => {
    setCache({});
  }, []);

  // Generate cache key for trading pair balance
  const getTradingPairCacheKey = useCallback(
    (
      tradingPair?: TradingPair,
      side?: BaseOrQuote.BASE | BaseOrQuote.QUOTE,
    ) => {
      if (!tradingPair || !address) return null;
      return `trading-pair-${tradingPair.id}-${side}-${address}`;
    },
    [address],
  );

  // Generate cache key for all balances
  const getAllBalancesCacheKey = useCallback(() => {
    if (!address) return null;
    return `all-balances-${address}`;
  }, [address]);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    invalidateAllCache,
    getTradingPairCacheKey,
    getAllBalancesCacheKey,
  };
};
