import { createContext } from "react";
import { OrderbookEntry } from "../protos/gen/arborter_pb";

export interface OrderbookContextType {
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
  setFilterByTrader: (trader: string | undefined) => void;
}

export const OrderbookContext = createContext<OrderbookContextType | undefined>(
  undefined,
);
