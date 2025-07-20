import { Configuration, Chain } from '../proto/generated/src/proto/arborter_config';

export interface ChainConfig {
  chainId: number;
  network: string;
  rpcUrl: string;
  tradeContractAddress: string;
  serviceAddress: string;
  tokens: Record<string, {
    address: string;
    decimals: number;
    symbol: string;
  }>;
}

export class ConfigUtils {
  private config: Configuration | null = null;

  setConfig(config: Configuration) {
    console.log('ConfigUtils: Setting config:', config);
    this.config = config;
  }

  getChainByChainId(chainId: number): ChainConfig | null {
    if (!this.config?.chains) {
      console.log('ConfigUtils: No chains in config');
      return null;
    }

    console.log(`ConfigUtils: Looking for chain ID ${chainId} (type: ${typeof chainId}) in config chains:`, this.config.chains.map(c => ({ 
      chainId: c.chainId, 
      chain_id: (c as any).chain_id, // Access the raw protobuf field
      chainIdType: typeof c.chainId,
      network: c.network,
      canonicalName: c.canonicalName
    })));

    // Try to find the chain using both property names
    let chain = this.config.chains.find(c => c.chainId === chainId);
    if (!chain) {
      // Try using the raw protobuf field name
      chain = this.config.chains.find(c => (c as any).chain_id === chainId);
    }
    
    if (!chain) {
      console.log(`ConfigUtils: Chain ${chainId} not found in config. Available chain IDs:`, this.config.chains.map(c => (c as any).chain_id || c.chainId));
      return null;
    }

    console.log(`ConfigUtils: Found chain ${chainId}:`, chain);

    // Use the correct property name from protobuf
    const actualChainId = (chain as any).chain_id || chain.chainId;
    
    // Get trade contract address using the correct property name
    const tradeContractAddress = (chain as any).trade_contract?.address || chain.tradeContract?.address || '';
    
    console.log(`ConfigUtils: Trade contract address for chain ${chainId}:`, tradeContractAddress);
    
    return {
      chainId: actualChainId,
      network: chain.network,
      rpcUrl: chain.rpcUrl,
      tradeContractAddress: tradeContractAddress,
      serviceAddress: chain.serviceAddress,
      tokens: Object.entries(chain.tokens || {}).reduce((acc, [symbol, token]) => {
        acc[symbol] = {
          address: token.address,
          decimals: token.decimals,
          symbol: token.symbol,
        };
        return acc;
      }, {} as Record<string, { address: string; decimals: number; symbol: string }>)
    };
  }

  getTradeContractAddress(chainId: number): string | null {
    const chainConfig = this.getChainByChainId(chainId);
    const address = chainConfig?.tradeContractAddress || null;
    console.log(`ConfigUtils: getTradeContractAddress for chain ${chainId}:`, address);
    return address;
  }

  getTradingPairs(): Array<{ value: string; label: string; market: any }> {
    console.log('ConfigUtils.getTradingPairs: Starting');
    console.log('ConfigUtils.getTradingPairs: Config available:', !!this.config);
    console.log('ConfigUtils.getTradingPairs: Config markets:', this.config?.markets);
    
    if (!this.config?.markets) {
      console.log('ConfigUtils.getTradingPairs: No markets in config for getTradingPairs');
      return [];
    }

    console.log('ConfigUtils.getTradingPairs: Processing markets:', this.config.markets);
    
    const pairs = this.config.markets.map(market => {
      console.log('ConfigUtils.getTradingPairs: Processing market:', market);
      
      // Use the correct snake_case property names from protobuf
      const baseSymbol = (market as any).base_chain_token_symbol || market.baseChainTokenSymbol;
      const quoteSymbol = (market as any).quote_chain_token_symbol || market.quoteChainTokenSymbol;
      
      // Create label in format "symbol_1/symbol_2"
      const label = `${baseSymbol}/${quoteSymbol}`;
      const value = market.slug || `${baseSymbol}_${quoteSymbol}`;
      
      console.log(`ConfigUtils.getTradingPairs: Trading pair: ${label} (${value})`);
      
      return {
        value,
        label,
        market
      };
    });
    
    console.log('ConfigUtils.getTradingPairs: Final result:', pairs);
    return pairs;
  }

  getTokenAddress(chainId: number, symbol: string): string | null {
    const chainConfig = this.getChainByChainId(chainId);
    return chainConfig?.tokens[symbol]?.address || null;
  }

  getRpcUrl(chainId: number): string | null {
    const chainConfig = this.getChainByChainId(chainId);
    return chainConfig?.rpcUrl || null;
  }

  getAllChains(): ChainConfig[] {
    if (!this.config?.chains) {
      console.log('ConfigUtils: No chains in config for getAllChains');
      return [];
    }

    console.log('ConfigUtils: Processing chains:', this.config.chains);
    console.log('ConfigUtils: Available chain IDs:', this.config.chains.map(c => ({ 
      chainId: c.chainId, 
      chain_id: (c as any).chain_id, // Access the raw protobuf field
      network: c.network,
      canonicalName: c.canonicalName 
    })));
    
    const result = this.config.chains.map(chain => {
      console.log('ConfigUtils: Processing chain:', chain);
      // Use the correct property name from protobuf
      const chainId = (chain as any).chain_id || chain.chainId;
      return {
        chainId: chainId,
        network: chain.network,
        rpcUrl: chain.rpcUrl,
        tradeContractAddress: chain.tradeContract?.address || '',
        serviceAddress: chain.serviceAddress,
        tokens: Object.entries(chain.tokens || {}).reduce((acc, [symbol, token]) => {
          acc[symbol] = {
            address: token.address,
            decimals: token.decimals,
            symbol: token.symbol,
          };
          return acc;
        }, {} as Record<string, { address: string; decimals: number; symbol: string }>)
      };
    });
    
    console.log('ConfigUtils: getAllChains result:', result);
    return result;
  }

  getMarketByChainIds(baseChainId: number, quoteChainId: number) {
    if (!this.config?.markets) {
      return null;
    }

    return this.config.markets.find(market => {
      const baseChain = this.getChainByChainId(baseChainId);
      const quoteChain = this.getChainByChainId(quoteChainId);
      
      return baseChain && quoteChain && 
             market.baseChainNetwork === baseChain.network &&
             market.quoteChainNetwork === quoteChain.network;
    });
  }
}

// Create a singleton instance
export const configUtils = new ConfigUtils(); 