import { useConfig } from './useConfig';
import { configUtils } from '../lib/config-utils';

export interface TradingPair {
  id: string;
  displayName: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseChainId: number;
  quoteChainId: number;
  marketId: string;
}

export const useTradingPairs = () => {
  const { config, loading, error } = useConfig();
  
  const getTradingPairs = (): TradingPair[] => {
    if (!config?.markets) {
      return [];
    }

    const pairs = config.markets.map(market => {
      // Find the base and quote chains
      const baseChain = config.chains?.find(chain => chain.network === market.baseChainNetwork);
      const quoteChain = config.chains?.find(chain => chain.network === market.quoteChainNetwork);
      
      if (!baseChain || !quoteChain) {
        return null;
      }

      return {
        id: market.slug,
        displayName: `${market.baseChainTokenSymbol}/${market.quoteChainTokenSymbol}`,
        baseSymbol: market.baseChainTokenSymbol,
        quoteSymbol: market.quoteChainTokenSymbol,
        baseChainId: baseChain.chainId,
        quoteChainId: quoteChain.chainId,
        marketId: market.marketId,
      };
    }).filter(Boolean) as TradingPair[];
    
    // Log available trading pairs
    if (pairs.length > 0) {
      console.log(`📊 Available trading pairs from config:`);
      pairs.forEach(pair => {
        console.log(`   • ${pair.displayName} (Market ID: ${pair.marketId})`);
        console.log(`     Base: ${pair.baseSymbol} on Chain ${pair.baseChainId}`);
        console.log(`     Quote: ${pair.quoteSymbol} on Chain ${pair.quoteChainId}`);
      });
    }
    
    return pairs;
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