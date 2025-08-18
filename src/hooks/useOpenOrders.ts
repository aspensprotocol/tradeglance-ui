import { useSharedOrderbookData } from './useSharedOrderbookData';

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

export function useOpenOrders(marketId: string, filterByTrader?: string) {
  // Only fetch data when marketId is provided
  const { openOrders, loading, initialLoading, error, refresh } = useSharedOrderbookData(
    marketId || '', // Ensure marketId is always a string
    filterByTrader
  );

  return { 
    orders: openOrders, 
    loading, 
    initialLoading,
    error, 
    refresh 
  };
} 