import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderbookEntry } from '../lib/grpc-client';
import { weiToDecimal, formatDecimal } from '../lib/number-utils';

// Utility function to create a Date object from Unix timestamp in user's timezone
const createLocalDate = (unixTimestamp: number): Date => {
  // Unix timestamps are in UTC, convert to user's local timezone
  const date = new Date(unixTimestamp * 1000);
  console.log(`Unix timestamp: ${unixTimestamp}, Local time: ${date.toLocaleString()}, Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  return date;
};

export interface RecentTrade {
  id: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: Date;
  txHash?: string;
}

export interface UseRecentTradesReturn {
  trades: RecentTrade[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Shared cache for orderbook data to avoid duplicate requests
const orderbookCache = new Map<string, { data: OrderbookEntry[], timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds

export function useRecentTrades(marketId: string | undefined): UseRecentTradesReturn {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastDataHashRef = useRef<string>('');
  const hasLoadedOnceRef = useRef<boolean>(false);

  const processOrderbookData = useCallback((orderbookEntries: OrderbookEntry[]) => {
    // Create a hash of the data to check if it's changed
    const dataHash = JSON.stringify(orderbookEntries.map(e => ({ 
      order_id: e.order_id, 
      price: e.price, 
      quantity: e.quantity, 
      side: e.side, 
      status: e.status,
      timestamp: e.timestamp
    })));
    
    // Skip update if data hasn't changed
    if (dataHash === lastDataHashRef.current) {
      return;
    }
    
    lastDataHashRef.current = dataHash;
    
    // Filter for recent activity (orders with status 1 = ADDED, 2 = UPDATED)
    const recentActivity = orderbookEntries.filter(entry => 
      entry.status === 1 || entry.status === 2
    );
    
    // Convert to recent trades format with proper decimal formatting
    const parsedTrades: RecentTrade[] = recentActivity.map(entry => {
      // Convert wei values to decimal format
      const priceDecimal = weiToDecimal(entry.price || '0');
      const quantityDecimal = weiToDecimal(entry.quantity || '0');
      
      // Format the decimal values for display
      const priceFormatted = formatDecimal(priceDecimal);
      const quantityFormatted = formatDecimal(quantityDecimal);
      
      return {
        id: entry.order_id?.toString() || '',
        price: priceFormatted,
        quantity: quantityFormatted,
        side: entry.side === 1 ? 'buy' : 'sell', // 1 = BID (buy), 2 = ASK (sell)
        timestamp: createLocalDate(entry.timestamp), // Convert Unix timestamp to user's local timezone
        txHash: entry.maker_base_address // Use maker address as transaction reference
      };
    });

    setTrades(parsedTrades);
    console.log('Recent trades data updated:', parsedTrades);
    
    // Mark as loaded once
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      setInitialLoading(false);
    }
  }, []);

  const fetchRecentTrades = useCallback(async () => {
    if (!marketId) {
      setTrades([]);
      setError(null);
      setInitialLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = orderbookCache.get(marketId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('Using cached orderbook data for recent trades');
        processOrderbookData(cached.data);
        setLoading(false);
        return;
      }

      console.log('Fetching recent trades for market:', marketId);
      
      // Import here to avoid circular dependency
      const { arborterService } = await import('../lib/grpc-client');
      const response = await arborterService.getOrderbookSnapshot(marketId);
      
      if (response.success && response.data) {
        // Cache the data
        orderbookCache.set(marketId, { data: response.data, timestamp: now });
        
        // Process the data
        processOrderbookData(response.data);
      } else {
        throw new Error('Failed to fetch recent trades data');
      }
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent trades');
      
      // Mark as loaded even on error
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [marketId, processOrderbookData]);

  // Debounced effect to prevent rapid re-fetches when marketId changes
  useEffect(() => {
    // Reset loading state when marketId changes
    setInitialLoading(true);
    hasLoadedOnceRef.current = false;
    lastDataHashRef.current = '';
    
    const timeoutId = setTimeout(() => {
      fetchRecentTrades();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [fetchRecentTrades]);

  // Set up polling for real-time updates (less frequent)
  useEffect(() => {
    if (!marketId) return;

    const interval = setInterval(() => {
      fetchRecentTrades();
    }, 25000); // Poll every 25 seconds instead of 10

    return () => clearInterval(interval);
  }, [marketId, fetchRecentTrades]);

  return {
    trades,
    loading,
    initialLoading,
    error,
    refresh: fetchRecentTrades
  };
} 