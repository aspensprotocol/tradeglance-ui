import { useState, useEffect } from 'react';
import { configService } from '../lib/api-client';
import { configUtils } from '../lib/config-utils';
import { Configuration } from '../proto/generated/arborter_config_pb';

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
      
      if (response.success && response.config) {
        setConfig(response.config);
        // Set the config in our utils for easy access
        configUtils.setConfig(response.config);
      } else {
        setError(response.message || 'Failed to fetch configuration');
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