import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSharedOrderbookData } from "../hooks/useSharedOrderbookData";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";
import {
  OrderbookContext,
  type OrderbookContextType,
} from "./orderbook-context";

interface OrderbookProviderProps {
  children: ReactNode;
  marketId: string;
  filterByTrader?: string;
}

export function OrderbookProvider({
  children,
  marketId,
  filterByTrader,
}: OrderbookProviderProps): JSX.Element {
  // IMMEDIATE DEBUGGING: Log when context provider is created
  console.log("🔍 OrderbookProvider: Created with:", {
    marketId,
    filterByTrader,
    marketIdType: typeof marketId,
    marketIdTruthy: !!marketId,
    timestamp: new Date().toISOString(),
  });

  // Get raw data from the hook
  const rawData = useSharedOrderbookData(marketId, filterByTrader);

  // Parse and cache the data with proper decimals
  const [parsedData, setParsedData] = useState<OrderbookContextType>({
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
    setFilterByTrader: () => {
      // No-op: filtering not implemented yet
    },
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
            "⚠️ OrderbookContext: Detected wei price, converting to decimal:",
            price,
          );
        }
        if (
          typeof quantity === "string" &&
          parseFloat(quantity) > 1000000000000000000
        ) {
          console.warn(
            "⚠️ OrderbookContext: Detected wei quantity, converting to decimal:",
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

  // Memoize the comprehensive logging data to prevent recreating objects on every render
  const loggingData = useMemo(
    () => ({
      hasOrderbook: !!rawData.orderbook,
      hasOpenOrders: !!rawData.openOrders,
      orderbookBids: rawData.orderbook?.bids?.length || 0,
      orderbookAsks: rawData.orderbook?.asks?.length || 0,
      openOrdersCount: rawData.openOrders?.length || 0,
      sampleOpenOrder: rawData.openOrders?.[0]
        ? {
            price: rawData.openOrders[0].price,
            quantity: rawData.openOrders[0].quantity,
            priceType: typeof rawData.openOrders[0].price,
            quantityType: typeof rawData.openOrders[0].quantity,
          }
        : null,
    }),
    [rawData.orderbook, rawData.openOrders],
  );

  // Memoize the comprehensive raw data logging to prevent recreating objects
  const comprehensiveLoggingData = useMemo(
    () => ({
      orderbookBids:
        rawData.orderbook?.bids?.map((b, i) => ({
          index: i,
          price: b.price,
          quantity: b.quantity,
          priceType: typeof b.price,
          quantityType: typeof b.quantity,
          priceLength: typeof b.price === "string" ? b.price.length : "N/A",
          quantityLength:
            typeof b.quantity === "string" ? b.quantity.length : "N/A",
          priceValue: b.price,
          quantityValue: b.quantity,
        })) || [],
      orderbookAsks:
        rawData.orderbook?.asks?.map((a, i) => ({
          index: i,
          price: a.price,
          quantity: a.quantity,
          priceType: typeof a.price,
          quantityType: typeof a.quantity,
          priceLength: typeof a.price === "string" ? a.price.length : "N/A",
          quantityLength:
            typeof a.quantity === "string" ? a.quantity.length : "N/A",
          priceValue: a.price,
          quantityValue: a.quantity,
        })) || [],
      openOrders:
        rawData.openOrders?.map((o, i) => ({
          index: i,
          price: o.price,
          quantity: o.quantity,
          priceType: typeof o.price,
          quantityType: typeof o.quantity,
          priceLength: typeof o.price === "string" ? o.price.length : "N/A",
          quantityLength:
            typeof o.quantity === "string" ? o.quantity.length : "N/A",
          priceValue: o.price,
          quantityValue: o.quantity,
          orderId: o.orderId,
          side: o.side,
        })) || [],
    }),
    [rawData.orderbook, rawData.openOrders],
  );

  // Update parsed data when raw data changes
  useEffect(() => {
    console.log(
      "🔄 OrderbookContext: rawData changed, processing:",
      loggingData,
    );

    // COMPREHENSIVE DEBUGGING: Log all raw data details
    console.log(
      "🔍 OrderbookContext: COMPREHENSIVE raw data logging:",
      comprehensiveLoggingData,
    );

    if (rawData.orderbook && rawData.openOrders && parsedOrderbook) {
      console.log("🔍 OrderbookContext: After parsing:", {
        parsedOrderbookBids: parsedOrderbook.bids
          .slice(0, 2)
          .map((b) => ({ price: b.price, quantity: b.quantity })),
        parsedOpenOrders: parsedOpenOrders
          .slice(0, 2)
          .map((o) => ({ price: o.price, quantity: o.quantity })),
      });

      // COMPREHENSIVE DEBUGGING: Log final parsed data
      console.log("🔍 OrderbookContext: COMPREHENSIVE final parsed data:", {
        finalOrderbookBids: parsedOrderbook.bids.map((b, i) => ({
          index: i,
          price: b.price,
          quantity: b.quantity,
          priceType: typeof b.price,
          quantityType: typeof b.quantity,
          priceLength: typeof b.price === "string" ? b.price.length : "N/A",
          quantityLength:
            typeof b.quantity === "string" ? b.quantity.length : "N/A",
          priceValue: b.price,
          quantityValue: b.quantity,
        })),
        finalOrderbookAsks: parsedOrderbook.asks.map((a, i) => ({
          index: i,
          price: a.price,
          quantity: a.quantity,
          priceType: typeof a.price,
          quantityType: typeof a.quantity,
          priceLength: typeof a.price === "string" ? a.price.length : "N/A",
          quantityLength:
            typeof a.quantity === "string" ? a.quantity.length : "N/A",
          priceValue: a.price,
          quantityValue: a.quantity,
        })),
        finalOpenOrders: parsedOpenOrders.map((o, i) => ({
          index: i,
          price: o.price,
          quantity: o.quantity,
          priceType: typeof o.price,
          quantityType: typeof o.quantity,
          priceLength: typeof o.price === "string" ? o.price.length : "N/A",
          quantityLength:
            typeof o.quantity === "string" ? o.quantity.length : "N/A",
          priceValue: o.price,
          quantityValue: o.quantity,
          orderId: o.orderId,
          side: o.side,
        })),
      });

      setParsedData({
        ...rawData,
        orderbook: parsedOrderbook,
        openOrders: parsedOpenOrders,
        refresh: rawData.refresh, // Pass through the refresh function
        setFilterByTrader: rawData.setFilterByTrader, // Pass through the setFilterByTrader function
      });
    }
  }, [
    rawData,
    parsedOrderbook,
    parsedOpenOrders,
    loggingData,
    comprehensiveLoggingData,
  ]);

  // Safety check: Don't render if marketId is invalid
  if (!marketId || typeof marketId !== "string" || marketId.trim() === "") {
    console.error("❌ OrderbookProvider: Invalid marketId provided:", {
      marketId,
      marketIdType: typeof marketId,
      marketIdTruthy: !!marketId,
    });

    // Return a loading state while waiting for valid marketId
    return (
      <OrderbookContext.Provider
        value={{
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
            // No-op: refresh is handled by the hook
          },
          lastUpdate: new Date(),
          setFilterByTrader: () => {
            // No-op: filtering not implemented yet
          },
        }}
      >
        {children}
      </OrderbookContext.Provider>
    );
  }

  // Don't render the context provider until we have valid data
  if (!rawData.orderbook || !rawData.openOrders) {
    console.log("🔍 OrderbookProvider: Waiting for data to load...", {
      hasOrderbook: !!rawData.orderbook,
      hasOpenOrders: !!rawData.openOrders,
      loading: rawData.loading,
      initialLoading: rawData.initialLoading,
    });

    // Return a loading state or null while waiting for data
    return (
      <OrderbookContext.Provider
        value={{
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
          error: null,
          refresh: () => {
            // No-op: refresh is handled by the hook
          },
          lastUpdate: new Date(),
          setFilterByTrader: () => {
            // No-op: filtering not implemented yet
          },
        }}
      >
        {children}
      </OrderbookContext.Provider>
    );
  }

  return (
    <OrderbookContext.Provider value={parsedData}>
      {children}
    </OrderbookContext.Provider>
  );
}

// Hook moved to src/hooks/useOrderbookContext.ts to fix React Fast Refresh warning
