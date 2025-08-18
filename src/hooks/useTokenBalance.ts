import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { readContract } from 'viem/actions';
import { createPublicClient, http } from 'viem';
import { configUtils } from '../lib/config-utils';
import { useConfig } from './useConfig';

// ERC-20 Token ABI for balanceOf function
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
] as const;

// MidribV2 Contract ABI for trading balances
const MIDRIB_V2_ABI = [
  {
    "constant": true,
    "inputs": [
      {"name": "depositorAddress", "type": "address"},
      {"name": "tokenContract", "type": "address"}
    ],
    "name": "getBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "depositorAddress", "type": "address"},
      {"name": "tokenContract", "type": "address"}
    ],
    "name": "getLockedBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  }
] as const;

// Helper function to create a custom public client with the correct RPC URL
const createCustomPublicClient = (rpcUrl: string) => {
  return createPublicClient({
    transport: http(rpcUrl),
  });
};

export const useTokenBalance = (tokenSymbol: string, chainId: number) => {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !address || !tokenSymbol || !chainId) {
        setBalance("0");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('useTokenBalance: Fetching balance for', tokenSymbol, 'on chain', chainId);
        
        // Get chain and token config
        const chainConfig = configUtils.getChainByChainId(chainId);
        if (!chainConfig) {
          console.error(`Chain config not found for chain ${chainId}`);
          setBalance("0");
          return;
        }

        const tokenConfig = chainConfig.tokens[tokenSymbol];
        if (!tokenConfig) {
          console.error(`Token config not found for ${tokenSymbol} on chain ${chainId}`);
          setBalance("0");
          return;
        }

        const tokenAddress = tokenConfig.address;
        console.log('useTokenBalance: Token address:', tokenAddress);

        // Create custom public client with the correct RPC URL from config
        const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);
        console.log('useTokenBalance: Using custom public client with RPC URL:', chainConfig.rpcUrl);

        // Read token balance using custom publicClient
        const balanceResult = await customPublicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        console.log('useTokenBalance: Raw balance result:', balanceResult);

        // Convert balance to human readable format using token decimals
        const balanceDecimal = Number(balanceResult);
        const decimals = tokenConfig.decimals;
        const formattedBalance = (balanceDecimal / Math.pow(10, decimals)).toFixed(6);

        console.log(`useTokenBalance: ${tokenSymbol} balance:`, formattedBalance);
        setBalance(formattedBalance);

      } catch (err: unknown) {
        console.error('useTokenBalance: Error fetching token balance:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token balance';
        setError(errorMessage);
        setBalance("0");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [isConnected, address, tokenSymbol, chainId]);

  return { balance, loading, error };
};

