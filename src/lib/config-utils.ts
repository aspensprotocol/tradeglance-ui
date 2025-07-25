// Define the actual config structure based on the protobuf definition
interface ConfigData {
  chains?: Array<{
    architecture: string;
    canonicalName: string;
    network: string;
    chainId: number;
    contractOwnerAddress: string;
    explorerUrl?: string;
    rpcUrl: string;
    serviceAddress: string;
    tradeContract: {
      contractId?: string;
      address: string;
    };
    tokens: Record<string, {
      name: string;
      symbol: string;
      address: string;
      tokenId?: string;
      decimals: number;
      tradePrecision: number;
    }>;
    baseOrQuote: string;
  }>;
  markets?: Array<{
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
  }>;
}

export interface ChainConfig {
  chainId: number | string; // Allow both string and number
  network: string;
  rpcUrl: string;
  tradeContractAddress: string;
  serviceAddress: string;
  explorerUrl?: string; // Optional explorer URL
  tokens: Record<string, {
    address: string;
    decimals: number;
    symbol: string;
  }>;
}

export class ConfigUtils {
  private config: ConfigData | null = null;

  setConfig(config: ConfigData) {
    this.config = config;
  }

  getChainByChainId(chainId: number): ChainConfig | null {
    if (!this.config?.chains) {
      return null;
    }

    // Try to find chain with type conversion, using the correct field name
    const chain = this.config.chains.find(c => {
      const configChainId = typeof c.chainId === 'string' ? parseInt(c.chainId, 10) : c.chainId;
      return configChainId === chainId;
    });
    
    if (!chain) {
      return null;
    }

    return {
      chainId: typeof chain.chainId === 'string' ? parseInt(chain.chainId, 10) : chain.chainId,
      network: chain.network,
      rpcUrl: chain.rpcUrl,
      tradeContractAddress: chain.tradeContract?.address || '',
      serviceAddress: chain.serviceAddress,
      explorerUrl: chain.explorerUrl,
      tokens: chain.tokens || {},
    };
  }

  getChainByNetwork(network: string): ChainConfig | null {
    if (!this.config?.chains) {
      return null;
    }

    const chain = this.config.chains.find(c => c.network === network);
    
    if (!chain) {
      return null;
    }

    return {
      chainId: typeof chain.chainId === 'string' ? parseInt(chain.chainId, 10) : chain.chainId,
      network: chain.network,
      rpcUrl: chain.rpcUrl,
      tradeContractAddress: chain.tradeContract?.address || '',
      serviceAddress: chain.serviceAddress,
      explorerUrl: chain.explorerUrl,
      tokens: chain.tokens || {},
    };
  }

  getAllChains(): ChainConfig[] {
    if (!this.config?.chains) {
      return [];
    }

    return this.config.chains.map(chain => ({
      chainId: typeof chain.chainId === 'string' ? parseInt(chain.chainId, 10) : chain.chainId,
      network: chain.network,
      rpcUrl: chain.rpcUrl,
      tradeContractAddress: chain.tradeContract?.address || '',
      serviceAddress: chain.serviceAddress,
      explorerUrl: chain.explorerUrl,
      tokens: chain.tokens || {},
    }));
  }

  getTokenByAddress(chainId: number, tokenAddress: string): { address: string; decimals: number; symbol: string } | null {
    const chain = this.getChainByChainId(chainId);
    if (!chain) {
      return null;
    }

    return chain.tokens[tokenAddress] || null;
  }

  getMarketById(marketId: string): any {
    if (!this.config?.markets) {
      return null;
    }

    return this.config.markets.find(m => m.marketId === marketId) || null;
  }

  getAllMarkets(): any[] {
    return this.config?.markets || [];
  }

  getTradeContractAddress(chainId: number): string | null {
    const chain = this.getChainByChainId(chainId);
    return chain?.tradeContractAddress || null;
  }
}

export const configUtils = new ConfigUtils(); 