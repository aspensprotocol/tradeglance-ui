import { useState, useEffect } from 'react';
import { configService } from '../lib/grpc-client';
import { configUtils } from '../lib/config-utils';
import { Configuration } from '../proto/generated/src/proto/arborter_config';

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

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await configService.getConfig();
      console.log('Config response:', response);
      
      if (response.config) {
        setConfig(response.config);
        // Set the config in our utils for easy access
        configUtils.setConfig(response.config);
      } else {
        setConfig(null);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
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