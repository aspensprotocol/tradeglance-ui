import { useState, useEffect } from 'react';
import { configService } from '../lib/grpc-client';
import { configUtils } from '../lib/config-utils';

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

interface UseConfigReturn {
  config: ConfigData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await configService.getConfig();
      
      if (response.success && response.config) {
        setConfig(response.config);
        // Set the config in our utils for easy access
        configUtils.setConfig(response.config);
      } else {
        setError(response.message || 'Failed to fetch configuration');
        setConfig(null);
      }
    } catch (err) {
      console.error('useConfig: Failed to fetch config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
}; 
