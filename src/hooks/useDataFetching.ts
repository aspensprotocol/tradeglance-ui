import { useCallback, useEffect, useRef, useState } from "react";
import { useBalanceCache } from "./useBalanceCache";

interface UseDataFetchingParams<T> {
  marketId: string;
  filterByTrader?: string;
  fetchFunction: (marketId: string, filterByTrader?: string) => Promise<T>;
  pollingInterval?: number;
  debounceMs?: number;
  cacheKey?: string; // Optional custom cache key
  cacheTimeout?: number; // Optional custom cache timeout
}

export function useDataFetching<T>({
  marketId,
  filterByTrader,
  fetchFunction,
  pollingInterval = 500,
  debounceMs = 50,
  cacheKey,
  cacheTimeout = 2000, // 2 seconds default cache timeout for orderbook data
}: UseDataFetchingParams<T>): {
  data: T;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetchTime: number;
  isFromCache: boolean;
} {
  // Use our centralized cache system
  const balanceCache = useBalanceCache();
  
  // Use useRef to prevent multiple initializations
  const initializedRef = useRef(false);
  const [data, setData] = useState<T>([] as T);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const maxRetries = 3;

  // Generate cache key for this data
  const dataCacheKey = cacheKey || `data-fetching-${marketId}-${filterByTrader || 'all'}`;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!marketId || marketId.trim() === "") {
      console.log(
        "useDataFetching: Skipping fetch - no marketId or empty marketId:",
        marketId,
      );
      setData([] as T);
      setError(null);
      setInitialLoading(false);
      return;
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = balanceCache.getCachedData(dataCacheKey);
      if (cachedData) {
        console.log("useDataFetching: Using cached data for:", dataCacheKey);
        setData(cachedData as T);
        setError(null);
        setLastFetchTime(Date.now());
        setIsFromCache(true);
        setInitialLoading(false);
        return;
      }
    }

    // Prevent multiple simultaneous fetches
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      console.log("useDataFetching: Fetching fresh data for marketId:", marketId);
      const result = await fetchFunction(marketId, filterByTrader);

      console.log("Data fetch result:", {
        marketId,
        resultType: typeof result,
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : "N/A",
        timestamp: new Date().toISOString(),
      });

      // Always replace data completely, never append
      if (Array.isArray(result)) {
        setData(result as T); // Type assertion for arrays
      } else if (result && typeof result === "object") {
        setData(result as T); // Type assertion for objects
      } else if (result === null || result === undefined) {
        // Handle null/undefined results
        setData([] as T);
      } else {
        // Fallback to empty array for unexpected types
        console.warn(
          "Unexpected result type from fetchFunction:",
          typeof result,
          result,
        );
        setData([] as T);
      }

      // Cache the successful result
      if (result && (Array.isArray(result) ? result.length > 0 : true)) {
        balanceCache.setCachedData(dataCacheKey, result);
        console.log("useDataFetching: Cached data for:", dataCacheKey);
      }

      setError(null);
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);

      // Increment retry count
      setRetryCount((prev) => prev + 1);

      // Don't clear existing data on error, just show the error
      // This prevents the UI from flickering between data and empty states
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [marketId, filterByTrader, fetchFunction, loading, balanceCache, dataCacheKey]);

  // Initial fetch - only run once
  useEffect(() => {
    if (initializedRef.current) return;

    const timeoutId = setTimeout(() => {
      initializedRef.current = true;
      fetchData();
    }, debounceMs);

    // eslint-disable-next-line consistent-return
    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [fetchData, debounceMs]);

  // Clear data when marketId changes to prevent stale data
  useEffect(() => {
    console.log("useDataFetching: Market ID changed, clearing previous data", {
      newMarketId: marketId,
    });
    setData([] as T);
    setError(null);
    setInitialLoading(true);
    initializedRef.current = false;
    setRetryCount(0); // Reset retry count for new market
    setLastFetchTime(0); // Reset last fetch time
    setIsFromCache(false);
    
    // Invalidate cache for the old market ID
    if (dataCacheKey) {
      balanceCache.invalidateCache(dataCacheKey);
    }
  }, [marketId, balanceCache, dataCacheKey]); // Only depend on marketId to prevent infinite loops

  // Set up polling - only after initial fetch
  useEffect(() => {
    if (
      !marketId ||
      marketId.trim() === "" ||
      pollingInterval <= 0 ||
      !initializedRef.current
    ) {
      console.log("useDataFetching: Skipping polling setup:", {
        hasMarketId: !!marketId,
        marketId,
        pollingInterval,
        initialized: initializedRef.current,
      });
      return;
    }

    // Don't poll if we've exceeded the retry limit
    if (retryCount >= maxRetries) {
      console.warn("Max retries exceeded, stopping polling");
      return;
    }

    console.log("useDataFetching: Setting up polling for marketId:", marketId);
    const interval = setInterval(() => {
      // Check if cache is stale before polling
      const cachedData = balanceCache.getCachedData(dataCacheKey);
      const isCacheStale = !cachedData || (Date.now() - lastFetchTime >= cacheTimeout);
      
      // Only poll if we're not currently loading, enough time has passed, and cache is stale
      if (!loading && Date.now() - lastFetchTime >= pollingInterval && isCacheStale) {
        console.log(
          "Polling for new data, last fetch was",
          Date.now() - lastFetchTime,
          "ms ago, cache stale:",
          isCacheStale,
        );
        fetchData();
      } else if (cachedData && !isCacheStale) {
        console.log("useDataFetching: Using fresh cached data, skipping poll");
        // Update timestamp to prevent immediate polling
        setLastFetchTime(Date.now());
      }
    }, pollingInterval);

    // eslint-disable-next-line consistent-return
    return (): void => {
      clearInterval(interval);
    };
  }, [
    marketId,
    pollingInterval,
    loading,
    lastFetchTime,
    fetchData,
    retryCount,
    maxRetries,
    balanceCache,
    dataCacheKey,
    cacheTimeout,
  ]);

  const refetch = useCallback(async (forceRefresh = false) => {
    setRetryCount(0); // Reset retry count on manual retry
    await fetchData(forceRefresh);
  }, [fetchData]);

  // Ensure data is always properly initialized to prevent .map() errors
  const safeData = data || ([] as T);

  return {
    data: safeData,
    loading,
    initialLoading,
    error,
    refetch,
    lastFetchTime,
    isFromCache,
  };
}
