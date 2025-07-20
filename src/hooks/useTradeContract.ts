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
  
  const getAllChains = () => {
    const chains = configUtils.getAllChains();
    console.log('useTradeContracts: getAllChains returned:', chains);
    return chains;
  };
  
  const getTradingPairs = () => {
    const pairs = configUtils.getTradingPairs();
    console.log('useTradeContracts: getTradingPairs returned:', pairs);
    return pairs;
  };
  
  return {
    getAllChains,
    getTradingPairs,
    loading,
    error,
  };
}; 