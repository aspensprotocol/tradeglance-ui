import { useConfig } from "./useConfig";
import { Chain, Market, Token } from "../protos/gen/arborter_config_pb";

export interface TradingPair {
  id: string;
  baseSymbol: string;
  quoteSymbol: string;
  displayName: string;
  baseChainNetwork: string;
  quoteChainNetwork: string;
  baseChainTokenAddress: string;
  quoteChainTokenAddress: string;
  baseChainTokenDecimals: number;
  quoteChainTokenDecimals: number;
  pairDecimals: number;
  baseChainId: number;
  quoteChainId: number;
}

export const useTradingPairs = (): {
  tradingPairs: TradingPair[];
  loading: boolean;
  error: string | null;
  getTradingPairById: (id: string) => TradingPair | null;
  getTradingPairByMarketId: (marketId: string) => TradingPair | null;
} => {
  const { config, loading: configLoading, error: configError } = useConfig();

  // Add comprehensive logging
  console.log("🔍 useTradingPairs hook called:", {
    hasConfig: !!config,
    configLoading,
    configError,
    configKeys: config ? Object.keys(config) : [],
    chainsCount: config?.chains?.length || 0,
    marketsCount: config?.markets?.length || 0,
  });

  const getTradingPairs = (): TradingPair[] => {
    if (!config || !config.chains || !config.markets) {
      console.log("❌ No config, chains, or markets available:", {
        hasConfig: !!config,
        hasChains: !!config?.chains,
        hasMarkets: !!config?.markets,
      });
      return [];
    }

    const chains: Chain[] = config.chains || [];
    const markets: Market[] = config.markets || [];

    console.log("🔍 Processing trading pairs:", {
      chainsCount: chains.length,
      marketsCount: markets.length,
      chainNetworks: chains.map((c) => c.network),
      marketSlugs: markets.map((m) => m.slug),
    });

    if (chains.length === 0 || markets.length === 0) {
      console.warn("No chains or markets found in config:", {
        chainsCount: chains.length,
        marketsCount: markets.length,
      });
      return [];
    }

    const tradingPairs: TradingPair[] = markets
      .map((market: Market) => {
        console.log("🔍 Processing market:", {
          slug: market.slug,
          marketId: market.marketId,
          baseChainNetwork: market.baseChainNetwork,
          quoteChainNetwork: market.quoteChainNetwork,
          baseTokenSymbol: market.baseChainTokenSymbol,
          quoteTokenSymbol: market.quoteChainTokenSymbol,
        });

        // Find the base and quote chains for this market
        const baseChain: Chain | undefined = chains.find(
          (chain: Chain) => chain.network === market.baseChainNetwork,
        );
        const quoteChain: Chain | undefined = chains.find(
          (chain: Chain) => chain.network === market.quoteChainNetwork,
        );

        if (!baseChain || !quoteChain) {
          console.warn("Market references non-existent chain:", {
            marketSlug: market.slug,
            baseChainNetwork: market.baseChainNetwork,
            quoteChainNetwork: market.quoteChainNetwork,
            availableChains: chains.map((c) => c.network),
          });
          return null;
        }

        // Find the base and quote tokens
        const baseToken: Token | undefined =
          baseChain.tokens[market.baseChainTokenSymbol];
        const quoteToken: Token | undefined =
          quoteChain.tokens[market.quoteChainTokenSymbol];

        if (!baseToken || !quoteToken) {
          console.warn("Market references non-existent token:", {
            marketSlug: market.slug,
            baseChainTokenSymbol: market.baseChainTokenSymbol,
            quoteTokenSymbol: market.quoteChainTokenSymbol,
            availableBaseTokens: Object.keys(baseChain.tokens),
            availableQuoteTokens: Object.keys(quoteChain.tokens),
          });
          return null;
        }

        // Get chain prefixes for display
        const getChainPrefix = (network: string): string => {
          if (network.includes("flare")) return "f";
          if (network.includes("base")) return "b";
          if (network.includes("mainnet")) return "m";
          if (network.includes("goerli")) return "g";
          if (network.includes("sepolia")) return "s";
          return network.charAt(0).toLowerCase();
        };

        const basePrefix: string = getChainPrefix(baseChain.network);
        const quotePrefix: string = getChainPrefix(quoteChain.network);

        // Create the trading pair ID
        const baseChainId: number =
          typeof baseChain.chainId === "string"
            ? parseInt(baseChain.chainId, 10)
            : baseChain.chainId;
        const quoteChainId: number =
          typeof quoteChain.chainId === "string"
            ? parseInt(quoteChain.chainId, 10)
            : quoteChain.chainId;

        const tradingPair: TradingPair = {
          id:
            market.marketId ||
            `${baseChainId}::${baseToken.address}::${quoteChainId}::${quoteToken.address}`,
          baseSymbol: market.baseChainTokenSymbol,
          quoteSymbol: market.quoteChainTokenSymbol,
          displayName: `${basePrefix}${market.baseChainTokenSymbol}/${quotePrefix}${market.quoteChainTokenSymbol}`,
          baseChainNetwork: market.baseChainNetwork,
          quoteChainNetwork: market.quoteChainNetwork,
          baseChainTokenAddress: baseToken.address,
          quoteChainTokenAddress: quoteToken.address,
          baseChainTokenDecimals: market.baseChainTokenDecimals,
          quoteChainTokenDecimals: market.quoteChainTokenDecimals,
          pairDecimals: market.pairDecimals,
          baseChainId,
          quoteChainId,
        };

        console.log("✅ Created trading pair:", {
          id: tradingPair.id,
          displayName: tradingPair.displayName,
          baseSymbol: tradingPair.baseSymbol,
          quoteSymbol: tradingPair.quoteSymbol,
        });

        return tradingPair;
      })
      .filter(Boolean) as TradingPair[];

    console.log("🎯 Final trading pairs result:", {
      totalPairs: tradingPairs.length,
      pairs: tradingPairs.map((p) => ({
        id: p.id,
        displayName: p.displayName,
      })),
    });

    return tradingPairs;
  };

  const tradingPairs: TradingPair[] = getTradingPairs();
  const loading: boolean =
    configLoading || (!!config && tradingPairs.length === 0);
  const error: string | null =
    configError ||
    (!!config && tradingPairs.length === 0 ? "No trading pairs found" : null);

  console.log("🔍 useTradingPairs final state:", {
    tradingPairsCount: tradingPairs.length,
    loading,
    error,
    selectedPairs: tradingPairs.map((p) => ({
      id: p.id,
      displayName: p.displayName,
    })),
  });

  const getTradingPairById = (id: string): TradingPair | null => {
    const result =
      tradingPairs.find((pair: TradingPair) => pair.id === id) || null;
    console.log("🔍 getTradingPairById:", {
      id,
      result: result ? result.displayName : "not found",
    });
    return result;
  };

  const getTradingPairByMarketId = (marketId: string): TradingPair | null => {
    const result =
      tradingPairs.find((pair: TradingPair) => pair.id.includes(marketId)) ||
      null;
    console.log("🔍 getTradingPairByMarketId:", {
      marketId,
      result: result ? result.displayName : "not found",
    });
    return result;
  };

  return {
    tradingPairs,
    loading,
    error,
    getTradingPairById,
    getTradingPairByMarketId,
  };
};
