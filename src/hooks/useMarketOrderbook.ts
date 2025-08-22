import { useState, useEffect, useCallback, useMemo } from "react";
import { useSharedOrderbookData } from "./useSharedOrderbookData";
import { useGlobalOrderbookCache } from "./useGlobalOrderbookCache";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";

interface MarketOrderbookData {
  orderbook: {
    bids: OrderbookEntry[];
    asks: OrderbookEntry[];
    spread: number;
    spreadPercentage: number;
    lastUpdate: Date;
  };
  openOrders: OrderbookEntry[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdate: Date;
}

export function useMarketOrderbook(marketId: string, filterByTrader?: string): MarketOrderbookData {
  const globalCache = useGlobalOrderbookCache();
  
  // Get raw data from the hook
  const rawData = useSharedOrderbookData(marketId, filterByTrader);

  // Check global cache first for instant data display
  const cachedData = globalCache.getCachedData(marketId);
  const hasCachedData = cachedData && !globalCache.isDataStale(marketId);

  // Debug logging to track cache usage
  console.log("🔍 useMarketOrderbook:", {
    marketId,
    hasCachedData,
    cachedDataExists: !!cachedData,
    isDataStale: cachedData ? globalCache.isDataStale(marketId) : "no-cache",
    rawDataLoading: rawData.loading,
    rawDataInitialLoading: rawData.initialLoading,
    rawDataHasOrderbook: !!rawData.orderbook,
    rawDataOrderbookLength: rawData.orderbook?.bids?.length || 0 + rawData.orderbook?.asks?.length || 0,
    timestamp: new Date().toISOString(),
  });

  // Parse and cache the data with proper decimals
  const [parsedData, setParsedData] = useState<MarketOrderbookData>({
    orderbook: {
      bids: [],
      asks: [],
      spread: 0,
      spreadPercentage: 0,
      lastUpdate: new Date(),
    },
    openOrders: [],
    loading: false,
    initialLoading: true,
    error: null,
    refresh: () => {
      // No-op: refresh is handled by the hook
    },
    lastUpdate: new Date(),
  });

  // Parse the raw data - ensure decimal conversion is always applied
  const parseOrderbookData = useCallback(
    (entries: OrderbookEntry[]): OrderbookEntry[] => {
      if (!entries || entries.length === 0) return [];

      // Double-check that all entries have proper decimal formatting
      // This is a safety net in case streaming data bypasses the hook's processing
      return entries.map((entry) => {
        const price = entry.price;
        const quantity = entry.quantity;

        // If we detect wei values (very large numbers), convert them
        if (
          typeof price === "string" &&
          parseFloat(price) > 1000000000000000000
        ) {
          console.warn(
            "⚠️ useMarketOrderbook: Detected wei price, converting to decimal:",
            price,
          );
        }
        if (
          typeof quantity === "string" &&
          parseFloat(quantity) > 1000000000000000000
        ) {
          console.warn(
            "⚠️ useMarketOrderbook: Detected wei quantity, converting to decimal:",
            quantity,
          );
        }

        // Return entry as-is since useSharedOrderbookData should handle conversion
        // This is just a safety check and logging
        return entry;
      });
    },
    [],
  );

  // Memoize the parsed orderbook data to prevent unnecessary recalculations
  const parsedOrderbook = useMemo(() => {
    if (!rawData.orderbook) return null;

    return {
      ...rawData.orderbook,
      bids: parseOrderbookData(rawData.orderbook.bids),
      asks: parseOrderbookData(rawData.orderbook.asks),
    };
  }, [rawData.orderbook, parseOrderbookData]);

  // Memoize the parsed open orders to prevent unnecessary recalculations
  const parsedOpenOrders = useMemo(() => {
    if (!rawData.openOrders) return [];

    return parseOrderbookData(rawData.openOrders);
  }, [rawData.openOrders, parseOrderbookData]);

  // Update parsed data when raw data changes
  useEffect(() => {
    console.log(
      "🔄 useMarketOrderbook: rawData changed, processing:",
      {
        hasOrderbook: !!rawData.orderbook,
        hasOpenOrders: !!rawData.openOrders,
        orderbookBids: rawData.orderbook?.bids?.length || 0,
        orderbookAsks: rawData.orderbook?.asks?.length || 0,
        openOrdersCount: rawData.openOrders?.length || 0,
      }
    );

    if (rawData.orderbook && rawData.openOrders && parsedOrderbook) {
      // Save to global cache for persistence across route changes
      globalCache.setCachedData(marketId, {
        orderbook: parsedOrderbook,
        openOrders: parsedOpenOrders,
        lastUpdate: new Date(),
      });

      setParsedData({
        ...rawData,
        orderbook: parsedOrderbook,
        openOrders: parsedOpenOrders,
        refresh: rawData.refresh,
      });
    }
  }, [
    rawData,
    parsedOrderbook,
    parsedOpenOrders,
    globalCache,
    marketId,
  ]);

  // If we have cached data and no fresh data yet, use cached data
  if (hasCachedData && (!rawData.orderbook || rawData.orderbook.bids.length === 0)) {
    return {
      orderbook: cachedData.orderbook,
      openOrders: cachedData.openOrders,
      loading: rawData.loading,
      initialLoading: false, // Not initial loading if we have cached data
      error: rawData.error,
      refresh: rawData.refresh,
      lastUpdate: cachedData.lastUpdate,
    };
  }

  // Return the parsed data
  return parsedData;
}
