import { useEffect, useCallback } from "react";
import { useBalanceManager } from "./useBalanceManager";
import { useAllBalances } from "./useAllBalances";
import { useBalanceCache } from "./useBalanceCache";
import type { TradingPair } from "@/lib/shared-types";
import type { BaseOrQuote } from "@/protos/gen/arborter_config_pb";

interface UnifiedBalanceData {
  availableBalance: string;
  lockedBalance: string;
  allBalances: {
    symbol: string;
    chainId: number;
    network: string;
    walletBalance: string;
    depositedBalance: string;
    lockedBalance: string;
  }[];
  balanceLoading: boolean;
  allBalancesLoading: boolean;
  error: string | null;
  refreshAll: () => void;
  refreshTradingBalance: () => void;
}

export const useUnifiedBalance = (
  tradingPair?: TradingPair,
  currentSide?: BaseOrQuote.BASE | BaseOrQuote.QUOTE,
): UnifiedBalanceData => {
  const balanceCache = useBalanceCache();

  // Get trading pair specific balance
  const {
    availableBalance: tradingAvailableBalance,
    lockedBalance: tradingLockedBalance,
    balanceLoading: tradingBalanceLoading,
    refreshBalance: refreshTradingBalance,
  } = useBalanceManager(tradingPair, currentSide);

  // Get all balances
  const {
    balances: allBalances,
    loading: allBalancesLoadingBase,
    error: allBalancesError,
    refreshBalances: refreshAllBalances,
  } = useAllBalances();

  // Check cache first for trading pair balance
  const tradingPairCacheKey = balanceCache.getTradingPairCacheKey(
    tradingPair,
    currentSide,
  );
  const cachedTradingBalance = tradingPairCacheKey
    ? balanceCache.getCachedData(tradingPairCacheKey)
    : null;

  // Check cache first for all balances
  const allBalancesCacheKey = balanceCache.getAllBalancesCacheKey();
  const cachedAllBalances = allBalancesCacheKey
    ? balanceCache.getCachedData(allBalancesCacheKey)
    : null;

  // Use cached data if available, otherwise use fresh data
  const availableBalance =
    (
      cachedTradingBalance as {
        availableBalance?: string;
        lockedBalance?: string;
      }
    )?.availableBalance || tradingAvailableBalance;
  const lockedBalance =
    (
      cachedTradingBalance as {
        availableBalance?: string;
        lockedBalance?: string;
      }
    )?.lockedBalance || tradingLockedBalance;
  const balanceLoading = tradingBalanceLoading && !cachedTradingBalance;
  const allBalancesLoading = allBalancesLoadingBase && !cachedAllBalances;

  // Cache the trading pair balance data
  useEffect(() => {
    if (
      tradingPairCacheKey &&
      !tradingBalanceLoading &&
      tradingAvailableBalance !== "0"
    ) {
      balanceCache.setCachedData(tradingPairCacheKey, {
        availableBalance: tradingAvailableBalance,
        lockedBalance: tradingLockedBalance,
      });
    }
  }, [
    tradingPairCacheKey,
    tradingAvailableBalance,
    tradingLockedBalance,
    tradingBalanceLoading,
    balanceCache,
  ]);

  // Cache the all balances data
  useEffect(() => {
    if (
      allBalancesCacheKey &&
      !allBalancesLoadingBase &&
      allBalances.length > 0
    ) {
      balanceCache.setCachedData(allBalancesCacheKey, allBalances);
    }
  }, [allBalancesCacheKey, allBalancesLoadingBase, allBalances, balanceCache]);

  // Unified refresh function
  const refreshAll = useCallback(() => {
    refreshAllBalances();
    refreshTradingBalance();
    // Invalidate cache to force fresh data
    if (tradingPairCacheKey) balanceCache.invalidateCache(tradingPairCacheKey);
    if (allBalancesCacheKey) balanceCache.invalidateCache(allBalancesCacheKey);
  }, [
    refreshAllBalances,
    refreshTradingBalance,
    tradingPairCacheKey,
    allBalancesCacheKey,
    balanceCache,
  ]);

  return {
    availableBalance,
    lockedBalance,
    allBalances: (cachedAllBalances as typeof allBalances) || allBalances,
    balanceLoading,
    allBalancesLoading,
    error: allBalancesError,
    refreshAll,
    refreshTradingBalance,
  };
};
