import { useContext } from "react";
import { GlobalTradesCacheContext } from "../contexts/global-trades-cache-context";
import type { GlobalTradesCacheContextType } from "../lib/shared-types";

export function useGlobalTradesCache(): GlobalTradesCacheContextType {
  const context = useContext(GlobalTradesCacheContext);
  if (!context) {
    throw new Error("useGlobalTradesCache must be used within a GlobalTradesCacheProvider");
  }
  return context;
}
