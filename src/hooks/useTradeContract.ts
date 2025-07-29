import { useConfig } from './useConfig';
import { configUtils } from '../lib/config-utils';

export const useTradeContracts = () => {
  const { config, loading, error } = useConfig();
  
  const getAllChains = () => {
    const chains = configUtils.getAllChains();
    console.log('useTradeContracts: getAllChains returned:', chains);
    return chains;
  };
  
  const getTradingPairs = () => {
    // This function doesn't exist in configUtils, so we'll return an empty array
    console.log('useTradeContracts: getTradingPairs not implemented');
    return [];
  };
  
  return {
    getAllChains,
    getTradingPairs,
    loading,
    error,
  };
}; 