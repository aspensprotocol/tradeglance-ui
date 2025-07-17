import { useState, useEffect, useCallback } from 'react';
import { arborterService, configService, convertToPlainObject } from '../lib/grpc-client';

// Types for the hook responses
export interface GrpcResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface OrderData {
  side: 'bid' | 'ask';
  quantity: string;
  price?: string;
  marketId: string;
  baseAccountAddress: string;
  quoteAccountAddress: string;
  executionType: 'direct' | 'discretionary';
  matchingOrderIds?: number[];
}

export interface OrderbookEntry {
  timestamp: number;
  orderId: number;
  price: string;
  quantity: string;
  side: 'bid' | 'ask';
  makerBaseAddress: string;
  makerQuoteAddress: string;
  status: 'added' | 'updated' | 'removed';
  marketId: string;
}

export interface Trade {
  timestamp: number;
  price: string;
  qty: string;
  maker: string;
  taker: string;
  makerBaseAddress: string;
  makerQuoteAddress: string;
  buyer: string;
  seller: string;
  orderHit: number;
}

export interface Configuration {
  chains: Chain[];
  markets: Market[];
}

export interface Chain {
  architecture: string;
  canonicalName: string;
  network: string;
  chainId: number;
  contractOwnerAddress: string;
  explorerUrl?: string;
  rpcUrl: string;
  serviceAddress: string;
  tradeContract: TradeContract;
  tokens: { [key: string]: Token };
  baseOrQuote: 'base' | 'quote';
}

export interface Market {
  slug: string;
  name: string;
  baseChainNetwork: string;
  quoteChainNetwork: string;
  baseChainTokenSymbol: string;
  quoteChainTokenSymbol: string;
  baseChainTokenDecimals: number;
  quoteChainTokenDecimals: number;
  pairDecimals: number;
  marketId?: string;
}

export interface Token {
  name: string;
  symbol: string;
  address: string;
  tokenId?: string;
  decimals: number;
  tradePrecision: number;
}

export interface TradeContract {
  contractId?: string;
  address: string;
}

// Custom hook for configuration
export const useConfig = (token?: string) => {
  const [state, setState] = useState<GrpcResponse<Configuration>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchConfig = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await configService.getConfig(token);
      const data = convertToPlainObject<Configuration>(response.getConfig()!);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch configuration' 
      });
    }
  }, [token]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { ...state, refetch: fetchConfig };
};

// Custom hook for order management
export const useOrderService = (token?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOrder = useCallback(async (
    orderData: OrderData,
    signatureHash: Uint8Array
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create Order object from orderData
      const { Order, Side, ExecutionType } = await import('../proto/generated/arborter_pb');
      
      const order = new Order();
      order.setSide(orderData.side === 'bid' ? Side.SIDE_BID : Side.SIDE_ASK);
      order.setQuantity(orderData.quantity);
      if (orderData.price) {
        order.setPrice(orderData.price);
      }
      order.setMarketId(orderData.marketId);
      order.setBaseAccountAddress(orderData.baseAccountAddress);
      order.setQuoteAccountAddress(orderData.quoteAccountAddress);
      order.setExecutionType(
        orderData.executionType === 'direct' 
          ? ExecutionType.EXECUTION_TYPE_UNSPECIFIED 
          : ExecutionType.EXECUTION_TYPE_DISCRETIONARY
      );
      if (orderData.matchingOrderIds) {
        order.setMatchingOrderIdsList(orderData.matchingOrderIds);
      }

      const response = await arborterService.sendOrder(order, signatureHash, token);
      const data = convertToPlainObject<{
        orderInBook: boolean;
        order?: OrderData;
        trades: Trade[];
        transactionHashes: any[];
      }>(response);
      
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send order';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [token]);

  const cancelOrder = useCallback(async (
    marketId: string,
    side: 'bid' | 'ask',
    tokenAddress: string,
    orderId: number,
    signatureHash: Uint8Array
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { OrderToCancel, Side } = await import('../proto/generated/arborter_pb');
      
      const orderToCancel = new OrderToCancel();
      orderToCancel.setMarketId(marketId);
      orderToCancel.setSide(side === 'bid' ? Side.SIDE_BID : Side.SIDE_ASK);
      orderToCancel.setTokenAddress(tokenAddress);
      orderToCancel.setOrderId(orderId);

      const response = await arborterService.cancelOrder(orderToCancel, signatureHash, token);
      const data = convertToPlainObject<{
        orderCanceled: boolean;
        transactionHashes: any[];
      }>(response);
      
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [token]);

  return {
    sendOrder,
    cancelOrder,
    loading,
    error,
  };
};

// Custom hook for orderbook streaming
export const useOrderbookStream = (marketId: string, token?: string) => {
  const [entries, setEntries] = useState<OrderbookEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) return;

    const stream = arborterService.streamOrderbook(marketId, true, true, undefined, token);
    
    stream.on('data', (entry: any) => {
      const data = convertToPlainObject<OrderbookEntry>(entry);
      setEntries(prev => [...prev, data]);
    });

    stream.on('error', (err: any) => {
      setError(err.message || 'Orderbook stream error occurred');
    });

    return () => {
      stream.cancel();
    };
  }, [marketId, token]);

  return { entries, error };
};

// Custom hook for trades streaming
export const useTradesStream = (marketId: string, token?: string) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) return;

    const stream = arborterService.streamTrades(marketId, true, true, undefined, token);
    
    stream.on('data', (trade: any) => {
      const data = convertToPlainObject<Trade>(trade);
      setTrades(prev => [...prev, data]);
    });

    stream.on('error', (err: any) => {
      setError(err.message || 'Trades stream error occurred');
    });

    return () => {
      stream.cancel();
    };
  }, [marketId, token]);

  return { trades, error };
};

// Custom hook for configuration management
export const useConfigService = (token?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMarket = useCallback(async (marketData: {
    baseChainNetwork: string;
    quoteChainNetwork: string;
    baseChainTokenSymbol: string;
    quoteChainTokenSymbol: string;
    baseChainTokenAddress: string;
    quoteChainTokenAddress: string;
    baseChainTokenDecimals: number;
    quoteChainTokenDecimals: number;
    pairDecimals: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await configService.addMarket(marketData, token);
      const data = convertToPlainObject<{ success: boolean; config: Configuration }>(response);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add market';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [token]);

  const deleteMarket = useCallback(async (marketId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await configService.deleteMarket(marketId, token);
      const data = convertToPlainObject<{ success: boolean; config: Configuration }>(response);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete market';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [token]);

  const deployContract = useCallback(async (chainNetwork: string, baseOrQuote: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await configService.deployContract(chainNetwork, baseOrQuote, token);
      const data = convertToPlainObject<{ baseAddress: string; quoteAddress: string }>(response);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy contract';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, [token]);

  return {
    addMarket,
    deleteMarket,
    deployContract,
    loading,
    error,
  };
}; 