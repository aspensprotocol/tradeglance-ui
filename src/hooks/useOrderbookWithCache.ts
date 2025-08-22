import { useCallback, useMemo } from "react";
import { useDataFetching } from "./useDataFetching";
import { arborterService } from "../lib/grpc-client";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";
import { Side } from "../protos/gen/arborter_pb";

// Use protobuf types directly for orderbook data
export interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spread: number;
  spreadPercentage: number;
  lastUpdate: Date;
}

// Use protobuf types directly for shared data
export interface SharedOrderbookData {
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  lastUpdate: Date;
}

export function useOrderbookWithCache(
  marketId: string,
  filterByTrader?: string,
  pollingInterval = 500, // 500ms default for real-time updates
  cacheTimeout = 5000, // 5 seconds cache timeout for orderbook data
): {
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdate: Date;
  setFilterByTrader: (trader: string | undefined) => void;
  isFromCache: boolean;
} {
  // Create the fetch function for orderbook data
  const fetchOrderbookData = useCallback(
    async (marketIdParam: string, filterByTraderParam?: string): Promise<OrderbookEntry[]> => {
      if (!marketIdParam || marketIdParam.trim() === "") {
        throw new Error("Invalid market ID");
      }

      console.log("🔍 useOrderbookWithCache: Fetching orderbook data for:", marketIdParam);
      
      // Fetch orderbook data - the API returns OrderbookEntry[] directly
      const orderbookEntries = await arborterService.getOrderbook(
        marketIdParam,
        true, // continueStream
        true, // historicalOpenOrders
        filterByTraderParam,
      );

      if (!orderbookEntries || orderbookEntries.length === 0) {
        return [];
      }

      console.log("🔍 useOrderbookWithCache: Received orderbook entries:", {
        totalEntries: orderbookEntries.length,
        marketId,
        filterByTrader,
      });

      return orderbookEntries;
    },
    [marketId, filterByTrader]
  );

  // Use the enhanced useDataFetching hook with caching
  const {
    data: orderbookEntries,
    loading,
    initialLoading,
    error,
    refetch,
    lastFetchTime,
    isFromCache,
  } = useDataFetching({
    marketId,
    filterByTrader,
    fetchFunction: fetchOrderbookData,
    pollingInterval,
    cacheKey: `orderbook-${marketId}-${filterByTrader || 'all'}`,
    cacheTimeout,
  });

  // Process the orderbook data
  const processedData = useMemo((): SharedOrderbookData => {
    if (!orderbookEntries || orderbookEntries.length === 0) {
      return {
        orderbook: {
          bids: [],
          asks: [],
          spread: 0,
          spreadPercentage: 0,
          lastUpdate: new Date(lastFetchTime),
        },
        openOrders: [],
        lastUpdate: new Date(lastFetchTime),
      };
    }

    // Separate bids and asks
    const bids = orderbookEntries.filter((entry) => entry.side === Side.BID);
    const asks = orderbookEntries.filter((entry) => entry.side === Side.ASK);

    // Sort bids (highest first) and asks (lowest first)
    const sortedBids = [...bids].sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return priceB - priceA; // Descending for bids
    });

    const sortedAsks = [...asks].sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return priceA - priceB; // Ascending for asks
    });

    // Calculate spread
    const bestBid = sortedBids[0];
    const bestAsk = sortedAsks[0];
    let spread = 0;
    let spreadPercentage = 0;

    if (bestBid && bestAsk) {
      const bidPrice = parseFloat(bestBid.price);
      const askPrice = parseFloat(bestAsk.price);
      spread = askPrice - bidPrice;
      spreadPercentage = (spread / bidPrice) * 100;
    }

    return {
      orderbook: {
        bids: sortedBids,
        asks: sortedAsks,
        spread,
        spreadPercentage,
        lastUpdate: new Date(lastFetchTime),
      },
      openOrders: orderbookEntries, // All entries are open orders
      lastUpdate: new Date(lastFetchTime),
    };
  }, [orderbookEntries, lastFetchTime]);

  // Function to update the filter by trader
  const setFilterByTrader = useCallback(() => {
    // This would need to be implemented to actually update the filter
    // For now, we'll just log the change
    console.log("setFilterByTrader called - not yet implemented");
  }, []);

  return {
    orderbook: processedData.orderbook,
    openOrders: processedData.openOrders,
    loading,
    initialLoading,
    error,
    refresh: refetch,
    lastUpdate: processedData.lastUpdate,
    setFilterByTrader,
    isFromCache,
  };
}
