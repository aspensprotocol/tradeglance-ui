import type {
  Chain,
  Configuration,
  Market,
  Token,
  TradeContract,
} from "../protos/gen/arborter_config_pb";

// Use proto-generated types instead of custom interfaces
// ChainConfig is eliminated - use Chain directly from proto

class ConfigUtils {
  private config: Configuration | null = null;

  setConfig(config: Configuration): void {
    this.config = config;
    console.log("ConfigUtils: Configuration updated with", {
      chainsCount: config.chains?.length || 0,
      marketsCount: config.markets?.length || 0,
    });
  }

  getConfig(): Configuration | null {
    return this.config;
  }

  getAllChains(): Chain[] {
    return this.config?.chains || [];
  }

  getAllMarkets(): Market[] {
    return this.config?.markets || [];
  }

  getAllTokens(): Token[] {
    const chains: Chain[] = this.config?.chains || [];
    const tokens: Token[] = [];

    chains.forEach((chain: Chain) => {
      Object.values(chain.tokens).forEach((token: Token) => {
        tokens.push(token);
      });
    });

    return tokens;
  }

  getChainByChainId(chainId: number): Chain | null {
    const chain: Chain | undefined = this.config?.chains?.find((c: Chain) => {
      const configChainId: number =
        typeof c.chainId === "string" ? parseInt(c.chainId, 10) : c.chainId;
      return configChainId === chainId;
    });
    return chain || null;
  }

  getChainByNetwork(network: string): Chain | null {
    const chain: Chain | undefined = this.config?.chains?.find(
      (c: Chain) => c.network === network,
    );
    return chain || null;
  }

  getMarketById(marketId: string): Market | null {
    const market: Market | undefined = this.config?.markets?.find(
      (m: Market) => m.marketId === marketId,
    );
    return market || null;
  }

  getTokenBySymbol(symbol: string): Token | null {
    const chains: Chain[] = this.config?.chains || [];

    for (const chain of chains) {
      const token: Token | undefined = chain.tokens[symbol];
      if (token) {
        return token;
      }
    }

    return null;
  }

  getTradeContractAddress(chainId: number): string | null {
    const chain: Chain | null = this.getChainByChainId(chainId);
    return chain?.tradeContract?.address || null;
  }

  getTradeContractByChainId(chainId: number): TradeContract | null {
    const chain: Chain | null = this.getChainByChainId(chainId);
    return chain?.tradeContract || null;
  }

  getSupportedNetworks(): Chain[] {
    return (
      this.config?.chains?.filter((chain: Chain) => chain.tradeContract) || []
    );
  }

  isNetworkSupported(chainId: number): boolean {
    const chain: Chain | null = this.getChainByChainId(chainId);
    return !!chain?.tradeContract;
  }

  getNetworkInfo(
    chainId: number,
  ): { network: string; chainId: number; isSupported: boolean } | null {
    const chain: Chain | null = this.getChainByChainId(chainId);
    if (!chain) return null;

    return {
      network: chain.network,
      chainId:
        typeof chain.chainId === "string"
          ? parseInt(chain.chainId, 10)
          : chain.chainId,
      isSupported: !!chain.tradeContract,
    };
  }
}

export const configUtils = new ConfigUtils();
