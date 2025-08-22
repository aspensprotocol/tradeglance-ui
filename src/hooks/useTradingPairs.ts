import { useConfig } from "./useConfig";
import type { Chain, Market, Token } from "../protos/gen/arborter_config_pb";
import type { TradingPair } from "../lib/shared-types";

export const useTradingPairs = (): {
  tradingPairs: TradingPair[];
  loading: boolean;
  error: string | null;
  getTradingPairById: (id: string) => TradingPair | null;
  getTradingPairByMarketId: (marketId: string) => TradingPair | null;
} => {
  const { config, loading: configLoading, error: configError } = useConfig();

  // Calculate trading pairs from config
  const tradingPairs: TradingPair[] = (() => {
    if (!config || !config.chains || !config.markets) {
      return [];
    }

    const chains: Chain[] = config.chains || [];
    const markets: Market[] = config.markets || [];

    if (chains.length === 0 || markets.length === 0) {
      return [];
    }

    // Create a map for faster chain lookup
    const chainMap = new Map<string, Chain>();
    chains.forEach((chain) => chainMap.set(chain.network, chain));

    const results: TradingPair[] = [];

    markets.forEach((market: Market) => {
      // Find the base and quote chains for this market
      const baseChain: Chain | undefined = chainMap.get(
        market.baseChainNetwork,
      );
      const quoteChain: Chain | undefined = chainMap.get(
        market.quoteChainNetwork,
      );

      if (!baseChain || !quoteChain) {
        return;
      }

      // Find the base and quote tokens
      const baseToken: Token | undefined =
        baseChain.tokens[market.baseChainTokenSymbol];
      const quoteToken: Token | undefined =
        quoteChain.tokens[market.quoteChainTokenSymbol];

      if (!baseToken || !quoteToken) {
        return;
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

      results.push(tradingPair);
    });

    return results;
  })();

  const loading: boolean =
    configLoading || (!!config && tradingPairs.length === 0);
  const error: string | null =
    configError ||
    (!!config && tradingPairs.length === 0 ? "No trading pairs found" : null);

  // Create lookup functions
  const getTradingPairById = (id: string): TradingPair | null => {
    return tradingPairs.find((pair: TradingPair) => pair.id === id) || null;
  };

  const getTradingPairByMarketId = (marketId: string): TradingPair | null => {
    return (
      tradingPairs.find((pair: TradingPair) => pair.id.includes(marketId)) ||
      null
    );
  };

  return {
    tradingPairs,
    loading,
    error,
    getTradingPairById,
    getTradingPairByMarketId,
  };
};
