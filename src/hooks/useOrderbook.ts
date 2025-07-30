import { useState, useEffect, useCallback, useRef } from 'react';
import { arborterService } from '../lib/grpc-client';
import { OrderbookEntry, OrderbookResponse } from '../lib/grpc-client';
import { isActiveOrderbookEntry, getOrderbookSideString } from '../lib/grpc-client';
import { weiToDecimal, formatDecimal } from '../lib/number-utils';

export interface OrderbookOrder {
  price: string;
  quantity: string;
  total: string;
  orderId: string;
  side: 'bid' | 'ask';
}

export interface OrderbookData {
  bids: OrderbookOrder[];
  asks: OrderbookOrder[];
  spread: number;
  spreadPercentage: number;
  lastUpdate: Date;
}

export function useOrderbook(marketId: string) {
  const [orderbook, setOrderbook] = useState<OrderbookData>({
    bids: [],
    asks: [],
    spread: 0,
    spreadPercentage: 0,
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for data hash to prevent unnecessary updates
  const lastDataHashRef = useRef<string>('');
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const hasLoadedOnceRef = useRef<boolean>(false);

  const fetchOrderbook = useCallback(async (force: boolean = false) => {
    if (!marketId) {
      setOrderbook({
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        lastUpdate: new Date()
      });
      setError(null);
      setInitialLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) {
      return;
    }

    // Rate limiting - don't fetch more than once every 2 seconds
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 2000) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    lastFetchTimeRef.current = now;

    try {
      console.log('Fetching orderbook for market:', marketId);
      
      const response: OrderbookResponse = await arborterService.getOrderbookSnapshot(marketId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch orderbook');
      }
      
      // Handle different response formats
      let entries: OrderbookEntry[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        entries = response.data;
      } else if (Array.isArray(response)) {
        entries = response;
      } else if (response && response.data) {
        entries = Array.isArray(response.data) ? response.data : [response.data];
      }
      
      // Create a hash of the data to check if it's changed
      const dataHash = JSON.stringify(entries.map(e => ({ 
        order_id: e.order_id, 
        price: e.price, 
        quantity: e.quantity, 
        side: e.side, 
        status: e.status 
      })));
      
      // Skip update if data hasn't changed
      if (dataHash === lastDataHashRef.current && !force) {
        console.log('Orderbook data unchanged, skipping update');
        setLoading(false);
        return;
      }
      
      lastDataHashRef.current = dataHash;
      
      // Separate bids and asks based on the side field
      const bids: OrderbookOrder[] = [];
      const asks: OrderbookOrder[] = [];
      
      entries.forEach((entry: OrderbookEntry) => {
        // Skip entries with status 3 (REMOVED) as they're no longer in the orderbook
        if (!isActiveOrderbookEntry(entry)) {
          return;
        }
        
        // Convert wei values to decimal format
        const priceDecimal = weiToDecimal(entry.price || '0');
        const quantityDecimal = weiToDecimal(entry.quantity || '0');
        
        // Format the decimal values for display
        const priceFormatted = formatDecimal(priceDecimal);
        const quantityFormatted = formatDecimal(quantityDecimal);
        
        // Calculate total in decimal format
        const priceNum = parseFloat(priceFormatted);
        const quantityNum = parseFloat(quantityFormatted);
        const totalDecimal = (!isNaN(priceNum) && !isNaN(quantityNum)) ? (priceNum * quantityNum).toString() : '0';
        const totalFormatted = formatDecimal(totalDecimal);
        
        const order: OrderbookOrder = {
          price: priceFormatted,
          quantity: quantityFormatted,
          total: totalFormatted,
          orderId: entry.order_id?.toString() || '',
          side: getOrderbookSideString(entry.side)
        };
        
        if (order.side === 'bid') {
          bids.push(order);
        } else {
          asks.push(order);
        }
      });
      
      // Sort bids in descending order (highest first)
      bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      
      // Sort asks in ascending order (lowest first)
      asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      
      // Calculate spread
      const lowestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
      const highestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
      const spread = lowestAsk - highestBid;
      const spreadPercentage = lowestAsk > 0 ? (spread / lowestAsk) * 100 : 0;
      
      const orderbookData: OrderbookData = {
        bids,
        asks,
        spread,
        spreadPercentage,
        lastUpdate: new Date()
      };
      
      setOrderbook(orderbookData);
      console.log('Orderbook data updated:', orderbookData);
      
      // Mark as loaded once
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
    } catch (err) {
      console.error('Error fetching orderbook:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orderbook');
      
      // Set empty orderbook on error
      setOrderbook({
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        lastUpdate: new Date()
      });
      
      // Mark as loaded even on error
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [marketId]);

  // Debounced effect to prevent rapid re-fetches when marketId changes
  useEffect(() => {
    // Reset loading state when marketId changes
    setInitialLoading(true);
    hasLoadedOnceRef.current = false;
    lastDataHashRef.current = '';
    
    const timeoutId = setTimeout(() => {
      fetchOrderbook(true); // Force fetch on marketId change
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [marketId]);

  // Set up polling for real-time updates (less frequent)
  useEffect(() => {
    if (!marketId) return;
    
    const interval = setInterval(() => {
      fetchOrderbook(); // Regular polling
    }, 20000); // Poll every 20 seconds instead of 5
    
    return () => clearInterval(interval);
  }, [fetchOrderbook]);

  return { orderbook, loading, initialLoading, error, refetch: () => fetchOrderbook(true) };
} 