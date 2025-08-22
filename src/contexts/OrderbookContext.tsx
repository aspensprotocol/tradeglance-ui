import type { ReactNode } from "react";
import { useSharedOrderbookData } from "../hooks/useSharedOrderbookData";
import { OrderbookContext } from "./orderbook-context";

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
  // Get data directly from the shared hook - it already handles all processing
  const rawData = useSharedOrderbookData(marketId, filterByTrader);

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

  // Special case for global provider - don't fetch data, just provide context
  if (marketId === "global") {
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
          loading: false,
          initialLoading: false,
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

  // Return the context with data from the shared hook
  return (
    <OrderbookContext.Provider
      value={{
        orderbook: rawData.orderbook,
        openOrders: rawData.openOrders,
        loading: rawData.loading,
        initialLoading: rawData.initialLoading,
        error: rawData.error,
        refresh: rawData.refresh,
        lastUpdate: rawData.lastUpdate,
        setFilterByTrader: rawData.setFilterByTrader,
      }}
    >
      {children}
    </OrderbookContext.Provider>
  );
}
