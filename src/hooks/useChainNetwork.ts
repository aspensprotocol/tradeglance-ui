import { useConfig } from './useConfig';
import { Chain } from '../protos/gen/arborter_config_pb';

export const useChainNetwork = () => {
  const { config } = useConfig();

  // Helper to get the chain network from config by chainId
  const getChainNetwork = (chainId: number | null) => {
    if (!config || !chainId) return null;
    const chain = config.chains?.find((c: Chain) => {
      const configChainId = typeof c.chainId === 'string' ? parseInt(c.chainId, 10) : c.chainId;
      return configChainId === chainId;
    });
    return chain ? chain.network || null : null;
  };

  return { getChainNetwork };
}; 