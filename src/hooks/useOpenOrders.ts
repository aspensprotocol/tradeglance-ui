import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderbookEntry } from '../lib/grpc-client';
import { weiToDecimal, formatDecimal } from '../lib/number-utils';

export interface OpenOrder {
  id: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: Date;
  makerAddress: string;
}

export interface UseOpenOrdersReturn {
  orders: OpenOrder[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOpenOrders(marketId: string | undefined, filterByTrader?: string): UseOpenOrdersReturn {
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastDataHashRef = useRef<string>('');
  const hasLoadedOnceRef = useRef<boolean>(false);

  const processOrderbookData = useCallback((orderbookEntries: OrderbookEntry[]) => {
    const dataHash = JSON.stringify(orderbookEntries.map(e => ({ 
      order_id: e.order_id, 
      price: e.price, 
      quantity: e.quantity, 
      side: e.side, 
      status: e.status,
      timestamp: e.timestamp
    })));
    
    if (dataHash === lastDataHashRef.current) return;
    lastDataHashRef.current = dataHash;

    // Filter for active orders (status 1 = ADDED, 2 = UPDATED)
    const activeOrders = orderbookEntries.filter(entry => 
      entry.status === 1 || entry.status === 2
    );
    
    // Convert to open orders format with proper decimal formatting
    const parsedOrders: OpenOrder[] = activeOrders.map(entry => {
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
        timestamp: new Date(entry.timestamp * 1000), // Convert from seconds to milliseconds
        makerAddress: entry.maker_base_address
      };
    });

    setOrders(parsedOrders);
    console.log('Open orders data updated:', parsedOrders);
    
    // Mark as loaded once
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      setInitialLoading(false);
    }
  }, []);

  const fetchOpenOrders = useCallback(async () => {
    if (!marketId) {
      setOrders([]);
      setError(null);
      setInitialLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching open orders for market:', marketId);
      
      // Import here to avoid circular dependency
      const { arborterService } = await import('../lib/grpc-client');
      const response = await arborterService.getOrderbookSnapshot(marketId, filterByTrader);
      
      if (response.success && response.data) {
        processOrderbookData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch open orders data');
      }
    } catch (err) {
      console.error('Error fetching open orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch open orders');
      
      // Mark as loaded even on error
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [marketId, filterByTrader, processOrderbookData]);

  // Debounced effect to prevent rapid re-fetches when marketId changes
  useEffect(() => {
    // Reset loading state when marketId changes
    setInitialLoading(true);
    hasLoadedOnceRef.current = false;
    lastDataHashRef.current = '';
    
    const timeoutId = setTimeout(() => {
      fetchOpenOrders();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [fetchOpenOrders]);

  // Set up polling for real-time updates (less frequent)
  useEffect(() => {
    if (!marketId) return;

    const interval = setInterval(() => {
      fetchOpenOrders();
    }, 20000); // Poll every 20 seconds

    return () => clearInterval(interval);
  }, [marketId, fetchOpenOrders]);

  return { orders, loading, initialLoading, error, refresh: fetchOpenOrders };
} 