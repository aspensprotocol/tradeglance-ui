import { useConfig } from './useConfig';

export const useChainNetwork = () => {
  const { config } = useConfig();

  // Helper to get the chain network from config by chainId
  const getChainNetwork = (chainId: number | null) => {
    if (!config || !chainId) return null;
    const chain = config.chains?.find((c: any) => c.chainId === chainId || c.chain_id === chainId);
    return chain ? chain.network || chain.canonicalName || null : null;
  };

  return { getChainNetwork };
}; 