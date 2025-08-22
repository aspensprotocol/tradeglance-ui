import { useSharedOrderbookData } from "./useSharedOrderbookData";
import type { MarketOrderbookData } from "../lib/shared-types";

export function useMarketOrderbook(
  marketId: string,
  filterByTrader?: string,
): MarketOrderbookData {
  // Get data directly from the shared hook - it already handles all processing
  const rawData = useSharedOrderbookData(marketId, filterByTrader);

  // Return the data directly since useSharedOrderbookData already handles:
  // - Decimal conversion
  // - Data validation
  // - Caching
  // - Error handling
  return {
    marketId,
    orderbook: rawData.orderbook,
    openOrders: rawData.openOrders,
    loading: rawData.loading,
    initialLoading: rawData.initialLoading,
    error: rawData.error,
    refresh: rawData.refresh,
    lastUpdate: rawData.lastUpdate,
  };
}
