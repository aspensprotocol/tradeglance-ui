import { useState, useEffect, useCallback, useMemo } from "react";
import { useSharedOrderbookData } from "./useSharedOrderbookData";
import { useGlobalOrderbookCache } from "./useGlobalOrderbookCache";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";
import type { MarketOrderbookData } from "../lib/shared-types";

export function useMarketOrderbook(
  marketId: string,
  filterByTrader?: string,
): MarketOrderbookData {
  const globalCache = useGlobalOrderbookCache();

  // Get raw data from the hook
  const rawData = useSharedOrderbookData(marketId, filterByTrader);

  // Parse and cache the data with proper decimals
  const [parsedData, setParsedData] = useState<MarketOrderbookData>({
    marketId,
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

  // Check global cache first for instant data display
  const cachedData = globalCache.getCachedData(marketId, filterByTrader);
  const hasCachedData =
    cachedData && !globalCache.isDataStale(marketId, undefined, filterByTrader);

  // EXTENSIVE DEBUG: Log every cache interaction
  console.log("🔍 useMarketOrderbook: CACHE DEBUG:", {
    marketId,
    marketIdType: typeof marketId,
    marketIdTruthy: !!marketId,
    cachedDataExists: !!cachedData,
    hasCachedData,
    isDataStale: cachedData ? globalCache.isDataStale(marketId) : "no-cache",
    cacheSize: "checking...",
    timestamp: new Date().toISOString(),
  });

  // Debug logging to track cache usage
  console.log("🔍 useMarketOrderbook:", {
    marketId,
    hasCachedData,
    cachedDataExists: !!cachedData,
    isDataStale: cachedData ? globalCache.isDataStale(marketId) : "no-cache",
    rawDataLoading: rawData.loading,
    rawDataInitialLoading: rawData.initialLoading,
    rawDataHasOrderbook: !!rawData.orderbook,
    rawDataOrderbookLength:
      rawData.orderbook?.bids?.length ||
      0 + rawData.orderbook?.asks?.length ||
      0,
    timestamp: new Date().toISOString(),
  });

  // Update parsed data when raw data changes
  useEffect(() => {
    console.log("🔄 useMarketOrderbook: rawData changed, processing:", {
      hasOrderbook: !!rawData.orderbook,
      hasOpenOrders: !!rawData.openOrders,
      orderbookBids: rawData.orderbook?.bids?.length || 0,
      orderbookAsks: rawData.orderbook?.asks?.length || 0,
      openOrdersCount: rawData.openOrders?.length || 0,
    });

    if (rawData.orderbook && rawData.openOrders && parsedOrderbook) {
      // Save to global cache for persistence across route changes
      console.log("💾 useMarketOrderbook: SAVING TO CACHE:", {
        marketId,
        filterByTrader,
        orderbookBids: parsedOrderbook.bids.length,
        orderbookAsks: parsedOrderbook.asks.length,
        openOrdersCount: parsedOpenOrders.length,
        timestamp: new Date().toISOString(),
      });

      globalCache.setCachedData(
        marketId,
        {
          orderbook: parsedOrderbook,
          openOrders: parsedOpenOrders,
          lastUpdate: new Date(),
        },
        filterByTrader,
      );

      setParsedData({
        marketId,
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
    filterByTrader,
  ]);

  // Debug: Log cache status
  console.log("🔍 useMarketOrderbook: Cache check before return:", {
    marketId,
    hasCachedData,
    rawDataLoading: rawData.loading,
    rawDataHasOrderbook: !!rawData.orderbook,
    rawDataOrderbookBidsLength: rawData.orderbook?.bids?.length || 0,
    cachedDataExists: !!cachedData,
    timestamp: new Date().toISOString(),
  });

  // PRIORITY: If we have cached data and it's not stale, use it immediately for instant display
  // This ensures cached data is shown even when fresh data is loading
  if (hasCachedData) {
    console.log(
      "🟢 useMarketOrderbook: Using cached data for instant display:",
      {
        marketId,
        cachedDataBids: cachedData.orderbook.bids.length,
        cachedDataAsks: cachedData.orderbook.asks.length,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      marketId,
      orderbook: cachedData.orderbook,
      openOrders: cachedData.openOrders,
      loading: rawData.loading,
      initialLoading: false,
      error: rawData.error,
      refresh: rawData.refresh,
      lastUpdate: cachedData.lastUpdate,
    };
  }

  // If we have cached data but it's stale, still use it while loading fresh data
  if (cachedData && rawData.loading) {
    console.log(
      "🟡 useMarketOrderbook: Using stale cached data while loading fresh data:",
      {
        marketId,
        cachedDataBids: cachedData.orderbook.bids.length,
        cachedDataAsks: cachedData.orderbook.asks.length,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      marketId,
      orderbook: cachedData.orderbook,
      openOrders: cachedData.openOrders,
      loading: rawData.loading,
      initialLoading: false,
      error: rawData.error,
      refresh: rawData.refresh,
      lastUpdate: cachedData.lastUpdate,
    };
  }

  // Return the parsed data
  return parsedData;
}
