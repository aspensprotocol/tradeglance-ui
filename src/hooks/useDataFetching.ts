import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDataFetchingParams<T> {
  marketId: string;
  filterByTrader?: string;
  fetchFunction: (marketId: string, filterByTrader?: string) => Promise<T>;
  pollingInterval?: number;
  debounceMs?: number;
}

interface UseDataFetchingReturn<T> {
  data: T;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetchTime: number;
}

export function useDataFetching<T>({
  marketId,
  filterByTrader,
  fetchFunction,
  pollingInterval = 20000,
  debounceMs = 300
}: UseDataFetchingParams<T>) {
  // Use useRef to prevent multiple initializations
  const initializedRef = useRef(false);
  const [data, setData] = useState<T>([] as T);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchData = useCallback(async () => {
    if (!marketId || marketId.trim() === '') {
      console.log('useDataFetching: Skipping fetch - no marketId or empty marketId:', marketId);
      setData([] as T);
      setError(null);
      setInitialLoading(false);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useDataFetching: Fetching data for marketId:', marketId);
      const result = await fetchFunction(marketId, filterByTrader);
      
      console.log('Data fetch result:', {
        marketId,
        resultType: typeof result,
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 'N/A',
        timestamp: new Date().toISOString()
      });
      
      // Always replace data completely, never append
      if (Array.isArray(result)) {
        setData(result as T); // Type assertion for arrays
      } else if (result && typeof result === 'object') {
        setData(result as T); // Type assertion for objects
      } else if (result === null || result === undefined) {
        // Handle null/undefined results
        setData([] as T);
      } else {
        // Fallback to empty array for unexpected types
        console.warn('Unexpected result type from fetchFunction:', typeof result, result);
        setData([] as T);
      }
      
      setError(null);
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Don't clear existing data on error, just show the error
      // This prevents the UI from flickering between data and empty states
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [marketId, filterByTrader, fetchFunction, loading]);

  // Initial fetch - only run once
  useEffect(() => {
    if (initializedRef.current) return;
    
    const timeoutId = setTimeout(() => {
      initializedRef.current = true;
      fetchData();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [fetchData, debounceMs]);

  // Clear data when marketId changes to prevent stale data
  useEffect(() => {
    console.log('useDataFetching: Market ID changed, clearing previous data', {
      newMarketId: marketId
    });
    setData([] as T);
    setError(null);
    setInitialLoading(true);
    initializedRef.current = false;
    setRetryCount(0); // Reset retry count for new market
    setLastFetchTime(0); // Reset last fetch time
  }, [marketId]); // Only depend on marketId to prevent infinite loops

  // Set up polling - only after initial fetch
  useEffect(() => {
    if (!marketId || marketId.trim() === '' || pollingInterval <= 0 || !initializedRef.current) {
      console.log('useDataFetching: Skipping polling setup:', {
        hasMarketId: !!marketId,
        marketId,
        pollingInterval,
        initialized: initializedRef.current
      });
      return;
    }
    
    // Don't poll if we've exceeded the retry limit
    if (retryCount >= maxRetries) {
      console.warn('Max retries exceeded, stopping polling');
      return;
    }

    console.log('useDataFetching: Setting up polling for marketId:', marketId);
    const interval = setInterval(() => {
      // Only poll if we're not currently loading and enough time has passed
      if (!loading && (Date.now() - lastFetchTime) >= pollingInterval) {
        console.log('Polling for new data, last fetch was', Date.now() - lastFetchTime, 'ms ago');
        fetchData();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [marketId, pollingInterval, loading, lastFetchTime, fetchData, retryCount, maxRetries]);

  const refetch = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual retry
    fetchData();
  }, [fetchData]);

  // Ensure data is always properly initialized to prevent .map() errors
  const safeData = data || ([] as T);

  return {
    data: safeData,
    loading,
    initialLoading,
    error,
    refetch,
    lastFetchTime
  };
} 