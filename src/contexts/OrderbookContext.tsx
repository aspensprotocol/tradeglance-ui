import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSharedOrderbookData } from "../hooks/useSharedOrderbookData";
import { OrderbookData } from "../hooks/useSharedOrderbookData";
import { OrderbookEntry } from "../protos/gen/arborter_pb";
import { weiToDecimal } from "../lib/number-utils";
import { useTradingPairs } from "../hooks/useTradingPairs";

interface OrderbookContextType {
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdate: Date;
}

const OrderbookContext = createContext<OrderbookContextType | undefined>(
  undefined,
);

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
  // Get trading pairs to extract token decimals
  const { tradingPairs } = useTradingPairs();

  // Find the current trading pair to get token decimals
  const currentTradingPair = tradingPairs.find((pair) => pair.id === marketId);

  // Extract token decimals from the trading pair
  const baseTokenDecimals = currentTradingPair?.baseChainTokenDecimals || 18;
  const quoteTokenDecimals = currentTradingPair?.quoteChainTokenDecimals || 18;

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
  });

  // Parse the raw data with proper decimals
  const parseOrderbookData = useCallback(
    (entries: OrderbookEntry[]): OrderbookEntry[] => {
      if (!entries || entries.length === 0) return [];

      return entries.map((entry) => {
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

        // Create a new entry with properly formatted values
        return {
          ...entry,
          price: priceDecimal,
          quantity: quantityDecimal,
        };
      });
    },
    [baseTokenDecimals, quoteTokenDecimals],
  );

  // Update parsed data when raw data changes
  useEffect(() => {
    if (rawData.orderbook && rawData.openOrders) {
      const parsedOrderbook = {
        ...rawData.orderbook,
        bids: parseOrderbookData(rawData.orderbook.bids),
        asks: parseOrderbookData(rawData.orderbook.asks),
      };

      const parsedOpenOrders = parseOrderbookData(rawData.openOrders);

      setParsedData({
        ...rawData,
        orderbook: parsedOrderbook,
        openOrders: parsedOpenOrders,
        refresh: rawData.refresh, // Pass through the refresh function
      });
    }
  }, [rawData, parseOrderbookData]);

  return (
    <OrderbookContext.Provider value={parsedData}>
      {children}
    </OrderbookContext.Provider>
  );
}

export function useOrderbookContext(): OrderbookContextType {
  const context = useContext(OrderbookContext);
  if (context === undefined) {
    throw new Error(
      "useOrderbookContext must be used within an OrderbookProvider",
    );
  }
  return context;
}
