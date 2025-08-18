import { useConfig } from './useConfig';
import { configUtils } from '../lib/config-utils';
import { Configuration, Market, Chain } from '../protos/gen/arborter_config_pb';

// Use proto-generated types instead of custom interfaces
export type TradingPair = {
  id: string;
  displayName: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseChainId: number;
  quoteChainId: number;
  marketId: string;
  baseTokenDecimals: number;
  quoteTokenDecimals: number;
  pairDecimals: number;
};

export const useTradingPairs = () => {
  const { config, loading, error } = useConfig();
  
  // Debug logging for config
  console.log('useTradingPairs: Config received:', {
    hasConfig: !!config,
    configType: typeof config,
    configKeys: config ? Object.keys(config) : [],
    chainsCount: config?.chains?.length || 0,
    marketsCount: config?.markets?.length || 0,
    loading,
    error
  });
  
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
    markets.forEach((market: Market) => {
      console.log('Processing market:', {
        slug: market.slug,
        name: market.name,
        marketId: market.marketId,
        marketIdType: typeof market.marketId,
        marketIdTruthy: !!market.marketId,
        baseChainNetwork: market.baseChainNetwork,
        quoteChainNetwork: market.quoteChainNetwork,
        fullMarket: market,
        marketKeys: Object.keys(market)
      });
      
      // Find base and quote chains by network name
      const baseChain = chains.find((chain: Chain) => chain.network === market.baseChainNetwork);
      const quoteChain = chains.find((chain: Chain) => chain.network === market.quoteChainNetwork);
      
      console.log('Found chains:', {
        baseChain: baseChain ? {
          network: baseChain.network,
          chainId: baseChain.chainId,
          baseOrQuote: baseChain.baseOrQuote
        } : null,
        quoteChain: quoteChain ? {
          network: quoteChain.network,
          chainId: quoteChain.chainId,
          baseOrQuote: quoteChain.baseOrQuote
        } : null
      });
      
      if (!baseChain || !quoteChain) {
        console.log('Skipping market - chain not found:', {
          baseChainNetwork: market.baseChainNetwork,
          quoteChainNetwork: market.quoteChainNetwork,
          availableChains: chains.map(c => c.network)
        });
        return;
      }

      // Skip markets without valid marketId
      if (!market.marketId || market.marketId.trim() === '') {
        console.warn('Skipping market - no valid marketId:', {
          slug: market.slug,
          name: market.name,
          marketId: market.marketId
        });
        return;
      }

      // Helper function to get chain prefix for trading pairs
      const getChainPrefix = (network: string): string => {
        if (network.includes('flare')) return 'f'; // flare-coston2
        if (network.includes('base')) return 'b';  // base-sepolia
        if (network.includes('mainnet')) return 'm';
        if (network.includes('goerli')) return 'g';
        if (network.includes('sepolia')) return 's';
        return network.charAt(0).toLowerCase(); // fallback to first letter
      };

      // Get chain prefixes
      const basePrefix = getChainPrefix(baseChain.network);
      const quotePrefix = getChainPrefix(quoteChain.network);

      // Convert chain IDs to numbers for consistency
      const baseChainId = typeof baseChain.chainId === 'string' ? parseInt(baseChain.chainId, 10) : baseChain.chainId;
      const quoteChainId = typeof quoteChain.chainId === 'string' ? parseInt(quoteChain.chainId, 10) : quoteChain.chainId;

      // Create trading pair with chain prefixes
      const tradingPair: TradingPair = {
        id: `${basePrefix}${market.baseChainTokenSymbol}-${quotePrefix}${market.quoteChainTokenSymbol}`,
        displayName: `${basePrefix}${market.baseChainTokenSymbol}/${quotePrefix}${market.quoteChainTokenSymbol}`,
        baseSymbol: market.baseChainTokenSymbol,
        quoteSymbol: market.quoteChainTokenSymbol,
        baseChainId: baseChainId,
        quoteChainId: quoteChainId,
        marketId: market.marketId || `${baseChain.network}-${market.baseChainTokenSymbol}-${quoteChain.network}-${market.quoteChainTokenSymbol}`,
        baseTokenDecimals: market.baseChainTokenDecimals || 18,
        quoteTokenDecimals: market.quoteChainTokenDecimals || 18,
        pairDecimals: market.pairDecimals || 8,
      };

      tradingPairs.push(tradingPair);
      console.log('Created trading pair:', {
        id: tradingPair.id,
        displayName: tradingPair.displayName,
        marketId: tradingPair.marketId,
        marketIdType: typeof tradingPair.marketId,
        marketIdTruthy: !!tradingPair.marketId,
        baseChainId: tradingPair.baseChainId,
        quoteChainId: tradingPair.quoteChainId,
        baseChainBaseOrQuote: baseChain.baseOrQuote,
        quoteChainBaseOrQuote: quoteChain.baseOrQuote
      });
    });

    console.log('Final trading pairs:', tradingPairs.map(p => ({ id: p.id, marketId: p.marketId })));
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