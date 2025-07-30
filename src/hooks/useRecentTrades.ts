import { useState, useEffect, useCallback, useRef } from 'react';
import { Trade } from '../lib/grpc-client';
import { weiToDecimal, formatDecimal } from '../lib/number-utils';

// Utility function to create a Date object from timestamp in user's timezone
const createLocalDate = (timestamp: number): Date => {
  // Check if timestamp is in milliseconds (13+ digits) or seconds (10-12 digits)
  const isMilliseconds = timestamp > 9999999999; // 10 digits = seconds, 13+ digits = milliseconds
  
  let date: Date;
  if (isMilliseconds) {
    // Already in milliseconds
    date = new Date(timestamp);
  } else {
    // Convert from seconds to milliseconds
    date = new Date(timestamp * 1000);
  }
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`Timestamp: ${timestamp}, isMilliseconds: ${isMilliseconds}, UTC time: ${date.toISOString()}, Local time: ${date.toLocaleString()}, User timezone: ${userTimezone}`);
  return date;
};

export interface RecentTrade {
  id: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: Date;
  maker: string;
  taker: string;
  makerBaseAddress: string;
  makerQuoteAddress: string;
  buyer: string;
  seller: string;
}

export interface UseRecentTradesReturn {
  trades: RecentTrade[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecentTrades(marketId: string | undefined, filterByTrader?: string): UseRecentTradesReturn {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastDataHashRef = useRef<string>('');
  const hasLoadedOnceRef = useRef<boolean>(false);

  const processTradesData = useCallback((tradesData: Trade[]) => {
    console.log('Processing trades data:', tradesData);
    
    const dataHash = JSON.stringify(tradesData.map(t => ({ 
      timestamp: t.timestamp, 
      price: t.price, 
      qty: t.qty,
      order_hit: t.order_hit 
    })));
    
    if (dataHash === lastDataHashRef.current) return;
    lastDataHashRef.current = dataHash;

    const parsedTrades: RecentTrade[] = tradesData.map(trade => {
      console.log('Processing trade:', trade);
      console.log('Raw price:', trade.price, 'Raw qty:', trade.qty);
      
      const priceDecimal = weiToDecimal(trade.price || '0');
      const quantityDecimal = weiToDecimal(trade.qty || '0');
      
      console.log('Price decimal:', priceDecimal, 'Quantity decimal:', quantityDecimal);
      
      // Format the decimal values for display
      const priceFormatted = formatDecimal(priceDecimal);
      const quantityFormatted = formatDecimal(quantityDecimal);
      
      console.log('Price formatted:', priceFormatted, 'Quantity formatted:', quantityFormatted);
      
      // Determine side based on buyer/seller addresses
      // For now, we'll use a simple heuristic - if buyer and seller are the same, it's a market order
      const side = trade.buyer === trade.seller ? 'buy' : 'buy'; // Default to buy for now
      
      return {
        id: trade.order_hit?.toString() || '',
        price: priceFormatted,
        quantity: quantityFormatted,
        side: side,
        timestamp: createLocalDate(trade.timestamp), // Convert timestamp to user's local timezone
        maker: trade.maker || '',
        taker: trade.taker || '',
        makerBaseAddress: trade.maker_base_address || '',
        makerQuoteAddress: trade.maker_quote_address || '',
        buyer: trade.buyer || '',
        seller: trade.seller || ''
      };
    });

    setTrades(parsedTrades);
    console.log('Recent trades data updated:', parsedTrades);
    console.log('Sample trade details:', parsedTrades[0] ? {
      id: parsedTrades[0].id,
      price: parsedTrades[0].price,
      quantity: parsedTrades[0].quantity,
      side: parsedTrades[0].side,
      timestamp: parsedTrades[0].timestamp,
      rawPrice: tradesData[0]?.price,
      rawQty: tradesData[0]?.qty
    } : 'No trades');
    
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
      console.log('Fetching recent trades for market:', marketId);
      
      // Import here to avoid circular dependency
      const { arborterService } = await import('../lib/grpc-client');
      const response = await arborterService.getTradesSnapshot(marketId, filterByTrader);
      
      if (response.success && response.data) {
        processTradesData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch recent trades data');
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
  }, [marketId, filterByTrader, processTradesData]);

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

  return { trades, loading, initialLoading, error, refresh: fetchRecentTrades };
} 