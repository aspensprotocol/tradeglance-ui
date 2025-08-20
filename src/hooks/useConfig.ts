import { useState, useCallback, useEffect } from "react";
import { configService } from "../lib/grpc-client";
import { configUtils } from "../lib/config-utils";
import {
  Configuration,
  Chain,
  Market,
  Token,
} from "../protos/gen/arborter_config_pb";

export interface UseConfigReturn {
  config: Configuration | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>; // Add refetch alias for backward compatibility
}

export function useConfig(): UseConfigReturn {
  console.log("🔍 useConfig hook called");

  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  console.log("🔍 useConfig initial state:", {
    hasConfig: !!config,
    loading,
    error,
    configKeys: config ? Object.keys(config) : [],
  });

  const fetchConfig = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔧 Fetching configuration from backend...");
      console.log(
        "🔧 gRPC endpoint:",
        import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api",
      );
      console.log("🔧 Current URL:", window.location.href);

      const response = await configService.getConfig();

      if (response.config) {
        console.log("✅ Configuration loaded successfully:", response.config);
        setConfig(response.config);
        // Update the global configUtils instance so other parts of the app can access it
        configUtils.setConfig(response.config);
        console.log("🔧 ConfigUtils updated with new configuration");

        // Log some details about the loaded configuration
        console.log("📊 Configuration summary:", {
          chainsCount: response.config.chains?.length || 0,
          marketsCount: response.config.markets?.length || 0,
          hasTradeContracts:
            response.config.chains?.some(
              (chain: Chain) => chain.tradeContract,
            ) || false,
        });
      } else {
        console.error(
          "❌ BACKEND ISSUE: Empty configuration received from backend",
        );
        setError("Empty configuration received from backend");
      }
    } catch (err: unknown) {
      const errorMessage: string =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("❌ Failed to fetch configuration:", errorMessage);
      console.error("❌ Error details:", err);

      // Provide more specific error messages based on the error type
      let userFriendlyError = errorMessage;
      if (errorMessage.includes("Failed to fetch")) {
        userFriendlyError =
          "Network error: Unable to connect to the backend service. Please check if the backend is running.";
      } else if (errorMessage.includes("gRPC")) {
        userFriendlyError =
          "gRPC error: There was an issue with the gRPC communication. Please check the backend service.";
      } else if (errorMessage.includes("timeout")) {
        userFriendlyError =
          "Request timeout: The backend service is not responding. Please check if it is running.";
      }

      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    console.log("🔄 Refreshing configuration...");
    await fetchConfig();
  }, [fetchConfig]);

  // Automatically fetch config when hook is first used
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    fetchConfig,
    refresh,
    refetch: refresh, // Add alias for backward compatibility
  };
}

// Helper hooks for specific config data
export function useChains(): Chain[] {
  const { config } = useConfig();
  return config?.chains || [];
}

export function useMarkets(): Market[] {
  const { config } = useConfig();
  return config?.markets || [];
}

export function useTokens(): Token[] {
  const { config } = useConfig();
  const chains: Chain[] = config?.chains || [];
  const tokens: Token[] = [];

  chains.forEach((chain: Chain) => {
    Object.values(chain.tokens).forEach((token: Token) => {
      tokens.push(token);
    });
  });

  return tokens;
}

// Helper functions for finding specific config items
export function useChainById(chainId: number): Chain | null {
  const chains: Chain[] = useChains();
  return chains.find((chain: Chain) => chain.chainId === chainId) || null;
}

export function useMarketById(marketId: string): Market | null {
  const markets: Market[] = useMarkets();
  return markets.find((market: Market) => market.marketId === marketId) || null;
}

export function useTokenBySymbol(symbol: string): Token | null {
  const tokens: Token[] = useTokens();
  return tokens.find((token: Token) => token.symbol === symbol) || null;
}
