import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createClient, ConnectError } from "@connectrpc/connect";
import { create } from "@bufbuild/protobuf";
import { handleApiError } from "./error-handling";
import { createLogger } from "./logger";

// Import ALL protobuf types from arborter_config_pb.ts
import {
  type AddChainRequest,
  AddChainRequestSchema,
  type AddChainResponse,
  AddChainResponseSchema,
  type AddMarketRequest,
  AddMarketRequestSchema,
  type AddMarketResponse,
  AddMarketResponseSchema,
  type AddTokenRequest,
  AddTokenRequestSchema,
  type AddTokenResponse,
  AddTokenResponseSchema,
  type Chain,
  ChainSchema,
  ConfigService,
  type Configuration,
  ConfigurationSchema,
  type DeleteChainRequest,
  DeleteChainRequestSchema,
  type DeleteChainResponse,
  DeleteChainResponseSchema,
  type DeleteMarketRequest,
  DeleteMarketRequestSchema,
  type DeleteMarketResponse,
  DeleteMarketResponseSchema,
  type DeleteTokenRequest,
  DeleteTokenRequestSchema,
  type DeleteTokenResponse,
  DeleteTokenResponseSchema,
  type DeleteTradeContractRequest,
  DeleteTradeContractRequestSchema,
  type DeleteTradeContractResponse,
  DeleteTradeContractResponseSchema,
  type DeployContractRequest,
  DeployContractRequestSchema,
  type DeployContractResponse,
  DeployContractResponseSchema,
  type Empty,
  EmptySchema,
  type GetConfigRequest,
  GetConfigRequestSchema,
  type GetConfigResponse,
  GetConfigResponseSchema,
  type Market,
  MarketSchema,
  type Token,
  TokenSchema,
  type VersionInfo,
  VersionInfoSchema,
} from "../protos/gen/arborter_config_pb";

// Import ALL protobuf types from arborter_pb.ts
import type {
  ExecutionType,
  OrderStatus,
  Side,
  TradeRole} from "../protos/gen/arborter_pb";
import {
  type AddOrderbookRequest,
  AddOrderbookRequestSchema,
  type AddOrderbookResponse,
  AddOrderbookResponseSchema,
  ArborterService,
  type CancelOrderRequest,
  CancelOrderRequestSchema,
  type CancelOrderResponse,
  CancelOrderResponseSchema,
  type Order,
  OrderSchema,
  type OrderToCancel,
  OrderToCancelSchema,
  type OrderbookEntry,
  OrderbookEntrySchema,
  type OrderbookRequest,
  OrderbookRequestSchema,
  type RemoveOrderbookRequest,
  RemoveOrderbookRequestSchema,
  type RemoveOrderbookResponse,
  RemoveOrderbookResponseSchema,
  type SendOrderRequest,
  SendOrderRequestSchema,
  type SendOrderResponse,
  SendOrderResponseSchema,
  type Trade,
  type TradeRequest,
  TradeRequestSchema,
  TradeSchema,
  type UnNormalizeDecimalsRequest,
  UnNormalizeDecimalsRequestSchema,
  type UnNormalizeDecimalsResponse,
  UnNormalizeDecimalsResponseSchema,
} from "../protos/gen/arborter_pb";

// Create a logger for gRPC operations
const logger = createLogger('gRPC');

// Create the gRPC-Web transport for unary calls
const transport = createGrpcWebTransport({
  baseUrl: import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
});

logger.info(`Transport created with baseUrl: ${import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api"}`);
logger.debug("Environment variables:", {
  VITE_GRPC_WEB_PROXY_URL: import.meta.env.VITE_GRPC_WEB_PROXY_URL,
  BASE_URL: import.meta.env.BASE_URL,
});
logger.debug("Transport object:", transport);
logger.debug("Current URL:", window.location.href);
logger.debug("Current origin:", window.location.origin);

// Create the gRPC clients
export const arborterClient = createClient(ArborterService, transport);
export const configClient = createClient(ConfigService, transport);

