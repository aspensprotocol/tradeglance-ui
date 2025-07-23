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

export interface ChainConfig {
  chainId: number | string; // Allow both string and number
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
      const configChainId = typeof c.chain_id === 'string' ? parseInt(c.chain_id, 10) : c.chain_id;
      return configChainId === chainId;
    });
    
    if (!chain) {
      return null;
    }

    return {
      chainId: typeof chain.chain_id === 'string' ? parseInt(chain.chain_id, 10) : chain.chain_id,
      network: chain.network,
      rpcUrl: chain.rpc_url,
      tradeContractAddress: chain.trade_contract?.address || '',
      serviceAddress: chain.service_address,
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
      chainId: typeof chain.chain_id === 'string' ? parseInt(chain.chain_id, 10) : chain.chain_id,
      network: chain.network,
      rpcUrl: chain.rpc_url,
      tradeContractAddress: chain.trade_contract?.address || '',
      serviceAddress: chain.service_address,
      tokens: chain.tokens || {},
    };
  }

  getAllChains(): ChainConfig[] {
    if (!this.config?.chains) {
      return [];
    }

    return this.config.chains.map(chain => ({
      chainId: typeof chain.chain_id === 'string' ? parseInt(chain.chain_id, 10) : chain.chain_id,
      network: chain.network,
      rpcUrl: chain.rpc_url,
      tradeContractAddress: chain.trade_contract?.address || '',
      serviceAddress: chain.service_address,
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

    return this.config.markets.find(m => m.market_id === marketId) || null;
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