import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { arborterService } from "../lib/grpc-client";
import type { OrderbookEntry} from "../protos/gen/arborter_pb";
import { Side } from "../protos/gen/arborter_pb";
import { useTradingPairs } from "./useTradingPairs";
import { useOrderbookContext } from "./useOrderbookContext";

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
  // IMMEDIATE DEBUGGING: Log when hook is called
  console.log("🔍 useSharedOrderbookData: Hook called with:", {
    marketId,
    filterByTrader,
    marketIdType: typeof marketId,
    marketIdTruthy: !!marketId,
    timestamp: new Date().toISOString(),
  });

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

  // Debug the decimal values
  console.log("🔍 useSharedOrderbookData: Decimal values:", {
    marketId,
    hasTradingPair: !!currentTradingPair,
    tradingPairId: currentTradingPair?.id,
    baseTokenDecimals,
    quoteTokenDecimals,
    baseTokenDecimalsType: typeof baseTokenDecimals,
    quoteTokenDecimalsType: typeof quoteTokenDecimals,
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
  const pollingInterval = useRef<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3; // Reduced from 5 for faster failure recovery

  // Memoize the data processing functions to prevent recreation on every render
  const processOrderbookData = useCallback(
    (entries: OrderbookEntry[]): OrderbookData => {
      console.log("🔍 processOrderbookData called with:", {
        entriesCount: entries?.length || 0,
        hasEntries: !!entries,
        currentTradingPair: !!currentTradingPair,
        baseTokenDecimals,
        quoteTokenDecimals,
      });

      if (!entries || entries.length === 0) {
        console.log("❌ processOrderbookData: No entries to process");
        return {
          bids: [],
          asks: [],
          spread: 0,
          spreadPercentage: 0,
          lastUpdate: new Date(),
        };
      }

      // CRITICAL: Only process if we have valid decimal values
      if (!currentTradingPair) {
        console.warn("⚠️ processOrderbookData: Trading pair not loaded yet");
        // Return unprocessed data to prevent incorrect conversion
        return {
          bids: entries.filter(entry => entry.side === Side.BID),
          asks: entries.filter(entry => entry.side === Side.ASK),
          spread: 0,
          spreadPercentage: 0,
          lastUpdate: new Date(),
        };
      }

      console.log("🔍 processOrderbookData: Processing entries with proper decimals:", {
        entryCount: entries.length,
        baseTokenDecimals,
        quoteTokenDecimals,
        tradingPairId: currentTradingPair.id,
        sampleEntry: entries[0] ? {
          originalPrice: entries[0].price,
          originalQuantity: entries[0].quantity,
          priceType: typeof entries[0].price,
          quantityType: typeof entries[0].quantity,
        } : null,
      });

      const bids: OrderbookEntry[] = [];
      const asks: OrderbookEntry[] = [];

      // Process entries in a single pass for better performance
      entries.forEach((entry) => {
        if (entry.side === undefined || entry.side === null || !entry.price || !entry.quantity) {
          return;
        }

        // The backend sends values in pair decimal format, not wei format
        // So we need to divide by 10^pairDecimals, not 10^tokenDecimals
        const pairDecimals = currentTradingPair?.pairDecimals || 8;
        
        const priceDecimal = (parseFloat(entry.price || "0") / Math.pow(10, pairDecimals)).toString();
        const quantityDecimal = (parseFloat(entry.quantity || "0") / Math.pow(10, pairDecimals)).toString();

        console.log("🔍 processOrderbookData: Entry conversion:", {
          originalPrice: entry.price,
          originalQuantity: entry.quantity,
          pairDecimals,
          convertedPrice: priceDecimal,
          convertedQuantity: quantityDecimal,
          side: entry.side,
          priceDecimalType: typeof priceDecimal,
          quantityDecimalType: typeof quantityDecimal,
        });

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
    [currentTradingPair]
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

      // CRITICAL: Only process if we have valid decimal values
      if (!currentTradingPair) {
        console.warn("⚠️ processOpenOrdersData: Trading pair not loaded yet");
        // Return unprocessed data to prevent incorrect conversion
        return validEntries;
      }

      // Process entries with proper decimal conversion
      return validEntries.map((entry) => {
        // The backend sends values in pair decimal format, not wei format
        // So we need to divide by 10^pairDecimals, not 10^tokenDecimals
        const pairDecimals = currentTradingPair?.pairDecimals || 8;
        
        const priceDecimal = (parseFloat(entry.price || "0") / Math.pow(10, pairDecimals)).toString();
        const quantityDecimal = (parseFloat(entry.quantity || "0") / Math.pow(10, pairDecimals)).toString();

        console.log("🔍 processOpenOrdersData: Entry conversion:", {
          originalPrice: entry.price,
          originalQuantity: entry.quantity,
          pairDecimals,
          convertedPrice: priceDecimal,
          convertedQuantity: quantityDecimal,
          side: entry.side,
          priceDecimalType: typeof priceDecimal,
          quantityDecimalType: typeof quantityDecimal,
        });

        return {
          ...entry,
          price: priceDecimal,
          quantity: quantityDecimal,
        };
      });
    },
    [currentTradingPair]
  );

  // Memoize the fetch function to prevent recreation
  const fetchOrderbookDataRef = useRef<() => void>();

  // Create the fetch function
  const fetchOrderbookData = useCallback(async () => {
    // IMMEDIATE DEBUGGING: Log when function is called
    console.log("🔍 fetchOrderbookData: Function called with:", {
      marketId,
      filterByTrader,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      timestamp: new Date().toISOString(),
    });
    
    // Early validation - but this is ok since it's inside a function, not affecting hook order
    if (!marketId || marketId.trim() === "") {
      console.log("❌ fetchOrderbookData: Early return - no marketId");
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
        // CRITICAL DEBUGGING: Log raw data before any processing
        console.log("🔍 useSharedOrderbookData: Raw orderbook entries received:", {
          totalEntries: orderbookEntries.length,
          sampleEntries: orderbookEntries.slice(0, 3).map((entry, i) => ({
            index: i,
            hasEntry: !!entry,
            entryType: typeof entry,
            entryKeys: entry ? Object.keys(entry) : [],
            price: entry?.price,
            quantity: entry?.quantity,
            side: entry?.side,
            orderId: entry?.orderId,
            priceType: typeof entry?.price,
            quantityType: typeof entry?.quantity,
            priceLength: typeof entry?.price === 'string' ? entry?.price.length : 'N/A',
            quantityLength: typeof entry?.quantity === 'string' ? entry?.quantity.length : 'N/A',
            priceValue: entry?.price,
            quantityValue: entry?.quantity,
            rawEntry: entry,
          })),
          allEntries: orderbookEntries.map((entry, i) => ({
            index: i,
            price: entry?.price,
            quantity: entry?.quantity,
            side: entry?.side,
            priceType: typeof entry?.price,
            quantityType: typeof entry?.quantity,
          })),
        });
        
        // ALWAYS process through decimal conversion to ensure consistency
        const processedOrderbook = processOrderbookData(orderbookEntries);
        
        // COMPREHENSIVE DEBUGGING: Log everything before setting orderbook data
        console.log("🔍 DEBUGGING: Before setting orderbook data:", {
          rawEntriesCount: orderbookEntries.length,
          processedOrderbookBids: processedOrderbook.bids.map((b, i) => ({
            index: i,
            price: b.price,
            quantity: b.quantity,
            priceType: typeof b.price,
            quantityType: typeof b.quantity,
            priceLength: typeof b.price === 'string' ? b.price.length : 'N/A',
            quantityLength: typeof b.quantity === 'string' ? b.quantity.length : 'N/A',
            priceValue: b.price,
            quantityValue: b.quantity,
          })),
          processedOrderbookAsks: processedOrderbook.asks.map((a, i) => ({
            index: i,
            price: a.price,
            quantity: a.quantity,
            priceType: typeof a.price,
            quantityType: typeof a.quantity,
            priceLength: typeof a.price === 'string' ? a.price.length : 'N/A',
            quantityLength: typeof a.quantity === 'string' ? a.quantity.length : 'N/A',
            priceValue: a.price,
            quantityValue: a.quantity,
          })),
          baseTokenDecimals,
          quoteTokenDecimals,
          currentTradingPairId: currentTradingPair?.id,
        });
        
        setData((prevData) => ({
          ...prevData,
          orderbook: processedOrderbook,
          lastUpdate: new Date(),
        }));
      }

      // For open orders, we'll use the same orderbook data but filter for open orders
      if (orderbookEntries && orderbookEntries.length > 0) {
        // CRITICAL DEBUGGING: Log raw data before open orders processing
        console.log("🔍 useSharedOrderbookData: Processing open orders from raw entries:", {
          totalEntries: orderbookEntries.length,
          sampleEntries: orderbookEntries.slice(0, 3).map((entry, i) => ({
            index: i,
            hasEntry: !!entry,
            entryType: typeof entry,
            entryKeys: entry ? Object.keys(entry) : [],
            price: entry?.price,
            quantity: entry?.quantity,
            side: entry?.side,
            orderId: entry?.orderId,
            priceType: typeof entry?.price,
            quantityType: typeof entry?.quantity,
            priceLength: typeof entry?.price === 'string' ? entry?.price.length : 'N/A',
            quantityLength: typeof entry?.quantity === 'string' ? entry?.quantity.length : 'N/A',
            priceValue: entry?.price,
            quantityValue: entry?.quantity,
            rawEntry: entry,
          })),
        });
        
        // ALWAYS process through decimal conversion to ensure consistency
        const processedOpenOrders = processOpenOrdersData(orderbookEntries);
        
        // COMPREHENSIVE DEBUGGING: Log everything before setting open orders data
        console.log("🔍 DEBUGGING: Before setting open orders data:", {
          rawEntriesCount: orderbookEntries.length,
          processedOpenOrders: processedOpenOrders.map((o, i) => ({
            index: i,
            price: o.price,
            quantity: o.quantity,
            priceType: typeof o.price,
            quantityType: typeof o.quantity,
            priceLength: typeof o.price === 'string' ? o.price.length : 'N/A',
            quantityLength: typeof o.quantity === 'string' ? o.quantity.length : 'N/A',
            priceValue: o.price,
            quantityValue: o.quantity,
            orderId: o.orderId,
            side: o.side,
          })),
          baseTokenDecimals,
          quoteTokenDecimals,
          currentTradingPairId: currentTradingPair?.id,
        });
        
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
  }, [marketId, filterByTrader, processOrderbookData, processOpenOrdersData, retryCount, maxRetries, baseTokenDecimals, quoteTokenDecimals, currentTradingPair?.id]);

  // Store the fetch function in the ref
  useEffect(() => {
    console.log("🔄 useSharedOrderbookData: Setting fetch function in ref:", {
      hasFetchFunction: !!fetchOrderbookData,
      fetchFunctionType: typeof fetchOrderbookData,
      timestamp: new Date().toISOString(),
    });
    fetchOrderbookDataRef.current = fetchOrderbookData;
  }, [fetchOrderbookData]);

  // Initial fetch and market ID change handling
  useEffect(() => {
    console.log("🔄 useSharedOrderbookData: Market ID change effect triggered:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      timestamp: new Date().toISOString(),
    });
    
    if (marketId && marketId.trim() !== "") {
      console.log("🔍 useSharedOrderbookData: Resetting state for new market");
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
    console.log("🔄 useSharedOrderbookData: Polling effect triggered:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
      retryCount,
      maxRetries,
      hasFetchFunction: !!fetchOrderbookDataRef.current,
      timestamp: new Date().toISOString(),
    });
    
    if (marketId && marketId.trim() !== "" && retryCount < maxRetries) {
      console.log("🔍 useSharedOrderbookData: Setting up polling for market");
      // Clear any existing polling before setting up new one
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }

      // For continuous streaming, we don't need polling - just fetch once and let the stream run
      if (fetchOrderbookDataRef.current) {
        console.log("🔍 useSharedOrderbookData: Calling fetchOrderbookData through ref");
        fetchOrderbookDataRef.current();
      } else {
        console.log("❌ useSharedOrderbookData: No fetch function available in ref");
      }
    } else {
      console.log("❌ useSharedOrderbookData: Skipping polling setup:", {
        hasMarketId: !!marketId,
        retryCount,
        maxRetries,
      });
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

  // Handle streaming updates - ensure decimal formatting is maintained
  useEffect(() => {
    // This effect ensures that any streaming updates maintain decimal formatting
    // by re-processing the data through our decimal conversion functions
    if (data.orderbook.bids.length > 0 || data.orderbook.asks.length > 0) {
      // Re-process the current data to ensure decimal formatting is consistent
      const currentEntries = [
        ...data.orderbook.bids,
        ...data.orderbook.asks
      ];
      
      if (currentEntries.length > 0) {
        // Check if any entries need decimal conversion
        const needsConversion = currentEntries.some(entry => {
          const price = entry.price;
          const quantity = entry.quantity;
          // If price or quantity are very large numbers (likely wei), they need conversion
          return typeof price === 'string' && parseFloat(price) > 1000000000000000000 ||
                 typeof quantity === 'string' && parseFloat(quantity) > 1000000000000000000;
        });

        if (needsConversion) {
          console.log("🔄 Streaming update detected - re-processing for decimal consistency");
          
          // Re-process the orderbook data
          const processedOrderbook = processOrderbookData(currentEntries);
          
          // Re-process open orders
          const processedOpenOrders = processOpenOrdersData(currentEntries);
          
          setData(prevData => ({
            ...prevData,
            orderbook: processedOrderbook,
            openOrders: processedOpenOrders,
            lastUpdate: new Date(),
          }));
        }
      }
    }
  }, [data.orderbook.bids, data.orderbook.asks, processOrderbookData, processOpenOrdersData]);

  // CRITICAL: Re-process data when trading pair becomes available
  useEffect(() => {
    if (currentTradingPair && data.orderbook.bids.length > 0) {
      console.log("🔄 Trading pair loaded - re-processing existing data with proper decimals");
      
      // Re-process all existing data with the now-available trading pair
      const currentEntries = [
        ...data.orderbook.bids,
        ...data.orderbook.asks
      ];
      
      if (currentEntries.length > 0) {
        // Re-process the orderbook data
        const processedOrderbook = processOrderbookData(currentEntries);
        
        // Re-process open orders
        const processedOpenOrders = processOpenOrdersData(currentEntries);
        
        setData(prevData => ({
          ...prevData,
          orderbook: processedOrderbook,
          openOrders: processedOpenOrders,
          lastUpdate: new Date(),
        }));
      }
    }
  }, [currentTradingPair, processOrderbookData, processOpenOrdersData, data.orderbook.bids, data.orderbook.asks]);

  const refresh = useCallback(() => {
    setRetryCount(0);
    if (fetchOrderbookDataRef.current) {
      fetchOrderbookDataRef.current();
    }
  }, []);

  // Function to update the filter by trader
  const setFilterByTrader = useCallback(() => {
    // This would need to be implemented to actually update the filter
    // For now, we'll just log the change
  }, []);

  // Determine loading states - be more aggressive about showing "no data"
  const isInitialLoading: boolean = initialLoading && retryCount === 0;
  const isLoading: boolean = loading && retryCount === 0;

  // Safety check: Return early with loading state if marketId is invalid
  if (!marketId || typeof marketId !== 'string' || marketId.trim() === '') {
    console.warn("⚠️ useSharedOrderbookData: Invalid marketId provided, returning loading state:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
    });
    
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
        console.warn("⚠️ useSharedOrderbookData: Cannot refresh with invalid marketId");
      },
      lastUpdate: new Date(),
      setFilterByTrader: () => {
        console.warn("⚠️ useSharedOrderbookData: Cannot set filter with invalid marketId");
      },
    };
  }

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
