import { useTradingBalance } from './useTokenBalance';
import { useChainMonitor } from './useChainMonitor';
import { TradingPair } from './useTradingPairs';

export const useBalanceManager = (tradingPair?: TradingPair) => {
  const { currentChainId } = useChainMonitor();
  
  // Get trading balances for the current trading pair
  const { 
    availableBalance, 
    lockedBalance, 
    loading: balanceLoading, 
    refresh: refreshBalance 
  } = useTradingBalance(
    tradingPair?.baseSymbol || "ATOM", 
    currentChainId || 0
  );

  return {
    availableBalance,
    lockedBalance,
    balanceLoading,
    refreshBalance,
    currentChainId
  };
}; 