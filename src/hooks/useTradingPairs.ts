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
    console.log('useTradingPairs: Starting getTradingPairs');
    console.log('useTradingPairs: Config available:', !!config);
    console.log('useTradingPairs: Config markets:', config?.markets);
    
    if (!config) {
      console.log('useTradingPairs: No config available');
      return [];
    }

    // Use the configUtils method to get trading pairs
    const configPairs = configUtils.getTradingPairs();
    console.log('useTradingPairs: Config pairs from configUtils:', configPairs);

    if (configPairs.length === 0) {
      console.log('useTradingPairs: No config pairs returned from configUtils');
      return [];
    }

    // Convert to TradingPair format
    const pairs = configPairs.map(configPair => {
      console.log('useTradingPairs: Processing configPair:', configPair);
      
      // Find the market data
      const market = configPair.market;
      
      // Use the correct snake_case property names from protobuf
      const baseChainNetwork = (market as any).base_chain_network || market.baseChainNetwork;
      const quoteChainNetwork = (market as any).quote_chain_network || market.quoteChainNetwork;
      
      // Find the base and quote chains
      const baseChain = config.chains?.find(chain => chain.network === baseChainNetwork);
      const quoteChain = config.chains?.find(chain => chain.network === quoteChainNetwork);
      
      if (!baseChain || !quoteChain) {
        console.log(`useTradingPairs: Could not find chains for market ${market.slug}`);
        console.log(`  Base chain network: ${baseChainNetwork}`);
        console.log(`  Quote chain network: ${quoteChainNetwork}`);
        console.log(`  Available chains:`, config.chains?.map(c => ({ network: c.network, chainId: (c as any).chain_id })));
        return null;
      }

      // Use the correct property name from protobuf
      const baseChainId = (baseChain as any).chain_id || baseChain.chainId;
      const quoteChainId = (quoteChain as any).chain_id || quoteChain.chainId;

      // Use the correct snake_case property names for symbols
      const baseSymbol = (market as any).base_chain_token_symbol || market.baseChainTokenSymbol;
      const quoteSymbol = (market as any).quote_chain_token_symbol || market.quoteChainTokenSymbol;

      const pair: TradingPair = {
        id: configPair.value,
        displayName: configPair.label, // This is already in "symbol_1/symbol_2" format
        baseSymbol: baseSymbol,
        quoteSymbol: quoteSymbol,
        baseChainId: baseChainId,
        quoteChainId: quoteChainId,
        marketId: market.marketId,
      };

      console.log(`useTradingPairs: Created pair ${pair.displayName}:`, pair);
      return pair;
    }).filter(Boolean) as TradingPair[];
    
    // Log available trading pairs
    if (pairs.length > 0) {
      console.log(`📊 Available trading pairs from config:`);
      pairs.forEach(pair => {
        console.log(`   • ${pair.displayName} (Market ID: ${pair.marketId})`);
        console.log(`     Base: ${pair.baseSymbol} on Chain ${pair.baseChainId}`);
        console.log(`     Quote: ${pair.quoteSymbol} on Chain ${pair.quoteChainId}`);
      });
    } else {
      console.log('useTradingPairs: No valid trading pairs found');
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