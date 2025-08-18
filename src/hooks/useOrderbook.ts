import { useSharedOrderbookData } from './useSharedOrderbookData';

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

export function useOrderbook(marketId: string, filterByTrader?: string) {
  const { orderbook, loading, initialLoading, error, refresh, lastUpdate } = useSharedOrderbookData(marketId, filterByTrader);

  // Debug logging
  console.log('useOrderbook hook:', {
    marketId,
    filterByTrader,
    orderbook,
    loading,
    initialLoading,
    error,
    lastUpdate,
    hasData: !!orderbook,
    asksCount: orderbook?.asks?.length || 0,
    bidsCount: orderbook?.bids?.length || 0,
    orderbookType: typeof orderbook,
    orderbookKeys: orderbook ? Object.keys(orderbook) : [],
    orderbookData: orderbook
  });

  return { 
    orderbook, 
    loading, 
    initialLoading,
    error, 
    refetch: refresh 
  };
} 