import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { arborterService } from "../lib/grpc-client";
import { OrderbookEntry, Side, OrderStatus } from "../protos/gen/arborter_pb";
import { weiToDecimal } from "../lib/number-utils";
import { useTradingPairs } from "./useTradingPairs";

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
  setFilterByTrader: (trader: string | undefined) => void;
} {
  // Get trading pairs to extract token decimals
  const { tradingPairs } = useTradingPairs();

  // Memoize the current trading pair to avoid unnecessary recalculations
  const currentTradingPair = useMemo(() => 
    tradingPairs.find((pair) => pair.id === marketId),
    [tradingPairs, marketId]
  );

  // Extract token decimals from the trading pair
  const baseTokenDecimals = currentTradingPair?.baseChainTokenDecimals || 18;
  const quoteTokenDecimals = currentTradingPair?.quoteChainTokenDecimals || 18;

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
  const maxRetries = 3; // Reduced from 5 for faster failure recovery
  const requestTimeout = 10000; // Reduced to 10 seconds for faster response

  // Memoize the data processing functions to prevent recreation on every render
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

      const bids: OrderbookEntry[] = [];
      const asks: OrderbookEntry[] = [];

      // Process entries in a single pass for better performance
      entries.forEach((entry) => {
        if (entry.side === undefined || entry.side === null || !entry.price || !entry.quantity) {
          return;
        }

        // Convert wei values to proper decimals using actual token decimals from config
        const priceDecimal = weiToDecimal(entry.price || "0", quoteTokenDecimals);
        const quantityDecimal = weiToDecimal(entry.quantity || "0", baseTokenDecimals);

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
      const spread = asks.length > 0 && bids.length > 0 ? parseFloat(asks[0].price) - parseFloat(bids[0].price) : 0;
      const spreadPercentage = asks.length > 0 && bids.length > 0 ? (spread / parseFloat(bids[0].price)) * 100 : 0;

      return {
        bids,
        asks,
        spread,
        spreadPercentage,
        lastUpdate: new Date(),
      };
    },
    [baseTokenDecimals, quoteTokenDecimals]
  );

  // Memoize the open orders processing function
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

      // Process entries with proper decimal conversion
      return validEntries.map((entry) => {
        const priceDecimal = weiToDecimal(entry.price || "0", quoteTokenDecimals);
        const quantityDecimal = weiToDecimal(entry.quantity || "0", baseTokenDecimals);

        return {
          ...entry,
          price: priceDecimal,
          quantity: quantityDecimal,
        };
      });
    },
    [baseTokenDecimals, quoteTokenDecimals]
  );

  // Memoize the fetch function to prevent recreation
  const fetchOrderbookDataRef = useRef<() => void>();

  // Create the fetch function
  const fetchOrderbookData = useCallback(async () => {
    // Early validation - but this is ok since it's inside a function, not affecting hook order
    if (!marketId || marketId.trim() === "") {
      return;
    }

    const now = Date.now();
    const minFetchInterval = 1000; // Reduced from 2s to 1s for more responsive updates

    // Prevent too frequent requests
    if (now - lastFetchTime.current < minFetchInterval) {
      return;
    }

    lastFetchTime.current = now;
    setLoading(true);
    setError(null);

    try {
      // Fetch orderbook data - the API returns OrderbookEntry[] directly
      const orderbookEntries = await arborterService.getOrderbook(
        marketId,
        true, // continueStream
        true, // historicalOpenOrders
        filterByTrader
      );

      if (orderbookEntries && orderbookEntries.length > 0) {
        const processedOrderbook = processOrderbookData(orderbookEntries);
        
        setData((prevData) => ({
          ...prevData,
          orderbook: processedOrderbook,
          lastUpdate: new Date(),
        }));
      }

      // For open orders, we'll use the same orderbook data but filter for open orders
      if (orderbookEntries && orderbookEntries.length > 0) {
        const processedOpenOrders = processOpenOrdersData(orderbookEntries);
        
        setData((prevData) => ({
          ...prevData,
          openOrders: processedOpenOrders,
          lastUpdate: new Date(),
        }));
      }

      setRetryCount(0);
      setInitialLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        // Retry after a delay
        setTimeout(() => {
          if (fetchOrderbookDataRef.current) {
            fetchOrderbookDataRef.current();
          }
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError(`Failed to fetch orderbook data: ${errorMessage}`);
        setInitialLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [marketId, filterByTrader, processOrderbookData, processOpenOrdersData, retryCount, maxRetries]);

  // Store the fetch function in the ref
  useEffect(() => {
    fetchOrderbookDataRef.current = fetchOrderbookData;
  }, [fetchOrderbookData]);

  // Initial fetch and market ID change handling
  useEffect(() => {
    if (marketId && marketId.trim() !== "") {
      // Reset state when market ID changes
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
      setInitialLoading(true);
      lastFetchTime.current = 0;
      setRetryCount(0);
    }
  }, [marketId]);

  // Set up polling
  useEffect(() => {
    if (marketId && marketId.trim() !== "" && retryCount < maxRetries) {
      // Clear any existing polling before setting up new one
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }

      // For continuous streaming, we don't need polling - just fetch once and let the stream run
      if (fetchOrderbookDataRef.current) {
        fetchOrderbookDataRef.current();
      }
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [marketId, retryCount, maxRetries]);

  // Listen for orderbook refresh events
  useEffect(() => {
    const handleOrderbookRefresh = () => {
      if (marketId && marketId.trim() !== "") {
        if (fetchOrderbookDataRef.current) {
          fetchOrderbookDataRef.current();
        }
      }
    };

    window.addEventListener("orderbook-refresh", handleOrderbookRefresh);
    return () => {
      window.removeEventListener("orderbook-refresh", handleOrderbookRefresh);
    };
  }, [marketId]);

  const refresh = useCallback(() => {
    setRetryCount(0);
    if (fetchOrderbookDataRef.current) {
      fetchOrderbookDataRef.current();
    }
  }, []);

  // Function to update the filter by trader
  const setFilterByTrader = useCallback((trader: string | undefined) => {
    // This would need to be implemented to actually update the filter
    // For now, we'll just log the change
  }, []);

  // Determine loading states - be more aggressive about showing "no data"
  const isInitialLoading: boolean = initialLoading && retryCount === 0;
  const isLoading: boolean = loading && retryCount === 0;

  // Return the result directly without memoization to avoid circular dependencies
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