// New hook for trading contract balances (deposited and locked)
export const useTradingBalance = (tokenSymbol: string, chainId: number, marketId?: string) => {
  const [depositedBalance, setDepositedBalance] = useState<string>("0");
  const [lockedBalance, setLockedBalance] = useState<string>("0");
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { config } = useConfig();

  const fetchTradingBalances = useCallback(async () => {
    if (!isConnected || !address || !config) {
      console.log('useTradingBalance: Skipping fetch - not connected, no address, or no config');
      return;
    }

    // Check if marketId is provided and not empty
    if (!marketId || marketId === '') {
      console.log('useTradingBalance: Skipping fetch - no marketId provided or marketId is empty');
      console.log('useTradingBalance: marketId value:', marketId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get chain configuration
      const chainConfig = configUtils.getChainByChainId(chainId);
      if (!chainConfig) {
        console.error(`Chain config not found for chain ${chainId}`);
        return;
      }

      console.log('useTradingBalance: Fetching trading balances for', tokenSymbol, 'on chain', chainId);
      console.log('useTradingBalance: Market ID:', marketId);
      console.log('useTradingBalance: Chain config for chainId', chainId, ':', chainConfig);
      
      // Get token configuration
      const tokenConfig = chainConfig.tokens[tokenSymbol];
      if (!tokenConfig) {
        console.error(`Token config not found for ${tokenSymbol} on chain ${chainId}`);
        console.log('useTradingBalance: Available tokens on chain', chainId, ':', Object.keys(chainConfig.tokens));
        return;
      }

      const tokenAddress = tokenConfig.address;
      const tradeContractAddress = configUtils.getTradeContractAddress(chainId);
      
      if (!tradeContractAddress) {
        console.error(`Trade contract address not found for chain ${chainId}`);
        return;
      }

      console.log('useTradingBalance: Token address:', tokenAddress);
      console.log('useTradingBalance: Trade contract address:', tradeContractAddress);
      console.log('useTradingBalance: User address:', address);
      console.log('useTradingBalance: Chain ID:', chainId);
      console.log('useTradingBalance: Token symbol:', tokenSymbol);

      // Create custom public client with the correct RPC URL from config
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);
      console.log('useTradingBalance: Using custom public client with RPC URL:', chainConfig.rpcUrl);

      // Read deposited balance (getBalance) - use tokenAddress, not marketId
      console.log('useTradingBalance: Calling getBalance with args:', [address, tokenAddress]);
      const depositedResult = await customPublicClient.readContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MIDRIB_V2_ABI,
        functionName: 'getBalance',
        args: [address as `0x${string}`, tokenAddress as `0x${string}`], // Use tokenAddress, not marketId
      });

      // Read locked balance (getLockedBalance) - use tokenAddress, not marketId
      console.log('useTradingBalance: Calling getLockedBalance with args:', [address, tokenAddress]);
      const lockedResult = await customPublicClient.readContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MIDRIB_V2_ABI,
        functionName: 'getLockedBalance',
        args: [address as `0x${string}`, tokenAddress as `0x${string}`], // Use tokenAddress, not marketId
      });

      console.log('useTradingBalance: Raw results:', {
        deposited: depositedResult,
        locked: lockedResult,
        depositedType: typeof depositedResult,
        lockedType: typeof lockedResult
      });

      // Convert to decimal format
      const decimals = tokenConfig.decimals;
      const depositedDecimal = Number(depositedResult);
      const lockedDecimal = Number(lockedResult);
      
      const formattedDeposited = (depositedDecimal / Math.pow(10, decimals)).toFixed(6);
      const formattedLocked = (lockedDecimal / Math.pow(10, decimals)).toFixed(6);
      const formattedAvailable = formattedDeposited; // Use just the deposited balance

      console.log(`useTradingBalance: ${tokenSymbol} deposited:`, formattedDeposited);
      console.log(`useTradingBalance: ${tokenSymbol} locked:`, formattedLocked);
      console.log(`useTradingBalance: ${tokenSymbol} available:`, formattedAvailable);

      setDepositedBalance(formattedDeposited);
      setLockedBalance(formattedLocked);
      setAvailableBalance(formattedAvailable);

    } catch (err: unknown) {
      console.error('useTradingBalance: Error fetching trading balances:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trading balances';
      setError(errorMessage);
      setDepositedBalance("0");
      setLockedBalance("0");
      setAvailableBalance("0");
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, tokenSymbol, chainId, marketId, config]);

  useEffect(() => {
    fetchTradingBalances();
    
    // Listen for balance refresh events
    const handleBalanceRefresh = () => {
      console.log('useTradingBalance: Received balance refresh event for', tokenSymbol, 'on chain', chainId);
      // Add a small delay to ensure blockchain state has updated
      setTimeout(() => {
        console.log('useTradingBalance: Executing delayed balance refresh for', tokenSymbol, 'on chain', chainId);
        fetchTradingBalances();
      }, 500);
    };
    
    window.addEventListener('balance-refresh', handleBalanceRefresh);
    
    return () => {
      window.removeEventListener('balance-refresh', handleBalanceRefresh);
    };
  }, [isConnected, address, tokenSymbol, chainId, marketId, config, fetchTradingBalances]);

  // Add polling to catch any missed balance updates
  useEffect(() => {
    if (!isConnected || !address || !config || !marketId) return;
    
    // Poll every 15 seconds to ensure balances stay current
    const pollInterval = setInterval(() => {
      console.log('useTradingBalance: Polling balance for', tokenSymbol, 'on chain', chainId);
      fetchTradingBalances();
    }, 15000);
    
    return () => clearInterval(pollInterval);
  }, [isConnected, address, tokenSymbol, chainId, marketId, config, fetchTradingBalances]);

  return { 
    depositedBalance, 
    lockedBalance, 
    availableBalance, 
    loading, 
    error,
    refresh: fetchTradingBalances
  };
}; 