logger.info("Clients created successfully");
logger.debug("Client details:", {
  hasArborterClient: !!arborterClient,
  hasConfigClient: !!configClient,
  arborterServiceMethods: Object.keys(ArborterService.methods || {}),
  configServiceMethods: Object.keys(ConfigService.methods || {}),
});

// Configuration service
export const configService = {
  // Get configuration
  async getConfig(): Promise<GetConfigResponse> {
    try {
      console.log("🔧 configService.getConfig called");
      console.log("🔧 gRPC: Creating GetConfigRequest...");
      const request: GetConfigRequest = create(GetConfigRequestSchema, {});
      console.log("🔧 gRPC: Request created:", request);

      console.log("🔧 gRPC: Calling configClient.getConfig...");
      console.log(
        "🔧 gRPC: Transport created with baseUrl:",
        import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
      );
      console.log(
        "🔧 gRPC: ConfigService methods:",
        Object.keys(ConfigService.methods),
      );

      const response: GetConfigResponse = await configClient.getConfig(request);
      console.log("🔧 gRPC: Response received:", response);
      return response;
    } catch (error: unknown) {
      console.error("❌ gRPC: Failed to get config:", error);
      console.error("❌ gRPC: Error type:", typeof error);
      console.error(
        "❌ gRPC: Error constructor:",
        error instanceof Error ? error.constructor.name : "Unknown",
      );
      console.error(
        "❌ gRPC: Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      throw error;
    }
  },

  // Get version info
  async getVersion(): Promise<VersionInfo> {
    try {
      const request: Empty = create(EmptySchema, {});
      const response: VersionInfo = await configClient.getVersion(request);
      return response;
    } catch (error) {
      console.error("Failed to get version:", error);
      throw error;
    }
  },

  // Deploy contract
  async deployContract(
    chainNetwork: string,
    baseOrQuote: string,
  ): Promise<DeployContractResponse> {
    try {
      const request: DeployContractRequest = create(
        DeployContractRequestSchema,
        {
          chainNetwork,
          baseOrQuote,
        },
      );
      const response: DeployContractResponse =
        await configClient.deployContract(request);
      return response;
    } catch (error) {
      console.error("Failed to deploy contract:", error);
      throw error;
    }
  },

  // Add chain
  async addChain(chain: Chain): Promise<AddChainResponse> {
    try {
      const request: AddChainRequest = create(AddChainRequestSchema, { chain });
      const response: AddChainResponse = await configClient.addChain(request);
      return response;
    } catch (error) {
      console.error("Failed to add chain:", error);
      throw error;
    }
  },

  // Add token
  async addToken(
    chainNetwork: string,
    token: Token,
  ): Promise<AddTokenResponse> {
    try {
      const request: AddTokenRequest = create(AddTokenRequestSchema, {
        chainNetwork,
        token,
      });
      const response: AddTokenResponse = await configClient.addToken(request);
      return response;
    } catch (error) {
      console.error("Failed to add token:", error);
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
      const request: AddMarketRequest = create(AddMarketRequestSchema, {
        baseChainNetwork: marketData.baseChainNetwork,
        quoteChainNetwork: marketData.quoteChainNetwork,
        baseChainTokenSymbol: marketData.baseChainTokenSymbol,
        quoteChainTokenSymbol: marketData.quoteChainTokenSymbol,
        baseChainTokenAddress: marketData.baseChainTokenAddress,
        quoteChainTokenAddress: marketData.quoteChainTokenAddress,
        baseChainTokenDecimals: marketData.baseChainTokenDecimals,
        quoteChainTokenDecimals: marketData.quoteChainTokenDecimals,
        pairDecimals: marketData.pairDecimals,
      });
      const response: AddMarketResponse = await configClient.addMarket(request);
      return response;
    } catch (error) {
      console.error("Failed to add market:", error);
      throw error;
    }
  },

  // Delete market
  async deleteMarket(marketId: string): Promise<DeleteMarketResponse> {
    try {
      const request: DeleteMarketRequest = create(DeleteMarketRequestSchema, {
        marketId,
      });
      const response: DeleteMarketResponse =
        await configClient.deleteMarket(request);
      return response;
    } catch (error) {
      console.error("Failed to delete market:", error);
      throw error;
    }
  },

  // Delete token
  async deleteToken(
    chainNetwork: string,
    tokenSymbol: string,
  ): Promise<DeleteTokenResponse> {
    try {
      const request: DeleteTokenRequest = create(DeleteTokenRequestSchema, {
        chainNetwork,
        tokenSymbol,
      });
      const response: DeleteTokenResponse =
        await configClient.deleteToken(request);
      return response;
    } catch (error) {
      console.error("Failed to delete token:", error);
      throw error;
    }
  },

  // Delete chain
  async deleteChain(chainNetwork: string): Promise<DeleteChainResponse> {
    try {
      const request: DeleteChainRequest = create(DeleteChainRequestSchema, {
        chainNetwork,
      });
      const response: DeleteChainResponse =
        await configClient.deleteChain(request);
      return response;
    } catch (error) {
      console.error("Failed to delete chain:", error);
      throw error;
    }
  },

  // Delete trade contract
  async deleteTradeContract(
    chainId: number,
  ): Promise<DeleteTradeContractResponse> {
    try {
      const request: DeleteTradeContractRequest = create(
        DeleteTradeContractRequestSchema,
        { chainId },
      );
      const response: DeleteTradeContractResponse =
        await configClient.deleteTradeContract(request);
      return response;
    } catch (error) {
      console.error("Failed to delete trade contract:", error);
      throw error;
    }
  },
};

// Arborter Service functions using the generated client - ALL types explicitly declared
export const arborterService = {
  // Send order
  async sendOrder(
    order: Order,
    signatureHash: Uint8Array,
  ): Promise<SendOrderResponse> {
    try {
      const request: SendOrderRequest = create(SendOrderRequestSchema, {
        order,
        signatureHash,
      });

      const response: SendOrderResponse =
        await arborterClient.sendOrder(request);
      return response;
    } catch (error) {
      console.error("Error sending order:", error);
      throw error;
    }
  },

  // Cancel order
  async cancelOrder(
    order: OrderToCancel,
    signatureHash: Uint8Array,
  ): Promise<CancelOrderResponse> {
    try {
      const request: CancelOrderRequest = create(CancelOrderRequestSchema, {
        order,
        signatureHash,
      });

      const response: CancelOrderResponse =
        await arborterClient.cancelOrder(request);
      return response;
    } catch (error) {
      console.error("Error canceling order:", error);
      throw error;
    }
  },

  // Get orderbook - optimized for speed with improved error handling
  async getOrderbook(
    marketId: string,
    continueStream = true, // Changed default to true for continuous streaming
    historicalOpenOrders?: boolean,
    filterByTrader?: string,
  ): Promise<OrderbookEntry[]> {
    const orderbookLogger = createLogger('Orderbook');
    try {
      orderbookLogger.info(`Getting orderbook for market: ${marketId}`);
      orderbookLogger.debug("Request parameters:", {
        marketId,
        marketIdType: typeof marketId,
        marketIdTruthy: !!marketId,
        continueStream,
        historicalOpenOrders,
        filterByTrader,
        transportBaseUrl: import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
      });

      const request: OrderbookRequest = create(OrderbookRequestSchema, {
        marketId,
        continueStream,
        historicalOpenOrders,
        filterByTrader,
      });

      orderbookLogger.debug("Request created:", {
        requestKeys: Object.keys(request),
        requestValues: {
          marketId: request.marketId,
          continueStream: request.continueStream,
          historicalOpenOrders: request.historicalOpenOrders,
          filterByTrader: request.filterByTrader,
        },
      });

      orderbookLogger.info("Calling orderbook API...");
      
      // Create a timeout promise to handle connection issues
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Orderbook request timed out after 15 seconds"));
        }, 15000);
      });
      
      // Race the actual request against the timeout
      const response = await Promise.race([
        arborterClient.orderbook(request),
        timeoutPromise
      ]);
      
      console.log("📡 arborterClient.orderbook response received:", {
        hasResponse: !!response,
        responseType: typeof response,
        isAsyncIterable:
          response && typeof response[Symbol.asyncIterator] === "function",
      });

      const entries: OrderbookEntry[] = [];

      // Proper streaming with error handling
      try {
        console.log("🔄 Starting to iterate over orderbook stream...");
        let entryCount = 0;
        
        for await (const entry of response) {
          // Only log every 10th entry to reduce console spam
          if (entryCount % 10 === 0) {
            console.log(`🔍 Orderbook Entry ${entryCount + 1} received`);
          }
          
          entries.push(entry);
          entryCount++;

          if (entryCount % 50 === 0) {
            console.log(`📊 Processed ${entryCount} orderbook entries...`);
          }
        }

        console.log(
          `✅ Orderbook: Stream completed, returning ${entries.length} entries`,
        );
        return entries;
      } catch (streamError) {
        console.warn(
          "⚠️ Orderbook stream error, returning collected data:",
          streamError,
        );
        
        // Handle specific gRPC errors
        if (streamError instanceof ConnectError) {
          handleApiError(streamError, "Orderbook Stream", async () => {
            await this.getOrderbook(marketId, continueStream, historicalOpenOrders, filterByTrader);
          });
        }
        
        if (entries.length > 0) {
          console.log(
            `⚡ Returning ${entries.length} collected orderbook entries despite error`,
          );
          return entries;
        }
        // No data collected, return empty array
        return [];
      }
    } catch (error) {
      // Use our centralized error handling
      handleApiError(error, "Orderbook API", async () => {
        await this.getOrderbook(marketId, continueStream, historicalOpenOrders, filterByTrader);
      });
      
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  // Get trades - optimized for speed
  async getTrades(
    marketId: string,
    continueStream = true, // Changed default to true for continuous streaming
    historicalClosedTrades?: boolean,
    filterByTrader?: string,
  ): Promise<Trade[]> {
    try {
      console.log("🚀 arborterService.getTrades called:", {
        marketId,
        marketIdType: typeof marketId,
        marketIdTruthy: !!marketId,
        continueStream,
        historicalClosedTrades,
        filterByTrader,
        transportBaseUrl: import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
      });

      const request: TradeRequest = create(TradeRequestSchema, {
        marketId,
        continueStream,
        historicalClosedTrades,
        filterByTrader,
      });

      console.log("📤 TradeRequest created:", {
        requestKeys: Object.keys(request),
        requestValues: {
          marketId: request.marketId,
          continueStream: request.continueStream,
          historicalClosedTrades: request.historicalClosedTrades,
          filterByTrader: request.filterByTrader,
        },
      });

      console.log("🚀 Fetching trades for market:", marketId);
      const response = await arborterClient.trades(request);
      console.log("📡 arborterClient.trades response received:", {
        hasResponse: !!response,
        responseType: typeof response,
        isAsyncIterable:
          response && typeof response[Symbol.asyncIterator] === "function",
      });

      const trades: Trade[] = [];

      // Proper streaming without aggressive timeouts
      try {
        console.log("🔄 Starting to iterate over trades stream...");
        let tradeCount = 0;

        for await (const trade of response) {
          // CRITICAL DEBUGGING: Log every single trade as it comes in
          console.log(`🔍 Trade Entry ${tradeCount + 1}:`, {
            tradeId: tradeCount + 1,
            hasTrade: !!trade,
            tradeType: typeof trade,
            tradeKeys: trade ? Object.keys(trade) : [],
            price: trade?.price,
            qty: trade?.qty,
            timestamp: trade?.timestamp,
            makerId: trade?.makerId,
            takerId: trade?.takerId,
            priceType: typeof trade?.price,
            qtyType: typeof trade?.qty,
            priceLength: typeof trade?.price === 'string' ? trade?.price.length : 'N/A',
            qtyLength: typeof trade?.qty === 'string' ? trade?.qty.length : 'N/A',
            priceValue: trade?.price,
            qtyValue: trade?.qty,
            rawTrade: trade,
          });
          
          trades.push(trade);
          tradeCount++;

          if (tradeCount % 5 === 0) {
            console.log(`📊 Processed ${tradeCount} trades...`);
          }
        }

        console.log(
          `✅ Trades: Stream completed, returning ${trades.length} trades`,
        );
        return trades;
      } catch (streamError) {
        console.warn(
          "⚠️ Trades stream error, returning collected data:",
          streamError,
        );
        if (trades.length > 0) {
          console.log(
            `⚡ Returning ${trades.length} collected trades despite error`,
          );
          return trades;
        }
        // No data collected, return empty array
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to fetch trades:", error);
      console.error("❌ Error details:", {
        errorType: typeof error,
        errorConstructor:
          error instanceof Error ? error.constructor.name : "Unknown",
        errorMessage: error instanceof Error ? error.message : "No message",
        errorStack: error instanceof Error ? error.stack : "No stack",
      });
      throw error;
    }
  },

  // Add orderbook
  async addOrderbook(
    marketId: string,
    decimalPlaces: number,
  ): Promise<AddOrderbookResponse> {
    try {
      const request: AddOrderbookRequest = create(AddOrderbookRequestSchema, {
        marketId,
        decimalPlaces,
      });

      const response: AddOrderbookResponse =
        await arborterClient.addOrderbook(request);
      return response;
    } catch (error) {
      console.error("Error adding orderbook:", error);
      throw error;
    }
  },

  // Remove orderbook
  async removeOrderbook(marketId: string): Promise<RemoveOrderbookResponse> {
    try {
      const request: RemoveOrderbookRequest = create(
        RemoveOrderbookRequestSchema,
        {
          marketId,
        },
      );

      const response: RemoveOrderbookResponse =
        await arborterClient.removeOrderbook(request);
      return response;
    } catch (error) {
      console.error("Error removing orderbook:", error);
      throw error;
    }
  },

  // Unnormalize decimals
  async unnormalizeDecimals(
    marketId: string,
    side: string,
    quantity: string,
    price?: string,
  ): Promise<UnNormalizeDecimalsResponse> {
    try {
      const request: UnNormalizeDecimalsRequest = create(
        UnNormalizeDecimalsRequestSchema,
        {
          marketId,
          side,
          quantity,
          price,
        },
      );

      const response: UnNormalizeDecimalsResponse =
        await arborterClient.unNormalizeDecimals(request);
      return response;
    } catch (error) {
      console.error("Error unnormalizing decimals:", error);
      throw error;
    }
  },

  // Real-time orderbook streaming for live updates
  async *streamOrderbookRealtime(
    marketId: string,
    continueStream = false,
    historicalOpenOrders?: boolean,
    filterByTrader?: string,
  ): AsyncGenerator<OrderbookEntry[], void, unknown> {
    try {
      const request: OrderbookRequest = create(OrderbookRequestSchema, {
        marketId,
        continueStream,
        historicalOpenOrders,
        filterByTrader,
      });
      console.log(
        "🚀 Starting real-time orderbook stream for market:",
        marketId,
      );

      const response = await arborterClient.orderbook(request);
      const entries: OrderbookEntry[] = [];
      let hasYieldedData = false;

      for await (const entry of response) {
        entries.push(entry);

        // Yield data in smaller batches for immediate display
        if (entries.length % 5 === 0) {
          yield [...entries];
          hasYieldedData = true;
        }

        // Limit to prevent memory issues
        if (entries.length >= 200) {
          console.log(
            `⚡ Orderbook: Reached limit, stopping stream at ${entries.length} entries`,
          );
          break;
        }
      }

      // Yield final batch if we have data
      if (entries.length > 0) {
        yield [...entries];
        hasYieldedData = true;
      }

      // If no data was yielded, yield empty array to indicate completion
      if (!hasYieldedData) {
        console.log("📭 Orderbook: No data in stream, yielding empty array");
        yield [];
      }
    } catch (error) {
      console.error("❌ Orderbook real-time stream error:", error);
      // Yield empty array on error to prevent UI from hanging
      yield [];
    }
  },

  // Real-time trades streaming for live updates
  async *streamTradesRealtime(
    marketId: string,
    continueStream = false,
    historicalClosedTrades?: boolean,
    filterByTrader?: string,
  ): AsyncGenerator<Trade[], void, unknown> {
    try {
      const request: TradeRequest = create(TradeRequestSchema, {
        marketId,
        continueStream,
        historicalClosedTrades,
        filterByTrader,
      });
      console.log("🚀 Starting real-time trades stream for market:", marketId);

      const response = await arborterClient.trades(request);
      const trades: Trade[] = [];
      let hasYieldedData = false;

      for await (const trade of response) {
        trades.push(trade);

        // Yield data in smaller batches for immediate display
        if (trades.length % 3 === 0) {
          yield [...trades];
          hasYieldedData = true;
        }

        // Limit to prevent memory issues
        if (trades.length >= 100) {
          console.log(
            `⚡ Trades: Reached limit, stopping stream at ${trades.length} trades`,
          );
          break;
        }
      }

      // Yield final batch if we have data
      if (trades.length > 0) {
        yield [...trades];
        hasYieldedData = true;
      }

      // If no data was yielded, yield empty array to indicate completion
      if (!hasYieldedData) {
        console.log("📭 Trades: No data in stream, yielding empty array");
        yield [];
      }
    } catch (error) {
      console.error("❌ Trades real-time stream error:", error);
      // Yield empty array on error to prevent UI from hanging
      yield [];
    }
  },
};

// Export ALL the generated types for use in other parts of the application
export type {
  // Config types
  Configuration,
  Chain,
  Market,
  Token,
  DeployContractRequest,
  DeployContractResponse,
  AddChainRequest,
  AddChainResponse,
  AddTokenRequest,
  AddTokenResponse,
  AddMarketRequest,
  AddMarketResponse,
  DeleteMarketRequest,
  DeleteMarketResponse,
  DeleteTokenRequest,
  DeleteTokenResponse,
  DeleteChainRequest,
  DeleteChainResponse,
  DeleteTradeContractRequest,
  DeleteTradeContractResponse,
  Empty,
  VersionInfo,
  GetConfigRequest,
  GetConfigResponse,

  // Arborter types
  OrderbookEntry,
  Trade,
  Order,
  OrderToCancel,
  SendOrderResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  AddOrderbookRequest,
  AddOrderbookResponse,
  RemoveOrderbookRequest,
  RemoveOrderbookResponse,
  UnNormalizeDecimalsRequest,
  UnNormalizeDecimalsResponse,
  SendOrderRequest,
  OrderbookRequest,
  TradeRequest,

  // Enums
  Side,
  ExecutionType,
  OrderStatus,
  TradeRole,
};

// Export the schemas for creating instances
export {
  // Config schemas
  ConfigurationSchema,
  ChainSchema,
  MarketSchema,
  TokenSchema,
  DeployContractRequestSchema,
  DeployContractResponseSchema,
  AddChainRequestSchema,
  AddChainResponseSchema,
  AddTokenRequestSchema,
  AddTokenResponseSchema,
  AddMarketRequestSchema,
  AddMarketResponseSchema,
  DeleteMarketRequestSchema,
  DeleteMarketResponseSchema,
  DeleteTokenRequestSchema,
  DeleteTokenResponseSchema,
  DeleteChainRequestSchema,
  DeleteChainResponseSchema,
  DeleteTradeContractRequestSchema,
  DeleteTradeContractResponseSchema,
  EmptySchema,
  VersionInfoSchema,
  GetConfigRequestSchema,
  GetConfigResponseSchema,

  // Arborter schemas
  OrderbookEntrySchema,
  TradeSchema,
  OrderSchema,
  OrderToCancelSchema,
  SendOrderResponseSchema,
  CancelOrderRequestSchema,
  CancelOrderResponseSchema,
  AddOrderbookRequestSchema,
  AddOrderbookResponseSchema,
  RemoveOrderbookRequestSchema,
  RemoveOrderbookResponseSchema,
  UnNormalizeDecimalsRequestSchema,
  UnNormalizeDecimalsResponseSchema,
  SendOrderRequestSchema,
  OrderbookRequestSchema,
  TradeRequestSchema,
};
