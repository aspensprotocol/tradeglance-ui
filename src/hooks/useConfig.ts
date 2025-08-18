import { useState, useEffect, useCallback } from 'react';
import { configService } from '../lib/grpc-client';
import { configUtils } from '../lib/config-utils';
import { updateWagmiConfig } from '../lib/web3modal-config';
import { Configuration } from '../protos/gen/arborter_config_pb';

interface UseConfigReturn {
  config: Configuration | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState<boolean>(false);
  const [hasUpdatedWagmi, setHasUpdatedWagmi] = useState<boolean>(false);

  const fetchConfig = useCallback(async () => {
    // Prevent multiple fetch attempts
    if (hasAttemptedFetch) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasAttemptedFetch(true);
      
      const response = await configService.getConfig();
      
      if (response.config) {
        // Extract the actual config data from the nested structure
        const configData = response.config;
        
        // Debug: Log the actual config data from gRPC
        console.log('Raw gRPC config response:', response);
        console.log('Config data structure:', configData);
        console.log('Chains with explorer URLs:', configData.chains?.map(c => ({
          network: c.network,
          chainId: c.chainId,
          explorerUrl: c.explorerUrl,
          hasExplorerUrl: !!c.explorerUrl
        })));
        
        setConfig(configData);
        // Set the config in our utils for easy access
        configUtils.setConfig(configData);
        
        // Update wagmi configuration with chains from gRPC config - only once
        if (configData.chains && configData.chains.length > 0 && !hasUpdatedWagmi) {
          console.log('Updating wagmi config with chains from gRPC config:', configData.chains);
          try {
            updateWagmiConfig(configData.chains);
            setHasUpdatedWagmi(true);
            console.log('Successfully updated wagmi config with gRPC chains');
          } catch (updateError) {
            console.warn('Failed to update wagmi config:', updateError);
            // Don't fail the entire config load if wagmi update fails
          }
        }
        
        // If we got a fallback config, show a warning
        if (response.error && response.error.includes('fallback')) {
          console.warn('Using fallback configuration - backend not available');
          const isDev = import.meta.env.DEV;
          const errorMsg = isDev 
            ? 'Backend not available - using fallback configuration. Start your backend service or set VITE_GRPC_WEB_PROXY_URL in .env.local'
            : 'Backend not available - using fallback configuration';
          setError(errorMsg);
        }
      } else {
        setError(response.error || 'Failed to fetch configuration');
        setConfig(null);
      }
    } catch (err) {
      console.error('useConfig: Failed to fetch config:', err);
      const isDev = import.meta.env.DEV;
      let errorMsg = err instanceof Error ? err.message : 'Failed to fetch configuration';
      
      if (isDev && errorMsg.includes('unsupported content type')) {
        errorMsg = 'Backend not available - check if your gRPC service is running and VITE_GRPC_WEB_PROXY_URL is set correctly';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [hasAttemptedFetch, hasUpdatedWagmi]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]); // Include fetchConfig in dependencies

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
}; 
