import { useState, useEffect } from 'react';
import { configService } from '../lib/api-client';
import { configUtils } from '../lib/config-utils';

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