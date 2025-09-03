/**
 * Shared types used across the application
 * This file consolidates all types to avoid duplication and ensure consistency
 */

import type {
  OrderbookEntry,
  Trade,
  Order,
  Side,
  OrderStatus,
  ExecutionType,
  TradeRole,
} from "../protos/gen/arborter_pb";

import type {
  Chain,
  Market,
  Token,
  Configuration,
  BaseOrQuote,
} from "../protos/gen/arborter_config_pb";

// Re-export proto types for convenience
export type {
  OrderbookEntry,
  Trade,
  Order,
  Side,
  OrderStatus,
  ExecutionType,
  TradeRole,
  Chain,
  Market,
  Token,
  Configuration,
  BaseOrQuote,
};

// Consolidated orderbook data interface using proto types
export interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spread: number;
  spreadPercentage: number;
  lastUpdate: Date;
}

// Consolidated shared orderbook data interface
export interface SharedOrderbookData {
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  lastUpdate: Date;
}

// Consolidated recent trade interface using proto types
export interface RecentTrade {
  id: string;
  side: string;
  price: number;
  quantity: number;
  timestamp: Date;
  trader: string; // For backwards compatibility - will contain maker address
  makerAddress: string;
  takerAddress: string;
  marketId: string;
  // Add proper address fields for each chain
  makerBaseAddress?: string;
  makerQuoteAddress?: string;
  takerBaseAddress?: string;
  takerQuoteAddress?: string;
}

// Trading pair interface using proto types
export interface TradingPair {
  id: string;
  displayName: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseChainNetwork: string;
  quoteChainNetwork: string;
  baseChainTokenAddress: string;
  quoteChainTokenAddress: string;
  baseChainTokenDecimals: number;
  quoteChainTokenDecimals: number;
  pairDecimals: number;
  baseChainId: number;
  quoteChainId: number;
}

// Order creation data interface
export interface OrderCreationData {
  side: Side;
  quantity: string;
  price?: string;
  marketId: string;
  baseAccountAddress: string;
  quoteAccountAddress: string;
  executionType: ExecutionType;
  matchingOrderIds?: number[];
}

// Market orderbook data interface
export interface MarketOrderbookData {
  marketId: string;
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  lastUpdate: Date;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Cached orderbook data interface
export interface CachedOrderbookData {
  marketId: string;
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  lastUpdate: Date;
  filterByTrader?: string; // Optional field to track if data was filtered by trader
}

// Cached trades data interface
export interface CachedTradesData {
  marketId: string;
  trades: RecentTrade[];
  lastUpdate: Date;
  filterByTrader?: string;
}

// Shared trades data interface
export interface SharedTradesData {
  trades: RecentTrade[];
  lastUpdate: Date;
}

// Global orderbook cache context type
export interface GlobalOrderbookCacheContextType {
  getCachedData: (
    marketId: string,
    filterByTrader?: string,
  ) => CachedOrderbookData | null;
  setCachedData: (
    marketId: string,
    data: SharedOrderbookData,
    filterByTrader?: string,
  ) => void;
  clearCache: (marketId?: string, filterByTrader?: string) => void;
  isDataStale: (
    marketId: string,
    maxAgeMs?: number,
    filterByTrader?: string,
  ) => boolean;
  getCacheStats: () => {
    totalEntries: number;
    keys: string[];
    entries: {
      key: string;
      marketId: string;
      filterByTrader?: string;
      hasOrderbook: boolean;
      orderbookBids: number;
      orderbookAsks: number;
      hasOpenOrders: boolean;
      openOrdersCount: number;
      lastUpdate: string;
      ageMs: number;
    }[];
  };
  shouldClearCache: (marketId: string, filterByTrader?: string) => boolean;
}

// Global trades cache context type
export interface GlobalTradesCacheContextType {
  getCachedData: (
    marketId: string,
    filterByTrader?: string,
  ) => CachedTradesData | null;
  setCachedData: (
    marketId: string,
    data: SharedTradesData,
    filterByTrader?: string,
  ) => void;
  clearCache: (marketId?: string, filterByTrader?: string) => void;
  isDataStale: (
    marketId: string,
    maxAgeMs?: number,
    filterByTrader?: string,
  ) => boolean;
  getCacheStats: () => {
    totalEntries: number;
    keys: string[];
    entries: {
      key: string;
      marketId: string;
      filterByTrader?: string;
      hasTradesData: boolean;
      tradesCount: number;
      lastUpdate: string;
      ageMs: number;
    }[];
  };
  shouldClearCache: (marketId: string, filterByTrader?: string) => boolean;
}

// Orderbook context type
export interface OrderbookContextType {
  orderbook: OrderbookData;
  openOrders: OrderbookEntry[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdate: Date;
  setFilterByTrader: (trader: string | undefined) => void;
}

// Provider props interfaces
export interface OrderbookProviderProps {
  children: React.ReactNode;
  marketId: string;
  filterByTrader?: string;
}

export interface GlobalOrderbookCacheProviderProps {
  children: React.ReactNode;
}

// Component props interfaces
export interface VerticalOrderBookProps {
  tradingPair?: TradingPair;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
  maxOrders?: number; // Optional override for max orders to display
}

export interface TradeFormProps {
  tradingPair?: TradingPair;
  onOrderSubmitted?: () => void;
  onTradingSideChange?: (side: BaseOrQuote.BASE | BaseOrQuote.QUOTE) => void;
}

// View context types
export interface ViewContextType {
  viewMode: "simple" | "pro";
  setViewMode: (mode: "simple" | "pro") => void;
}

export interface ViewProviderProps {
  children: React.ReactNode;
}

// Balance types
export interface TokenBalance {
  tokenAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
  chainId: number;
}

export interface ChainBalance {
  chainId: number;
  chainName: string;
  tokens: TokenBalance[];
}

// Network management types
export interface NetworkConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
