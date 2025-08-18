import { useState, useEffect, useCallback, useRef } from 'react';
import { arborterService } from '../lib/grpc-client';
import { OrderbookEntry } from '../protos/gen/arborter_pb';
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

export interface OpenOrder {
  id: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: Date;
  makerAddress: string;
}

export interface SharedOrderbookData {
  orderbook: OrderbookData;
  openOrders: OpenOrder[];
  lastUpdate: Date;
}

export function useSharedOrderbookData(marketId: string, filterByTrader?: string) {
  const [data, setData] = useState<SharedOrderbookData>({
    orderbook: {
      bids: [],
      asks: [],
      spread: 0,
      spreadPercentage: 0,
      lastUpdate: new Date()
    },
    openOrders: [],
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Process orderbook data into the expected format
  const processOrderbookData = useCallback((entries: OrderbookEntry[]): OrderbookData => {
    const bids: OrderbookOrder[] = [];
    const asks: OrderbookOrder[] = [];

    if (!entries || entries.length === 0) {
      return {
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        lastUpdate: new Date()
      };
    }

    console.log('Processing orderbook data:', entries.length, 'entries');
    
    // Less aggressive deduplication - only remove exact duplicates
    const uniqueEntries = entries.filter((entry, index, self) => {
      const isDuplicate = self.findIndex(e => 
        e.orderId?.toString() === entry.orderId?.toString() && 
        e.side === entry.side &&
        e.price === entry.price &&
        e.quantity === entry.quantity
      ) !== index;
      
      if (isDuplicate) {
        console.log('Removing duplicate entry:', {
          orderId: entry.orderId,
          side: entry.side,
          price: entry.price,
          quantity: entry.quantity
        });
      }
      
      return !isDuplicate;
    });
    
    if (uniqueEntries.length !== entries.length) {
      console.log('Orderbook deduplication:', {
        original: entries.length,
        unique: uniqueEntries.length,
        duplicates: entries.length - uniqueEntries.length
      });
    }
    
    uniqueEntries.forEach((entry, index) => {
      if (entry.side === undefined || entry.side === null) {
        console.warn('Entry missing side:', entry);
        return;
      }

      // Less strict validation - only check for absolutely required fields
      if (!entry.price || !entry.quantity) {
        console.warn('Entry missing absolutely required fields:', {
          orderId: entry.orderId,
          hasPrice: !!entry.price,
          hasQuantity: !!entry.quantity,
          side: entry.side
        });
        return;
      }

      const priceDecimal = weiToDecimal(entry.price || '0');
      const quantityDecimal = weiToDecimal(entry.quantity || '0');

      const priceNum = parseFloat(priceDecimal);
      const quantityNum = parseFloat(quantityDecimal);
      const totalDecimal = (!isNaN(priceNum) && !isNaN(quantityNum)) ? (priceNum * quantityNum).toString() : '0';

      const priceFormatted = formatDecimal(priceDecimal);
      const quantityFormatted = formatDecimal(quantityDecimal);
      const totalFormatted = formatDecimal(totalDecimal, 6);

      let side: 'bid' | 'ask';
      if (entry.side === 1) {
        side = 'bid';
      } else if (entry.side === 2) {
        side = 'ask';
      } else {
        console.warn('Unknown side value:', entry.side, 'for entry:', entry);
        side = 'bid'; // fallback
      }

      const order: OrderbookOrder = {
        price: priceFormatted,
        quantity: quantityFormatted,
        total: totalFormatted,
        orderId: entry.orderId?.toString() || `order-${index}`,
        side: side
      };

      if (order.side === 'bid') {
        bids.push(order);
      } else {
        asks.push(order);
      }
    });

    // Sort bids (highest first) and asks (lowest first)
    bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    const lowestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
    const highestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
    const spread = lowestAsk - highestBid;
    const spreadPercentage = lowestAsk > 0 ? (spread / lowestAsk) * 100 : 0;

    console.log('Orderbook processed:', {
      totalEntries: entries.length,
      uniqueEntries: uniqueEntries.length,
      bids: bids.length,
      asks: asks.length,
      spread,
      spreadPercentage
    });

    return {
      bids,
      asks,
      spread,
      spreadPercentage,
      lastUpdate: new Date()
    };
  }, []);

  // Process orderbook data into open orders format
  const processOpenOrdersData = useCallback((orderbookEntries: OrderbookEntry[]): OpenOrder[] => {
    console.log('Processing open orders from', orderbookEntries.length, 'orderbook entries');
    
    const openOrders = orderbookEntries
      .filter(entry => {
        // Only include entries that are actual open orders
        // ORDER_STATUS_ADDED = 1 (open order)
        // ORDER_STATUS_FILLED = 2 (filled order - closed)
        // ORDER_STATUS_CANCELLED = 3 (cancelled order - closed)
        const isOpen = entry.status === 1;
        
        // Less strict validation - only check for absolutely required fields
        const hasRequiredFields = entry.price && entry.quantity && entry.side !== undefined;
        
        if (!isOpen) {
          console.log('Filtering out non-open order:', {
            orderId: entry.orderId,
            status: entry.status,
            side: entry.side
          });
        }
        
        if (!hasRequiredFields) {
          console.log('Filtering out incomplete entry:', {
            orderId: entry.orderId,
            hasPrice: !!entry.price,
            hasQuantity: !!entry.quantity,
            hasSide: entry.side !== undefined
          });
        }
        
        return isOpen && hasRequiredFields;
      })
      .map(entry => ({
        id: entry.orderId?.toString() || `open-order-${Date.now()}`,
        side: (entry.side === 1 ? 'buy' : 'sell') as 'buy' | 'sell',
        price: formatDecimal(weiToDecimal(entry.price || '0')),
        quantity: formatDecimal(weiToDecimal(entry.quantity || '0')),
        timestamp: entry.timestamp ? new Date(Number(entry.timestamp)) : new Date(),
        makerAddress: entry.makerBaseAddress || ''
      }));
    
    console.log('Open orders processed:', openOrders.length, 'orders');
    return openOrders;
  }, []);

  // Fetch orderbook data and process it for both uses
  const fetchData = useCallback(async () => {
    console.log('useSharedOrderbookData: fetchData called with:', {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      marketIdTrimmed: marketId?.trim(),
      loading,
      retryCount,
      maxRetries
    });
    
    if (!marketId || marketId.trim() === '') {
      console.log('useSharedOrderbookData: Skipping fetch - no marketId or empty marketId:', marketId);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (loading) {
      console.log('useSharedOrderbookData: Skipping fetch - already loading');
      return;
    }

    // Check if we need to fetch (avoid fetching too frequently)
    const now = Date.now();
    if (now - lastFetchTime.current < 5000) { // 5 second minimum between fetches
      console.log('useSharedOrderbookData: Skipping fetch - too soon since last fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching shared orderbook data for market:', marketId);
      
      const response = await arborterService.getOrderbookSnapshot(marketId, true, filterByTrader);
      
      console.log('useSharedOrderbookData: Response received:', {
        response,
        responseType: typeof response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'N/A',
        firstEntry: Array.isArray(response) && response.length > 0 ? response[0] : null
      });
      
      if (response && Array.isArray(response)) {
        console.log('Orderbook response received:', {
          length: response.length,
          firstEntry: response[0],
          lastEntry: response[response.length - 1],
          sampleEntries: response.slice(0, 3)
        });
        
        console.log('useSharedOrderbookData: Processing orderbook data...');
        const orderbook = processOrderbookData(response);
        console.log('useSharedOrderbookData: Orderbook processed:', {
          bids: orderbook.bids.length,
          asks: orderbook.asks.length,
          spread: orderbook.spread,
          spreadPercentage: orderbook.spreadPercentage
        });
        
        console.log('useSharedOrderbookData: Processing open orders data...');
        const openOrders = processOpenOrdersData(response);
        console.log('useSharedOrderbookData: Open orders processed:', openOrders.length);
        
        // Deduplicate open orders by ID to prevent duplicates
        const uniqueOpenOrders = openOrders.filter((order, index, self) => {
          const firstIndex = self.findIndex(o => o.id === order.id);
          const isDuplicate = firstIndex !== index;
          if (isDuplicate) {
            console.log('Removing duplicate open order:', {
              id: order.id,
              firstIndex,
              currentIndex: index
            });
          }
          return !isDuplicate;
        });
        
        if (uniqueOpenOrders.length !== openOrders.length) {
          console.log('Open orders deduplication:', {
            original: openOrders.length,
            unique: uniqueOpenOrders.length,
            duplicates: openOrders.length - uniqueOpenOrders.length
          });
        }
        
        console.log('useSharedOrderbookData: Setting data...');
        setData({
          orderbook,
          openOrders: uniqueOpenOrders,
          lastUpdate: new Date()
        });
        
        lastFetchTime.current = now;
        console.log('Shared orderbook data updated:', {
          orderbookEntries: response.length,
          openOrders: uniqueOpenOrders.length,
          bids: orderbook.bids.length,
          asks: orderbook.asks.length
        });
        
        // Log the actual data being set
        console.log('useSharedOrderbookData: Data set successfully:', {
          orderbook: {
            bids: orderbook.bids.length,
            asks: orderbook.asks.length,
            spread: orderbook.spread,
            spreadPercentage: orderbook.spreadPercentage
          },
          openOrders: uniqueOpenOrders.length,
          lastUpdate: new Date()
        });
        
        // Set initialLoading to false after first successful fetch
        setInitialLoading(false);
      } else {
        console.warn('No orderbook data in response:', response);
        setError('No orderbook data received');
      }
    } catch (error) {
      console.error('useSharedOrderbookData: Error fetching orderbook data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orderbook data';
      setError(errorMessage);
      
      // Increment retry count
      setRetryCount(prev => {
        const newCount = prev + 1;
        console.log('useSharedOrderbookData: Retry count incremented to:', newCount);
        return newCount;
      });
    } finally {
      console.log('useSharedOrderbookData: Fetch completed, setting loading to false');
      setLoading(false);
      // Don't set initialLoading to false here - only set it after successful data fetch
    }
  }, [marketId, filterByTrader, processOrderbookData, processOpenOrdersData, loading]);

  // Initial data fetch
  useEffect(() => {
    console.log('useSharedOrderbookData: Initial fetch effect triggered:', {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      filterByTrader
    });
    
    if (marketId && marketId.trim() !== '') {
      console.log('useSharedOrderbookData: Triggering initial fetch for marketId:', marketId);
      fetchData();
    } else {
      console.log('useSharedOrderbookData: Skipping initial fetch - no valid marketId');
    }
  }, [marketId, filterByTrader, fetchData]);

  // Clear data when marketId changes to prevent stale data
  useEffect(() => {
    console.log('useSharedOrderbookData: Market ID change effect triggered:', {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      previousData: {
        orderbookBids: data.orderbook.bids.length,
        orderbookAsks: data.orderbook.asks.length,
        openOrders: data.openOrders.length
      }
    });
    
    console.log('Market ID changed in shared orderbook data, clearing previous data');
    setData({
      orderbook: {
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        lastUpdate: new Date()
      },
      openOrders: [],
      lastUpdate: new Date()
    });
    setError(null);
    setInitialLoading(true); // Reset to loading state for new market
    lastFetchTime.current = 0;
    setRetryCount(0); // Reset retry count for new market
  }, [marketId]);

  // Set up polling
  useEffect(() => {
    console.log('useSharedOrderbookData: Polling effect triggered:', {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      retryCount,
      maxRetries
    });
    
    if (!marketId || marketId.trim() === '') {
      console.log('useSharedOrderbookData: Skipping polling - no marketId or empty marketId:', marketId);
      return;
    }
    
    // Don't poll if we've exceeded the retry limit
    if (retryCount >= maxRetries) {
      console.warn('Max retries exceeded in shared orderbook data, stopping polling');
      return;
    }

    console.log('useSharedOrderbookData: Setting up polling for marketId:', marketId);
    pollingInterval.current = setInterval(() => {
      console.log('useSharedOrderbookData: Polling interval triggered for marketId:', marketId);
      fetchData();
    }, 10000); // Poll every 10 seconds

    return () => {
      if (pollingInterval.current) {
        console.log('useSharedOrderbookData: Cleaning up polling interval for marketId:', marketId);
        clearInterval(pollingInterval.current);
      }
    };
  }, [marketId, fetchData, retryCount, maxRetries]);

  // Debug logging for data changes
  useEffect(() => {
    console.log('useSharedOrderbookData: Data state changed:', {
      hasOrderbook: !!data.orderbook,
      orderbookBids: data.orderbook?.bids?.length || 0,
      orderbookAsks: data.orderbook?.asks?.length || 0,
      openOrders: data.openOrders?.length || 0,
      lastUpdate: data.lastUpdate,
      loading,
      error
    });
  }, [data, loading, error]);

  const refresh = useCallback(() => {
    console.log('useSharedOrderbookData: Manual refresh triggered for marketId:', marketId);
    setRetryCount(0); // Reset retry count on manual refresh
    fetchData();
  }, [marketId, fetchData]);

  return {
    orderbook: data.orderbook,
    openOrders: data.openOrders,
    loading,
    initialLoading,
    error,
    refresh,
    lastUpdate: data.lastUpdate
  };
}
