import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { create } from "@bufbuild/protobuf";
import { OrderData } from "./signing-utils";

// Interface for cancel order data
interface CancelOrderData {
  marketId: string;
  side: number;
  tokenAddress: string;
  orderId: number;
}
import { 
  ArborterService,
  SendOrderRequestSchema,
  SendOrderResponseSchema,
  CancelOrderRequestSchema,
  CancelOrderResponseSchema,
  OrderbookRequestSchema,
  OrderbookEntrySchema,
  TradeRequestSchema,
  TradeSchema,
  AddOrderbookRequestSchema,
  AddOrderbookResponseSchema,
  RemoveOrderbookRequestSchema,
  RemoveOrderbookResponseSchema,
  UnNormalizeDecimalsRequestSchema,
  UnNormalizeDecimalsResponseSchema,
  OrderSchema,
  Side,
  ExecutionType,
  OrderToCancelSchema,
  type OrderbookEntry,
  type Trade,
  type Order,
  type OrderToCancel,
  type SendOrderResponse,
  type CancelOrderRequest,
  type CancelOrderResponse,
  type AddOrderbookRequest,
  type AddOrderbookResponse,
  type RemoveOrderbookRequest,
  type RemoveOrderbookResponse,
  type UnNormalizeDecimalsRequest,
  type UnNormalizeDecimalsResponse,
  OrderStatus,
  TradeRole
} from "../protos/gen/arborter_pb";
import {
  ConfigService,
  GetConfigRequestSchema,
  GetConfigResponseSchema,
  ConfigurationSchema,
  ChainSchema,
  MarketSchema,
  TokenSchema,
  DeployContractRequestSchema,
  DeployContractResponse,
  AddChainRequestSchema,
  AddChainResponse,
  AddTokenRequestSchema,
  AddTokenResponse,
  AddMarketRequestSchema,
  AddMarketResponse,
  type Configuration,
  type Chain,
  type Market,
  type Token
} from "../protos/gen/arborter_config_pb";

// Response interfaces for backward compatibility - using proper protobuf types
export interface OrderbookResponse {
  data: OrderbookEntry[];
  error?: string;
}

export interface TradeResponse {
  success: boolean;
  data: Trade[];
  error?: string;
}

export interface OrderResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ConfigResponse {
  config: Configuration;
  error?: string;
}

// Create the gRPC-Web transport for unary calls
const transport = createGrpcWebTransport({
  baseUrl: import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
});

// Create clients using the generated service definitions
export const arborterClient = createClient(ArborterService, transport);
export const configClient = createClient(ConfigService, transport);

// Helper function to convert Order to protobuf Order
export function createOrderFromData(orderData: {
  side: number; // Numeric: 1 = BID (buy), 2 = ASK (sell)
  quantity: string;
  price?: string;
  marketId: string;
  baseAccountAddress: string;
  quoteAccountAddress: string;
  executionType: number; // Numeric: 0 = UNSPECIFIED, 1 = DISCRETIONARY
  matchingOrderIds: number[];
}): Order {
  return create(OrderSchema, {
    side: orderData.side, // Pass the numeric value directly
    quantity: orderData.quantity,
    price: orderData.price,
    marketId: orderData.marketId,
    baseAccountAddress: orderData.baseAccountAddress,
    quoteAccountAddress: orderData.quoteAccountAddress,
    executionType: orderData.executionType, // Pass the numeric value directly
    matchingOrderIds: orderData.matchingOrderIds.map(id => BigInt(id))
  });
}

// Helper function to convert OrderToCancel to protobuf OrderToCancel
export function createOrderToCancelFromData(cancelData: {
  marketId: string;
  side: number; // Numeric: 1 = BID (buy), 2 = ASK (sell)
  tokenAddress: string;
  orderId: number;
}): OrderToCancel {
  return create(OrderToCancelSchema, {
    marketId: cancelData.marketId,
    side: cancelData.side, // Pass the numeric value directly
    tokenAddress: cancelData.tokenAddress,
    orderId: BigInt(cancelData.orderId)
  });
}

