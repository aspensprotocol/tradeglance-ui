import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseDataFetchingOptions<T> {
  marketId: string | undefined;
  filterByTrader?: string;
  fetchFunction: (marketId: string, filterByTrader?: string) => Promise<T>;
  pollingInterval?: number;
  debounceMs?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export interface UseDataFetchingReturn<T> {
  data: T;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDataFetching<T>(
  options: UseDataFetchingOptions<T>
): UseDataFetchingReturn<T> {
  const {
    marketId,
    filterByTrader,
    fetchFunction,
    pollingInterval = 20000,
    debounceMs = 300,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T>({} as T);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lastDataHashRef = useRef<string>('');
  const hasLoadedOnceRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchData = useCallback(async (forceFetch = false) => {
    if (!marketId) {
      setData({} as T);
      setError(null);
      setInitialLoading(false);
      return;
    }

    // Rate limiting: prevent fetching more than once per second
    const now = Date.now();
    if (!forceFetch && now - lastFetchTimeRef.current < 1000) {
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    setLoading(true);
    setError(null);
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      console.log('Fetching data for market:', marketId, 'filterByTrader:', filterByTrader);
      
      const result = await fetchFunction(marketId, filterByTrader);
      
      // Create a hash of the data to detect changes
      const dataHash = JSON.stringify(result);
      if (dataHash === lastDataHashRef.current && !forceFetch) {
        console.log('Data unchanged, skipping update');
        return;
      }
      lastDataHashRef.current = dataHash;

      setData(result);
      onSuccess?.(result);
      
      // Mark as loaded once
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Mark as loaded even on error
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [marketId, filterByTrader, fetchFunction, onSuccess, onError]);

  // Debounced effect to prevent rapid re-fetches when marketId changes
  useEffect(() => {
    // Reset loading state when marketId changes
    setInitialLoading(true);
    hasLoadedOnceRef.current = false;
    lastDataHashRef.current = '';
    
    const timeoutId = setTimeout(() => {
      fetchData(true); // Force fetch on marketId change
    }, debounceMs);
    
    return () => clearTimeout(timeoutId);
  }, [marketId, filterByTrader, fetchData, debounceMs]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!marketId) return;
    
    const interval = setInterval(() => {
      fetchData(); // Regular polling
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [fetchData, pollingInterval]);

  return { 
    data, 
    loading, 
    initialLoading, 
    error, 
    refetch: () => fetchData(true) 
  };
} 