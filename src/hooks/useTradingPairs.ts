import { useConfig } from './useConfig';
import { configUtils } from '../lib/config-utils';

// Define the actual config structure based on what the API returns
interface ConfigData {
  chains?: Array<{
    chain_id: number | string; // The actual field name from the API
    network: string;
    rpc_url: string; // The actual field name from the API
    trade_contract: { // Nested structure
      address: string;
    };
    service_address: string; // The actual field name from the API
    tokens?: Record<string, {
      address: string;
      decimals: number;
      symbol: string;
    }>;
  }>;
  markets?: Array<{
    market_id: string; // The actual field name from the API
    base_chain_network: string; // The actual field name from the API
    quote_chain_network: string; // The actual field name from the API
    base_chain_token_symbol: string; // The actual field name from the API
    quote_chain_token_symbol: string; // The actual field name from the API
    base_chain_token_decimals: number; // The actual field name from the API
    quote_chain_token_decimals: number; // The actual field name from the API
    pair_decimals: number; // The actual field name from the API
  }>;
}

export interface TradingPair {
  id: string;
  displayName: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseChainId: number;
  quoteChainId: number;
  marketId: string;
  // Add decimal information from market configuration
  baseTokenDecimals: number;
  quoteTokenDecimals: number;
  pairDecimals: number;
}

export const useTradingPairs = () => {
  const { config, loading, error } = useConfig();
  
  const getTradingPairs = (): TradingPair[] => {
    if (!config) {
      return [];
    }

    // The config is a plain JavaScript object, not a protobuf object
    const chains = config.chains || [];
    const markets = config.markets || [];

    if (chains.length === 0 || markets.length === 0) {
      return [];
    }

    const tradingPairs: TradingPair[] = [];

    // Create trading pairs from markets
    markets.forEach((market: any) => {
      // Find base and quote chains by network name
      const baseChain = chains.find((chain: any) => chain.network === market.base_chain_network);
      const quoteChain = chains.find((chain: any) => chain.network === market.quote_chain_network);
      
      if (!baseChain || !quoteChain) {
        return;
      }

      // Convert chain IDs to numbers for consistency
      const baseChainId = typeof baseChain.chain_id === 'string' ? parseInt(baseChain.chain_id, 10) : baseChain.chain_id;
      const quoteChainId = typeof quoteChain.chain_id === 'string' ? parseInt(quoteChain.chain_id, 10) : quoteChain.chain_id;

      // Create trading pair
      const tradingPair: TradingPair = {
        id: `${market.base_chain_token_symbol}-${market.quote_chain_token_symbol}`,
        displayName: `${market.base_chain_token_symbol}/${market.quote_chain_token_symbol}`,
        baseSymbol: market.base_chain_token_symbol,
        quoteSymbol: market.quote_chain_token_symbol,
        baseChainId: baseChainId,
        quoteChainId: quoteChainId,
        marketId: market.market_id,
        baseTokenDecimals: market.base_chain_token_decimals || 18,
        quoteTokenDecimals: market.quote_chain_token_decimals || 18,
        pairDecimals: market.pair_decimals || 8,
      };

      tradingPairs.push(tradingPair);
    });

    return tradingPairs;
  };

  const getTradingPairById = (id: string): TradingPair | null => {
    return getTradingPairs().find(pair => pair.id === id) || null;
  };

  const getTradingPairByMarketId = (marketId: string): TradingPair | null => {
    return getTradingPairs().find(pair => pair.marketId === marketId) || null;
  };

  return {
    tradingPairs: getTradingPairs(),
    getTradingPairById,
    getTradingPairByMarketId,
    loading,
    error,
  };
}; 