import { useState, useEffect, useCallback } from 'react';
import { arborterService, OrderbookEntry, OrderbookResponse } from '../lib/grpc-client';

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
  const [error, setError] = useState<string | null>(null);

  const fetchOrderbook = useCallback(async () => {
    if (!marketId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching orderbook for market:', marketId);
      
      const response: OrderbookResponse = await arborterService.getOrderbookSnapshot(marketId);
      
      console.log('Raw orderbook response:', response);
      
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
      
      console.log('Orderbook entries:', entries);
      
      // Separate bids and asks based on the side field
      const bids: OrderbookOrder[] = [];
      const asks: OrderbookOrder[] = [];
      
      entries.forEach((entry: OrderbookEntry) => {
        // Skip entries with status 3 (REMOVED) as they're no longer in the orderbook
        if (entry.status === 3) {
          return;
        }
        
        const order: OrderbookOrder = {
          price: entry.price || '0',
          quantity: entry.quantity || '0',
          total: '0', // We'll calculate this below
          orderId: entry.order_id?.toString() || '',
          side: entry.side === 1 ? 'bid' : 'ask' // 1 = BID, 2 = ASK
        };
        
        // Calculate total (price * quantity)
        const price = parseFloat(order.price);
        const quantity = parseFloat(order.quantity);
        if (!isNaN(price) && !isNaN(quantity)) {
          order.total = (price * quantity).toString();
        }
        
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
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchOrderbook();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchOrderbook, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [fetchOrderbook]);

  return { orderbook, loading, error, refetch: fetchOrderbook };
} 