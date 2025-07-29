import { useState, useEffect } from 'react';
import { configService } from '../lib/grpc-client';
import { configUtils } from '../lib/config-utils';
import { updateWagmiConfig } from '../lib/web3modal-config';

// Import types from grpc-client
interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  tradePrecision: number;
}

interface TradeContract {
  address: string;
}

interface Chain {
  architecture: string;
  canonicalName: string;
  network: string;
  chainId: number;
  contractOwnerAddress: string;
  explorerUrl?: string;
  rpcUrl: string;
  serviceAddress: string;
  tradeContract: TradeContract;
  tokens: Record<string, Token>;
  baseOrQuote: string;
}

interface Market {
  slug: string;
  name: string;
  baseChainNetwork: string;
  quoteChainNetwork: string;
  baseChainTokenSymbol: string;
  quoteChainTokenSymbol: string;
  baseChainTokenDecimals: number;
  quoteChainTokenDecimals: number;
  pairDecimals: number;
  marketId: string;
}

interface ConfigData {
  chains: Chain[];
  markets: Market[];
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
        // Extract the actual config data from the nested structure
        const configData = response.config.config;
        setConfig(configData);
        // Set the config in our utils for easy access
        configUtils.setConfig(configData);
        
        // Update wagmi configuration with chains from gRPC config
        if (configData.chains && configData.chains.length > 0) {
          console.log('Updating wagmi config with chains from gRPC config:', configData.chains);
          try {
            updateWagmiConfig(configData.chains);
            console.log('Successfully updated wagmi config with gRPC chains');
          } catch (updateError) {
            console.warn('Failed to update wagmi config:', updateError);
            // Don't fail the entire config load if wagmi update fails
          }
        }
      } else {
        setError(response.error || 'Failed to fetch configuration');
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
