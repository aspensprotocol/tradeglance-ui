import { useState, useEffect, useCallback, useRef } from "react";
import { arborterService } from "../lib/grpc-client";
import { Side, OrderState } from "../protos/gen/arborter_pb";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";
import { useTradingPairs } from "./useTradingPairs";
import { formatDecimalConsistent } from "../lib/number-utils";
import type { OrderbookData, SharedOrderbookData } from "../lib/shared-types";
import { useGlobalOrderbookCache } from "./useGlobalOrderbookCache";

export function useSharedOrderbookData(
  marketId: string,
  filterByTrader?: string,
): {
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdate: Date;
  setFilterByTrader: (trader: string | undefined) => void;
} {
  // Get global cache to check for existing data
  const globalCache = useGlobalOrderbookCache();

  // Get trading pairs to extract token decimals
  const { tradingPairs } = useTradingPairs();

  // Find current trading pair
  const currentTradingPair = tradingPairs.find((pair) => pair.id === marketId);

  const [data, setData] = useState<SharedOrderbookData>({
    orderbook: {
      bids: [],
      asks: [],
      spread: 0,
      spreadPercentage: 0,
      lastUpdate: new Date(),
    },
    openOrders: [],
    lastUpdate: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;
  const hasInitializedRef = useRef<boolean>(false);
  const lastMarketIdRef = useRef<string>("");
  const lastFilterRef = useRef<string | undefined>(undefined);
  const circuitBreakerRef = useRef<{
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }>({
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  });

  // Check if we have cached data first
  const cachedData = globalCache.getCachedData(marketId, filterByTrader);
  const hasCachedData =
    cachedData && !globalCache.isDataStale(marketId, undefined, filterByTrader);

  // Check if this is a real market change or just a re-render
  const isRealMarketChange =
    lastMarketIdRef.current !== marketId ||
    lastFilterRef.current !== filterByTrader;

  // Update refs
  useEffect(() => {
    lastMarketIdRef.current = marketId;
    lastFilterRef.current = filterByTrader;
  }, [marketId, filterByTrader]);

  // Initialize with cached data if available
  useEffect(() => {
    if (hasCachedData && !hasInitializedRef.current) {
      setData({
        orderbook: cachedData.orderbook,
        openOrders: cachedData.openOrders,
        lastUpdate: cachedData.lastUpdate,
      });
      setInitialLoading(false);
      hasInitializedRef.current = true;
    }
  }, [hasCachedData, cachedData, marketId, filterByTrader]);

  // Data processing functions
  const processOrderbookData = useCallback(
    (entries: OrderbookEntry[]): OrderbookData => {
      if (!entries || entries.length === 0) {
        return {
          bids: [],
          asks: [],
          spread: 0,
          spreadPercentage: 0,
          lastUpdate: new Date(),
        };
      }

      if (!currentTradingPair) {
        return {
          bids: entries.filter((entry) => entry.side === Side.BID),
          asks: entries.filter((entry) => entry.side === Side.ASK),
          spread: 0,
          spreadPercentage: 0,
          lastUpdate: new Date(),
        };
      }

      const bids: OrderbookEntry[] = [];
      const asks: OrderbookEntry[] = [];

      // Process entries in a single pass for better performance
      entries.forEach((entry) => {
        if (
          entry.side === undefined ||
          entry.side === null ||
          !entry.price ||
          !entry.quantity
        ) {
          return;
        }

        // The backend sends values in pair decimal format, not wei format
        const pairDecimals = currentTradingPair?.pairDecimals || 8;

        // Convert from pair decimal format to human-readable format
        const priceDecimal = formatDecimalConsistent(
          parseFloat(entry.price || "0") / Math.pow(10, pairDecimals),
        );
        const quantityDecimal = formatDecimalConsistent(
          parseFloat(entry.quantity || "0") / Math.pow(10, pairDecimals),
        );

        // Create a new entry with properly formatted values
        const formattedEntry: OrderbookEntry = {
          ...entry,
          price: priceDecimal,
          quantity: quantityDecimal,
        };

        if (entry.side === Side.BID) {
          bids.push(formattedEntry);
        } else if (entry.side === Side.ASK) {
          asks.push(formattedEntry);
        }
      });

      // Sort bids in descending order (highest first) and asks in ascending order (lowest first)
      bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

      // Calculate spread
      const spread =
        asks.length > 0 && bids.length > 0
          ? parseFloat(asks[0].price) - parseFloat(bids[0].price)
          : 0;
      const spreadPercentage =
        asks.length > 0 && bids.length > 0
          ? (spread / parseFloat(bids[0].price)) * 100
          : 0;

      return {
        bids,
        asks,
        spread,
        spreadPercentage,
        lastUpdate: new Date(),
      };
    },
    [currentTradingPair],
  );

  const processOpenOrdersData = useCallback(
    (entries: OrderbookEntry[]): OrderbookEntry[] => {
      if (!entries || entries.length === 0) {
        return [];
      }

      // Filter out entries with missing required fields
      const validEntries = entries.filter((entry) => {
        return (
          entry.side !== undefined &&
          entry.side !== null &&
          entry.price &&
          entry.quantity &&
          entry.orderId
        );
      });

      if (!currentTradingPair) {
        return validEntries;
      }

      // Process entries with proper decimal conversion
      return validEntries.map((entry) => {
        const pairDecimals = currentTradingPair.pairDecimals || 8;

        const priceDecimal = formatDecimalConsistent(
          parseFloat(entry.price || "0") / Math.pow(10, pairDecimals),
        );
        const quantityDecimal = formatDecimalConsistent(
          parseFloat(entry.quantity || "0") / Math.pow(10, pairDecimals),
        );

        return {
          ...entry,
          price: priceDecimal,
          quantity: quantityDecimal,
        };
      });
    },
    [currentTradingPair],
  );

  // Fetch function - memoized to prevent infinite loops
  const fetchOrderbookData = useCallback(async () => {
    if (!marketId || marketId.trim() === "") {
      return;
    }

    const now = Date.now();
    const minFetchInterval = 3000; // Increased to 3 seconds to prevent resource exhaustion

    // Circuit breaker: if we've had too many failures recently, stop trying
    const circuitBreaker = circuitBreakerRef.current;
    if (circuitBreaker.isOpen && now - circuitBreaker.lastFailure < 60000) {
      // 60 second cooldown for circuit breaker
      console.log("🚫 Circuit breaker is open, skipping request");
      return;
    }

    // Prevent too frequent requests with exponential backoff
    const timeSinceLastFetch = now - lastFetchTime.current;
    const backoffMultiplier = Math.min(Math.pow(2, retryCount), 8); // Max 8x backoff
    const dynamicInterval = minFetchInterval * backoffMultiplier;
    
    if (timeSinceLastFetch < dynamicInterval) {
      console.log(`🚫 Throttling orderbook request - too frequent (${timeSinceLastFetch}ms < ${dynamicInterval}ms)`);
      return;
    }

    lastFetchTime.current = now;
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Fetching orderbook data for market:", marketId);

      // Fetch orderbook data
      const orderbookEntries = await arborterService.getOrderbook(
        marketId,
        false, // continueStream - DISABLED to prevent resource exhaustion
        true, // historicalOpenOrders
        filterByTrader,
      );

      if (orderbookEntries && orderbookEntries.length > 0) {
        // Process the orderbook data
        const processedOrderbook = processOrderbookData(orderbookEntries);
        const processedOpenOrders = processOpenOrdersData(orderbookEntries);

        setData((prevData) => {
          const newData = {
            ...prevData,
            orderbook: processedOrderbook,
            openOrders: processedOpenOrders,
            lastUpdate: new Date(),
          };

          // Save to global cache
          globalCache.setCachedData(marketId, newData, filterByTrader);

          return newData;
        });

        console.log("✅ Orderbook data processed successfully");
      } else {
        console.log("📭 No orderbook entries received");
      }

      setRetryCount(0);
      setInitialLoading(false);

      // Reset circuit breaker on success
      circuitBreakerRef.current = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      };
    } catch (err: unknown) {
      let errorMessage = "Unknown error occurred";
      
      if (err instanceof Error) {
        if (err.message.includes("503") || err.message.includes("Service Unavailable")) {
          errorMessage = "Service temporarily unavailable. Please try again in a moment.";
        } else if (err.message.includes("ERR_INCOMPLETE_CHUNKED_ENCODING")) {
          errorMessage = "Network connection issue. Retrying...";
        } else if (err.message.includes("upstream connect error") || err.message.includes("reset before headers")) {
          errorMessage = "Connection reset. Retrying...";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Retrying...";
        } else {
          errorMessage = err.message;
        }
      }

      console.error("❌ Orderbook fetch error:", errorMessage);

      // Update circuit breaker
      const breaker = circuitBreakerRef.current;
      breaker.failures += 1;
      breaker.lastFailure = Date.now();

      // Open circuit breaker after 3 consecutive failures
      if (breaker.failures >= 3) {
        breaker.isOpen = true;
        console.log("🚫 Circuit breaker opened due to repeated failures");
      }

      if (retryCount < maxRetries && !breaker.isOpen) {
        setRetryCount((prev) => prev + 1);
        // Retry after a longer delay to prevent resource exhaustion
        setTimeout(
          () => {
            fetchOrderbookData();
          },
          5000 * (retryCount + 1), // Even longer delay
        );
      } else {
        setError(`Failed to fetch orderbook data: ${errorMessage}`);
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [
    marketId,
    filterByTrader,
    globalCache,
    processOrderbookData,
    processOpenOrdersData,
    retryCount,
  ]);

  // Initial fetch and market ID change handling - simplified to prevent loops
  useEffect(() => {
    if (marketId && marketId.trim() !== "" && isRealMarketChange) {
      console.log("🔄 Market ID changed, checking cache for:", marketId);

      // Check if we have cached data for this market
      const marketCachedData = globalCache.getCachedData(
        marketId,
        filterByTrader,
      );
      const hasMarketCachedData =
        marketCachedData &&
        !globalCache.isDataStale(marketId, undefined, filterByTrader);

      if (hasMarketCachedData) {
        console.log("✅ Using cached data for market:", marketId);
        // If we have cached data, use it instead of resetting
        setData({
          orderbook: marketCachedData.orderbook,
          openOrders: marketCachedData.openOrders,
          lastUpdate: marketCachedData.lastUpdate,
        });
        setInitialLoading(false);
        hasInitializedRef.current = true;
      } else {
        console.log("🔄 No cached data, resetting state for market:", marketId);
        // Reset state when market ID changes and no cached data
        setData({
          orderbook: {
            bids: [],
            asks: [],
            spread: 0,
            spreadPercentage: 0,
            lastUpdate: new Date(),
          },
          openOrders: [],
          lastUpdate: new Date(),
        });

        setError(null);
        setInitialLoading(true);
        lastFetchTime.current = 0;
        setRetryCount(0);
        hasInitializedRef.current = false;
      }
    }
  }, [marketId, filterByTrader, isRealMarketChange, globalCache]);

  // Set up initial fetch - simplified to prevent loops
  useEffect(() => {
    if (marketId && marketId.trim() !== "" && retryCount < maxRetries) {
      // Check cache directly instead of using hasCachedData dependency
      const marketCachedData = globalCache.getCachedData(
        marketId,
        filterByTrader,
      );
      const hasMarketCachedData =
        marketCachedData &&
        !globalCache.isDataStale(marketId, undefined, filterByTrader);

      if (hasMarketCachedData) {
        console.log("✅ Using cached data, skipping fetch for:", marketId);
        setInitialLoading(false);
        return;
      }

      if (isRealMarketChange || !marketCachedData) {
        console.log("🔄 Triggering fetch for market:", marketId);
        fetchOrderbookData();
      }
    }
  }, [
    marketId,
    retryCount,
    maxRetries,
    filterByTrader,
    isRealMarketChange,
    fetchOrderbookData,
    globalCache,
  ]);

  // Listen for orderbook refresh events - memoized to prevent recreation
  const handleOrderbookRefresh = useCallback(() => {
    if (marketId && marketId.trim() !== "") {
      console.log("🔄 Orderbook refresh event received for:", marketId);
      fetchOrderbookData();
    }
  }, [marketId, fetchOrderbookData]);

  useEffect(() => {
    window.addEventListener("orderbook-refresh", handleOrderbookRefresh);
    return () => {
      window.removeEventListener("orderbook-refresh", handleOrderbookRefresh);
    };
  }, [handleOrderbookRefresh]);

  // Re-fetch data when trading pair becomes available (if we don't have proper data yet)
  // Note: We re-fetch rather than re-process because the stored data may already be
  // processed and re-processing would cause double decimal conversion
  useEffect(() => {
    if (currentTradingPair && data.orderbook.bids.length === 0 && data.orderbook.asks.length === 0) {
      // Only trigger a refresh if we don't have data yet and trading pair is now available
      console.log("🔄 Trading pair available, triggering refresh for:", marketId);
      fetchOrderbookData();
    }
  }, [currentTradingPair, data.orderbook.bids.length, data.orderbook.asks.length, marketId, fetchOrderbookData]);

  const refresh = useCallback(() => {
    setRetryCount(0);
    fetchOrderbookData();
  }, [fetchOrderbookData]);

  const setFilterByTrader = useCallback(() => {
    // This would need to be implemented to actually update the filter
    // For now, we'll just log the change
  }, []);

  // Determine loading states
  const isInitialLoading: boolean = initialLoading && retryCount === 0;
  const isLoading: boolean = loading && retryCount === 0;

  // Safety check: Return early with loading state if marketId is invalid
  if (!marketId || typeof marketId !== "string" || marketId.trim() === "") {
    return {
      orderbook: {
        bids: [],
        asks: [],
        spread: 0,
        spreadPercentage: 0,
        lastUpdate: new Date(),
      },
      openOrders: [],
      loading: true,
      initialLoading: true,
      error: "Invalid market ID provided",
      refresh: () => {
        // No-op: cannot refresh with invalid marketId
      },
      lastUpdate: new Date(),
      setFilterByTrader: () => {
        // No-op: cannot set filter with invalid marketId
      },
    };
  }

  return {
    orderbook: data.orderbook,
    openOrders: data.openOrders,
    loading: isLoading,
    initialLoading: isInitialLoading,
    error,
    refresh,
    lastUpdate: data.lastUpdate,
    setFilterByTrader,
  };
}
