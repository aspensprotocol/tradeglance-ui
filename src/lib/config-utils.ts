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
    this.config = config;
  }

  getChainByChainId(chainId: number): ChainConfig | null {
    if (!this.config?.chains) {
      return null;
    }

    const chain = this.config.chains.find(c => c.chainId === chainId);
    if (!chain) {
      return null;
    }

    return {
      chainId: chain.chainId,
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
  }

  getTradeContractAddress(chainId: number): string | null {
    const chainConfig = this.getChainByChainId(chainId);
    return chainConfig?.tradeContractAddress || null;
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
      return [];
    }

    return this.config.chains.map(chain => ({
      chainId: chain.chainId,
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
    }));
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