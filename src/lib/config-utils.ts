import { Configuration, Chain, BaseOrQuote, Market, TradeContract } from '../protos/gen/arborter_config_pb';

// Use proto-generated types instead of custom interfaces
// ChainConfig is eliminated - use Chain directly from proto

export class ConfigUtils {
  private config: Configuration | null = null;

  setConfig(config: Configuration) {
    this.config = config;
  }

  getChainByChainId(chainId: number): Chain | null {
    if (!this.config?.chains) {
      return null;
    }

    // Try to find chain with type conversion, using the correct field name
    const chain = this.config.chains.find(c => {
      const configChainId = typeof c.chainId === 'string' ? parseInt(c.chainId, 10) : c.chainId;
      return configChainId === chainId;
    });
    
    if (!chain || !chain.tradeContract) {
      return null;
    }

    return chain;
  }

  getChainByNetwork(network: string): Chain | null {
    if (!this.config?.chains) {
      return null;
    }

    const chain = this.config.chains.find(c => c.network === network);
    
    if (!chain || !chain.tradeContract) {
      return null;
    }

    return chain;
  }

  getAllChains(): Chain[] {
    if (!this.config?.chains) {
      return [];
    }

    return this.config.chains
      .filter(chain => chain.tradeContract); // Only include chains with trade contracts
  }

  getTokenByAddress(chainId: number, tokenAddress: string): { address: string; decimals: number; symbol: string } | null {
    const chain = this.getChainByChainId(chainId);
    if (!chain) {
      return null;
    }

    return chain.tokens[tokenAddress] || null;
  }

  getMarketById(marketId: string): Market | null {
    if (!this.config?.markets) {
      return null;
    }

    return this.config.markets.find(m => m.marketId === marketId) || null;
  }

  getAllMarkets(): Market[] {
    return this.config?.markets || [];
  }

  getTradeContractAddress(chainId: number): string | null {
    const chain = this.getChainByChainId(chainId);
    return chain?.tradeContract?.address || null;
  }
}

export const configUtils = new ConfigUtils(); 