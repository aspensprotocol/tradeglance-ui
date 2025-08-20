import { useState, useEffect, useCallback, useRef } from "react";
import { arborterService } from "../lib/grpc-client";
import { OrderbookEntry, Side, OrderStatus } from "../protos/gen/arborter_pb";
import { weiToDecimal, formatDecimal } from "../lib/number-utils";
import { useTradingPairs } from "./useTradingPairs";
import { configUtils } from "../lib/config-utils";

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
} {
  console.log("🔍 useSharedOrderbookData hook called:", {
    marketId,
    marketIdType: typeof marketId,
    marketIdTruthy: !!marketId,
    filterByTrader,
    filterByTraderType: typeof filterByTrader,
  });

  // Get trading pairs to extract token decimals
  const { tradingPairs } = useTradingPairs();

  // Find the current trading pair to get token decimals
  const currentTradingPair = tradingPairs.find((pair) => pair.id === marketId);

  // Extract token decimals from the trading pair
  const baseTokenDecimals = currentTradingPair?.baseChainTokenDecimals || 18;
  const quoteTokenDecimals = currentTradingPair?.quoteChainTokenDecimals || 18;

  console.log("🔍 useSharedOrderbookData: Token decimals:", {
    marketId,
    currentTradingPair: currentTradingPair?.displayName,
    baseTokenDecimals,
    quoteTokenDecimals,
    baseSymbol: currentTradingPair?.baseSymbol,
    quoteSymbol: currentTradingPair?.quoteSymbol,
  });

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
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5; // Increased to 5 for better reliability with streaming
  const requestTimeout = 15000; // Increased to 15 seconds for streaming data

  console.log("🔍 useSharedOrderbookData initial state:", {
    marketId,
    initialLoading,
    loading,
    error,
    retryCount,
    hasData: !!data.orderbook,
    dataKeys: Object.keys(data),
  });

  // Process orderbook data into the expected format
  const processOrderbookData = useCallback(
    (entries: OrderbookEntry[]): OrderbookData => {
      const bids: OrderbookEntry[] = [];
      const asks: OrderbookEntry[] = [];

      if (!entries || entries.length === 0) {
        console.log("No orderbook entries to process");
        return {
          bids: [],
          asks: [],
          spread: 0,
          spreadPercentage: 0,
          lastUpdate: new Date(),
        };
      }

      console.log("Processing orderbook data:", entries.length, "entries");

      // Less aggressive deduplication - only remove exact duplicates
      const uniqueEntries = entries.filter((entry, index, self) => {
        const isDuplicate =
          self.findIndex(
            (e) =>
              e.orderId?.toString() === entry.orderId?.toString() &&
              e.side === entry.side &&
              e.price === entry.price &&
              e.quantity === entry.quantity,
          ) !== index;

        if (isDuplicate) {
          console.log("Removing duplicate entry:", {
            orderId: entry.orderId,
            side: entry.side,
            price: entry.price,
            quantity: entry.quantity,
          });
        }

        return !isDuplicate;
      });

      if (uniqueEntries.length !== entries.length) {
        console.log("Orderbook deduplication:", {
          original: entries.length,
          unique: uniqueEntries.length,
          duplicates: entries.length - uniqueEntries.length,
        });
      }

      uniqueEntries.forEach((entry) => {
        if (entry.side === undefined || entry.side === null) {
          console.warn("Entry missing side:", entry);
          return;
        }

        // Less strict validation - only check for absolutely required fields
        if (!entry.price || !entry.quantity) {
          console.warn("Entry missing absolutely required fields:", {
            orderId: entry.orderId,
            hasPrice: !!entry.price,
            hasQuantity: !!entry.quantity,
            side: entry.side,
          });
          return;
        }

        // Convert wei values to proper decimals using actual token decimals from config
        // Price uses quote token decimals (price is in quote currency)
        // Quantity uses base token decimals (quantity is in base currency)
        const priceDecimal = weiToDecimal(
          entry.price || "0",
          quoteTokenDecimals,
        );
        const quantityDecimal = weiToDecimal(
          entry.quantity || "0",
          baseTokenDecimals,
        );

        console.log("🔍 Decimal conversion:", {
          orderId: entry.orderId,
          side: entry.side === Side.BID ? "BID" : "ASK",
          priceWei: entry.price,
          priceDecimal,
          quantityWei: entry.quantity,
          quantityDecimal,
          baseTokenDecimals,
          quoteTokenDecimals,
        });

        // Create a new entry with properly formatted values
        const formattedEntry: OrderbookEntry = {
          ...entry,
          price: priceDecimal,
          quantity: quantityDecimal,
        };

        // Use protobuf Side enum values directly
        if (entry.side === Side.BID) {
          bids.push(formattedEntry);
        } else if (entry.side === Side.ASK) {
          asks.push(formattedEntry);
        } else {
          console.warn("Unknown side value:", entry.side, "for entry:", entry);
        }
      });

      // Sort bids (highest first) and asks (lowest first)
      bids.sort(
        (a: OrderbookEntry, b: OrderbookEntry) =>
          parseFloat(b.price) - parseFloat(a.price),
      );
      asks.sort(
        (a: OrderbookEntry, b: OrderbookEntry) =>
          parseFloat(a.price) - parseFloat(b.price),
      );

      const lowestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
      const highestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
      const spread = lowestAsk - highestBid;
      const spreadPercentage = lowestAsk > 0 ? (spread / lowestAsk) * 100 : 0;

      console.log("Orderbook processed:", {
        totalEntries: entries.length,
        uniqueEntries: uniqueEntries.length,
        bids: bids.length,
        asks: asks.length,
        spread,
        spreadPercentage,
        sampleBid: bids[0]
          ? { price: bids[0].price, quantity: bids[0].quantity }
          : null,
        sampleAsk: asks[0]
          ? { price: asks[0].price, quantity: asks[0].quantity }
          : null,
      });

      return {
        bids,
        asks,
        spread,
        spreadPercentage,
        lastUpdate: new Date(),
      };
    },
    [],
  );

  // Process orderbook data into open orders format - return OrderbookEntry directly
  const processOpenOrdersData = useCallback(
    (orderbookEntries: OrderbookEntry[]): OrderbookEntry[] => {
      console.log(
        "Processing open orders from",
        orderbookEntries.length,
        "orderbook entries",
      );

      const openOrders = orderbookEntries.filter((entry: OrderbookEntry) => {
        // Only include entries that are actual open orders
        // ORDER_STATUS_ADDED = 1 (open order)
        // ORDER_STATUS_FILLED = 2 (filled order - closed)
        // ORDER_STATUS_CANCELLED = 3 (cancelled order - closed)
        const isOpen = entry.status === OrderStatus.ADDED;

        // Less strict validation - only check for absolutely required fields
        const hasRequiredFields =
          entry.price && entry.quantity && entry.side !== undefined;

        if (!isOpen) {
          console.log("Filtering out non-open order:", {
            orderId: entry.orderId,
            status: entry.status,
            side: entry.side,
          });
        }

        if (!hasRequiredFields) {
          console.log("Filtering out incomplete entry:", {
            orderId: entry.orderId,
            hasPrice: !!entry.price,
            hasQuantity: !!entry.quantity,
            hasSide: entry.side !== undefined,
          });
        }

        return isOpen && hasRequiredFields;
      });

      console.log("Open orders processed:", openOrders.length, "orders");
      return openOrders;
    },
    [],
  );

  // Fetch orderbook data
  const fetchOrderbookData = useCallback(async (): Promise<void> => {
    console.log("🚀 fetchOrderbookData called:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      filterByTrader,
      lastFetchTime: lastFetchTime.current,
      currentTime: Date.now(),
      timeSinceLastFetch: Date.now() - lastFetchTime.current,
    });

    if (!marketId || marketId.trim() === "") {
      console.log("❌ useSharedOrderbookData: No market ID, skipping fetch");
      return;
    }

    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      // Reduced from 5 to 2 seconds for more responsive updates
      console.log(
        "⏰ useSharedOrderbookData: Skipping fetch - too soon since last fetch",
      );
      return;
    }

    lastFetchTime.current = now;
    setLoading(true);
    setError(null);

    console.log(
      "✅ useSharedOrderbookData: Starting fetch for marketId:",
      marketId,
    );

    try {
      console.log(
        "🚀 useSharedOrderbookData: Calling arborterService.getOrderbook...",
      );

      // For continuous streaming, don't use timeout race - let the stream run
      const response = await arborterService.getOrderbook(
        marketId,
        undefined,
        true,
        filterByTrader,
      );

      console.log("📡 useSharedOrderbookData: Response received:", {
        hasResponse: !!response,
        responseType: typeof response,
        responseLength: response?.length || 0,
        isArray: Array.isArray(response),
      });

      if (response && response.length > 0) {
        console.log("⚡ Orderbook data received:", response.length, "entries");
        const orderbook = processOrderbookData(response);
        const openOrders = processOpenOrdersData(response);
        const uniqueOpenOrders = openOrders.filter(
          (order: OrderbookEntry, index: number, self: OrderbookEntry[]) => {
            const firstIndex = self.findIndex(
              (o: OrderbookEntry) =>
                o.orderId?.toString() === order.orderId?.toString(),
            );
            return firstIndex === index;
          },
        );
        setData({
          orderbook,
          openOrders: uniqueOpenOrders,
          lastUpdate: new Date(),
        });
        setInitialLoading(false);
        setRetryCount(0); // Reset retry count on successful fetch
        console.log("✅ Orderbook data processed and updated");
      } else {
        console.log("📭 No orderbook data received, setting empty state");
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
        setInitialLoading(false);
        setRetryCount(0); // Reset retry count even on empty data
        console.log("✅ Empty orderbook state set");
      }
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(
        "❌ useSharedOrderbookData: Error fetching orderbook data:",
        errorMessage,
      );
      console.error("❌ Error details:", error);

      // Check if this is a streaming error (network error, incomplete chunked encoding)
      const isStreamingError =
        errorMessage.includes("network error") ||
        errorMessage.includes("ERR_INCOMPLETE_CHUNKED_ENCODING") ||
        errorMessage.includes("Request timeout");

      if (isStreamingError && retryCount < maxRetries) {
        console.log(
          `🔄 Streaming error detected, will retry (${retryCount + 1}/${maxRetries})`,
        );
        setRetryCount((prev) => prev + 1);
        // Don't set error state for streaming errors, just retry
        // Don't set initialLoading to false yet, keep trying
      } else if (isStreamingError && retryCount >= maxRetries) {
        console.log("⚠️ Max streaming retries exceeded, showing error");
        setError("Connection issues - please refresh to retry");
        setInitialLoading(false);
      } else {
        // Non-streaming error, show immediately
        setError(errorMessage);
        setInitialLoading(false);
      }

      // Set empty state on error to prevent UI from hanging
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
    } finally {
      setLoading(false);
      console.log("🏁 useSharedOrderbookData: Fetch completed");
    }
  }, [
    marketId,
    filterByTrader,
    requestTimeout,
    processOrderbookData,
    processOpenOrdersData,
  ]);

  // Initial fetch effect
  useEffect(() => {
    console.log("🔄 useSharedOrderbookData: Initial fetch effect triggered:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      filterByTrader,
      filterByTraderType: typeof filterByTrader,
      effectDependencies: { marketId, filterByTrader },
    });

    if (!marketId || marketId.trim() === "") {
      console.log(
        "❌ useSharedOrderbookData: No market ID, skipping initial fetch",
      );
      return;
    }

    // Add a small delay to prevent race conditions with other effects
    const initialFetchTimer = setTimeout(() => {
      console.log(
        "🚀 useSharedOrderbookData: Starting initial fetch after delay",
      );
      fetchOrderbookData();
    }, 100);

    return () => clearTimeout(initialFetchTimer);
  }, [marketId, filterByTrader, fetchOrderbookData]);

  // Clear data when marketId changes to prevent stale data
  useEffect(() => {
    console.log(
      "🔄 useSharedOrderbookData: Market ID change effect triggered:",
      {
        marketId,
        marketIdType: typeof marketId,
        marketIdTruthy: !!marketId,
        effectDependencies: { marketId },
      },
    );

    console.log(
      "🧹 Market ID changed in shared orderbook data, clearing previous data",
    );

    // Clear all data immediately when marketId changes
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

    // Clear any existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    setError(null);
    setInitialLoading(true); // Reset to loading state for new market
    lastFetchTime.current = 0;
    setRetryCount(0); // Reset retry count for new market
  }, [marketId]); // Only depend on marketId to prevent infinite loops

  // Set up polling
  useEffect(() => {
    console.log("🔄 useSharedOrderbookData: Polling effect triggered:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      retryCount,
      maxRetries,
      effectDependencies: {
        marketId,
        fetchOrderbookData,
        retryCount,
        maxRetries,
      },
    });

    if (!marketId || marketId.trim() === "") {
      console.log(
        "❌ useSharedOrderbookData: Skipping polling - no marketId or empty marketId:",
        marketId,
      );
      return;
    }

    // Don't poll if we've exceeded the retry limit
    if (retryCount >= maxRetries) {
      console.warn(
        "⚠️ Max retries exceeded in shared orderbook data, stopping polling",
      );
      return;
    }

    // Clear any existing polling before setting up new one
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    console.log(
      "✅ useSharedOrderbookData: Setting up continuous stream for marketId:",
      marketId,
    );

    // For continuous streaming, we don't need polling - just fetch once and let the stream run
    fetchOrderbookData();

    return () => {
      if (pollingInterval.current) {
        console.log(
          "🧹 useSharedOrderbookData: Cleaning up polling interval for marketId:",
          marketId,
        );
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [marketId, fetchOrderbookData, retryCount, maxRetries]);

  // Listen for orderbook refresh events
  useEffect(() => {
    const handleOrderbookRefresh = () => {
      console.log(
        "🔄 useSharedOrderbookData: Orderbook refresh event received",
      );
      if (marketId && marketId.trim() !== "") {
        fetchOrderbookData();
      }
    };

    window.addEventListener("orderbook-refresh", handleOrderbookRefresh);
    return () => {
      window.removeEventListener("orderbook-refresh", handleOrderbookRefresh);
    };
  }, [marketId, fetchOrderbookData]);

  // Debug logging for data changes
  useEffect(() => {
    console.log("useSharedOrderbookData: Data state changed:", {
      loading,
      error,
      retryCount,
    });
  }, [loading, error, retryCount]); // Added retryCount to dependencies

  const refresh = useCallback(() => {
    console.log(
      "🔄 useSharedOrderbookData: Manual refresh triggered for marketId:",
      marketId,
    );
    setRetryCount(0); // Reset retry count on manual refresh
    fetchOrderbookData();
  }, [marketId, fetchOrderbookData]);

  // Determine loading states - be more aggressive about showing "no data"
  const isInitialLoading: boolean = initialLoading && retryCount === 0; // Only show initial loading on first attempt
  const isLoading: boolean = loading && retryCount === 0; // Only show loading on first attempt

  const result = {
    orderbook: data.orderbook,
    openOrders: data.openOrders,
    loading: isLoading,
    initialLoading: isInitialLoading,
    error,
    refresh,
    lastUpdate: data.lastUpdate,
  };

  console.log("🔍 useSharedOrderbookData: Returning result:", {
    marketId,
    result: {
      hasOrderbook: !!result.orderbook,
      orderbookKeys: result.orderbook ? Object.keys(result.orderbook) : [],
      asksCount: result.orderbook?.asks?.length || 0,
      bidsCount: result.orderbook?.bids?.length || 0,
      openOrdersCount: result.openOrders?.length || 0,
      loading: result.loading,
      initialLoading: result.initialLoading,
      hasError: !!result.error,
      hasRefresh: !!result.refresh,
      lastUpdate: result.lastUpdate,
    },
  });

  return result;
}
