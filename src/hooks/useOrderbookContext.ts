import { useContext } from "react";
import { OrderbookContext, type OrderbookContextType } from "../contexts/orderbook-context";

export function useOrderbookContext(): OrderbookContextType {
  const context = useContext(OrderbookContext);
  if (context === undefined) {
    throw new Error(
      "useOrderbookContext must be used within an OrderbookProvider",
    );
  }
  return context;
}
