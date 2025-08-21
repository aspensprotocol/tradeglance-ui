import {
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSharedOrderbookData } from "../hooks/useSharedOrderbookData";
import { OrderbookData } from "../hooks/useSharedOrderbookData";
import { OrderbookEntry } from "../protos/gen/arborter_pb";
import { OrderbookContext, type OrderbookContextType } from "./orderbook-context";

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
    refresh: () => {},
    lastUpdate: new Date(),
    setFilterByTrader: () => {},
  });

  // Parse the raw data - NO conversion needed since useSharedOrderbookData already does it
  const parseOrderbookData = useCallback(
    (entries: OrderbookEntry[]): OrderbookEntry[] => {
      if (!entries || entries.length === 0) return [];

      // Just return the entries as-is since they're already converted
      return entries;
    },
    [],
  );

  // Update parsed data when raw data changes
  useEffect(() => {
    console.log("🔄 OrderbookContext: rawData changed, processing:", {
      hasOrderbook: !!rawData.orderbook,
      hasOpenOrders: !!rawData.openOrders,
      orderbookBids: rawData.orderbook?.bids?.length || 0,
      orderbookAsks: rawData.orderbook?.asks?.length || 0,
      openOrdersCount: rawData.openOrders?.length || 0,
      sampleOpenOrder: rawData.openOrders?.[0] ? {
        price: rawData.openOrders[0].price,
        quantity: rawData.openOrders[0].quantity,
        priceType: typeof rawData.openOrders[0].price,
        quantityType: typeof rawData.openOrders[0].quantity,
      } : null,
    });

    if (rawData.orderbook && rawData.openOrders) {
      const parsedOrderbook = {
        ...rawData.orderbook,
        bids: parseOrderbookData(rawData.orderbook.bids),
        asks: parseOrderbookData(rawData.orderbook.asks),
      };

      const parsedOpenOrders = parseOrderbookData(rawData.openOrders);

      console.log("🔍 OrderbookContext: After parsing:", {
        parsedOrderbookBids: parsedOrderbook.bids.slice(0, 2).map(b => ({ price: b.price, quantity: b.quantity })),
        parsedOpenOrders: parsedOpenOrders.slice(0, 2).map(o => ({ price: o.price, quantity: o.quantity })),
      });

      setParsedData({
        ...rawData,
        orderbook: parsedOrderbook,
        openOrders: parsedOpenOrders,
        refresh: rawData.refresh, // Pass through the refresh function
        setFilterByTrader: rawData.setFilterByTrader, // Pass through the setFilterByTrader function
      });
    }
  }, [rawData, parseOrderbookData]);

  return (
    <OrderbookContext.Provider value={parsedData}>
      {children}
    </OrderbookContext.Provider>
  );
}

// Hook moved to src/hooks/useOrderbookContext.ts to fix React Fast Refresh warning
