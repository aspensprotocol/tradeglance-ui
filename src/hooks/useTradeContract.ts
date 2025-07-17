import { useConfig } from './useConfig';
import { configUtils } from '../lib/config-utils';

export const useTradeContract = (chainId: number) => {
  const { config, loading, error } = useConfig();
  
  const tradeContractAddress = configUtils.getTradeContractAddress(chainId);
  const chainConfig = configUtils.getChainByChainId(chainId);
  
  return {
    tradeContractAddress,
    chainConfig,
    loading,
    error,
    isSupported: !!tradeContractAddress,
  };
};

export const useTradeContracts = () => {
  const { config, loading, error } = useConfig();
  
  const getAllChains = () => configUtils.getAllChains();
  
  return {
    getAllChains,
    loading,
    error,
  };
}; 