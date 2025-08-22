import { createContext } from "react";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";

interface CachedOrderbookData {
  orderbook: {
    bids: OrderbookEntry[];
    asks: OrderbookEntry[];
    spread: number;
    spreadPercentage: number;
    lastUpdate: Date;
  };
  openOrders: OrderbookEntry[];
  lastUpdate: Date;
  marketId: string;
}

interface GlobalOrderbookCacheContextType {
  getCachedData: (marketId: string) => CachedOrderbookData | null;
  setCachedData: (marketId: string, data: Omit<CachedOrderbookData, 'marketId'>) => void;
  clearCache: (marketId?: string) => void;
  isDataStale: (marketId: string, maxAgeMs?: number) => boolean;
}

export const GlobalOrderbookCacheContext = createContext<GlobalOrderbookCacheContextType | null>(null);

export type { CachedOrderbookData, GlobalOrderbookCacheContextType };