// Arborter Service functions using the generated client
export const arborterService = {
  // Send order
  async sendOrder(order: OrderData, signatureHash: Uint8Array): Promise<SendOrderResponse> {
    try {
      const orderMessage = createOrderFromData(order);
      const request = create(SendOrderRequestSchema, {
        order: orderMessage,
        signatureHash: signatureHash
      });
      
      const response = await arborterClient.sendOrder(request);
      return response;
    } catch (error) {
      console.error('Error sending order:', error);
      throw error;
    }
  },

  // Cancel order
  async cancelOrder(cancelData: CancelOrderData, signatureHash: Uint8Array): Promise<CancelOrderResponse> {
    try {
      const orderToCancel = createOrderToCancelFromData(cancelData);
      const request = create(CancelOrderRequestSchema, {
        order: orderToCancel,
        signatureHash: signatureHash
      });
      
      const response = await arborterClient.cancelOrder(request);
      return response;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  },

  // Add orderbook
  async addOrderbook(marketId: string, decimalPlaces: number): Promise<AddOrderbookResponse> {
    try {
      const request = create(AddOrderbookRequestSchema, {
        marketId: marketId,
        decimalPlaces: decimalPlaces
      });
      
      const response = await arborterClient.addOrderbook(request);
      return response;
    } catch (error) {
      console.error('Error adding orderbook:', error);
      throw error;
    }
  },

  // Remove orderbook
  async removeOrderbook(marketId: string): Promise<RemoveOrderbookResponse> {
    try {
      const request = create(RemoveOrderbookRequestSchema, {
        marketId: marketId
      });
      
      const response = await arborterClient.removeOrderbook(request);
      return response;
    } catch (error) {
      console.error('Error removing orderbook:', error);
      throw error;
    }
  },

  // Unnormalize decimals
  async unNormalizeDecimals(marketId: string, side: string, quantity: string, price: string): Promise<UnNormalizeDecimalsResponse> {
    try {
      const request = create(UnNormalizeDecimalsRequestSchema, {
        marketId: marketId,
        side: side,
        quantity: quantity,
        price: price
      });
      
      const response = await arborterClient.unNormalizeDecimals(request);
      return response;
    } catch (error) {
      console.error('Error unnormalizing decimals:', error);
      throw error;
    }
  },

  // Process orderbook stream (for backward compatibility)
  async processOrderbookStream(stream: ReadableStream<OrderbookEntry>): Promise<OrderbookResponse> {
    try {
      const reader = stream.getReader();
      const entries: OrderbookEntry[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        entries.push(value);
      }
      
      return { data: entries };
    } catch (error) {
      console.error('Error processing orderbook stream:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get orderbook snapshot - simple and fast
  async getOrderbookSnapshot(marketId: string, historicalOpenOrders: boolean = true, filterByTrader?: string): Promise<OrderbookEntry[]> {
    try {
      console.log('Getting orderbook snapshot for market:', marketId);
      
      const request = create(OrderbookRequestSchema, {
        continueStream: false, // Try to get snapshot, not stream
        marketId: marketId,
        historicalOpenOrders: historicalOpenOrders,
        filterByTrader: filterByTrader
      });
      
      // Get data with reasonable timeout
      const response = await arborterClient.orderbook(request);
      const entries: OrderbookEntry[] = [];
      
      try {
        // Collect data with reasonable timeout (10 seconds instead of 2)
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Orderbook snapshot timeout')), 10000)
        );
        
        const dataPromise = (async () => {
          for await (const entry of response) {
            entries.push(entry);
            // Stop after reasonable amount to prevent memory issues
            if (entries.length >= 1000) break;
          }
          return entries;
        })();
        
        // Race between data collection and timeout
        const result = await Promise.race([dataPromise, timeout]);
        console.log('Orderbook snapshot collected:', entries.length, 'entries');
        return result as OrderbookEntry[];
      } catch (streamError) {
        // If stream ends naturally or times out, return what we got
        if (entries.length > 0) {
          console.log('Stream ended/timeout, returning', entries.length, 'entries');
          return entries;
        }
        throw streamError;
      }
    } catch (error) {
      console.error('Error getting orderbook snapshot:', error);
      return [];
    }
  },

  // Get trades snapshot - simple and fast
  async getTradesSnapshot(marketId: string, historicalClosedTrades: boolean = true, filterByTrader?: string): Promise<Trade[]> {
    try {
      console.log('Getting trades snapshot for market:', marketId);
      
      const request = create(TradeRequestSchema, {
        continueStream: false, // Try to get snapshot, not stream
        marketId: marketId,
        historicalClosedTrades: historicalClosedTrades,
        filterByTrader: filterByTrader
      });
      
      // Get data with reasonable timeout
      const response = await arborterClient.trades(request);
      const trades: Trade[] = [];
      
      try {
        // Collect data with reasonable timeout (10 seconds instead of 2)
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Trades snapshot timeout')), 10000)
        );
        
        const dataPromise = (async () => {
          for await (const trade of response) {
            trades.push(trade);
            // Stop after reasonable amount to prevent memory issues
            if (trades.length >= 1000) break;
          }
          return trades;
        })();
        
        // Race between data collection and timeout
        const result = await Promise.race([dataPromise, timeout]);
        console.log('Trades snapshot collected:', trades.length, 'trades');
        return result as Trade[];
      } catch (streamError) {
        // If stream ends naturally or times out, return what we got
        if (trades.length > 0) {
          console.log('Stream ended/timeout, returning', trades.length, 'trades');
          return trades;
        }
        throw streamError;
      }
    } catch (error) {
      console.error('Error getting trades snapshot:', error);
      return [];
    }
  },

  // Legacy streaming functions - now return snapshots for compatibility
  async getOrderbookStream(marketId: string, historicalOpenOrders: boolean = true, filterByTrader?: string): Promise<OrderbookEntry[]> {
    console.warn('getOrderbookStream is deprecated, use getOrderbookSnapshot instead');
    return this.getOrderbookSnapshot(marketId, historicalOpenOrders, filterByTrader);
  },

  async getTradesStream(marketId: string, historicalClosedTrades: boolean = true, filterByTrader?: string): Promise<Trade[]> {
    console.warn('getTradesStream is deprecated, use getTradesSnapshot instead');
    return this.getTradesSnapshot(marketId, historicalClosedTrades, filterByTrader);
  }
};

// Config Service functions using the generated client
export const configService = {
  // Get configuration
  async getConfig(): Promise<ConfigResponse> {
    try {
      const request = create(GetConfigRequestSchema, {});
      const response = await configClient.getConfig(request);
      return { config: response.config!, error: undefined };
    } catch (error) {
      console.error('Error getting config:', error);
      return { 
        config: create(ConfigurationSchema, { chains: [], markets: [] }), 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Deploy contract
  async deployContract(chainNetwork: string, baseOrQuote: string): Promise<DeployContractResponse> {
    try {
      const request = create(DeployContractRequestSchema, {
        chainNetwork: chainNetwork,
        baseOrQuote: baseOrQuote
      });
      
      const response = await configClient.deployContract(request);
      return response;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  },

  // Add chain
  async addChain(chain: Chain): Promise<AddChainResponse> {
    try {
      const request = create(AddChainRequestSchema, { chain: chain });
      const response = await configClient.addChain(request);
      return response;
    } catch (error) {
      console.error('Error adding chain:', error);
      throw error;
    }
  },

  // Add token
  async addToken(chainNetwork: string, token: Token): Promise<AddTokenResponse> {
    try {
      const request = create(AddTokenRequestSchema, {
        chainNetwork: chainNetwork,
        token: token
      });
      
      const response = await configClient.addToken(request);
      return response;
    } catch (error) {
      console.error('Error adding token:', error);
      throw error;
    }
  },

  // Add market
  async addMarket(marketData: {
    baseChainNetwork: string;
    quoteChainNetwork: string;
    baseChainTokenSymbol: string;
    quoteChainTokenSymbol: string;
    baseChainTokenAddress: string;
    quoteChainTokenAddress: string;
    baseChainTokenDecimals: number;
    quoteChainTokenDecimals: number;
    pairDecimals: number;
  }): Promise<AddMarketResponse> {
    try {
      const request = create(AddMarketRequestSchema, {
        baseChainNetwork: marketData.baseChainNetwork,
        quoteChainNetwork: marketData.quoteChainNetwork,
        baseChainTokenSymbol: marketData.baseChainTokenSymbol,
        quoteChainTokenSymbol: marketData.quoteChainTokenSymbol,
        baseChainTokenAddress: marketData.baseChainTokenAddress,
        quoteChainTokenAddress: marketData.quoteChainTokenAddress,
        baseChainTokenDecimals: marketData.baseChainTokenDecimals,
        quoteChainTokenDecimals: marketData.quoteChainTokenDecimals,
        pairDecimals: marketData.pairDecimals
      });
      
      const response = await configClient.addMarket(request);
      return response;
    } catch (error) {
      console.error('Error adding market:', error);
      throw error;
    }
  }
};

// Export the generated types for use in other parts of the application
export type {
  OrderbookEntry,
  Trade,
  Order,
  OrderToCancel,
  SendOrderRequest,
  SendOrderResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  AddOrderbookRequest,
  AddOrderbookResponse,
  RemoveOrderbookRequest,
  RemoveOrderbookResponse,
  UnNormalizeDecimalsRequest,
  UnNormalizeDecimalsResponse,
  Side,
  ExecutionType,
  OrderStatus,
  TradeRole
} from "../protos/gen/arborter_pb";

export type {
  Configuration,
  Chain,
  Market,
  Token
} from "../protos/gen/arborter_config_pb";

// Utility functions for backward compatibility
export function isActiveOrderbookEntry(entry: OrderbookEntry): boolean {
  return entry.status === OrderStatus.ADDED || entry.status === OrderStatus.UPDATED;
}

export function getOrderbookSideString(side: Side): 'bid' | 'ask' {
  return side === Side.BID ? 'bid' : 'ask';
}



