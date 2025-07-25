import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { readContract } from 'viem/actions';
import { configUtils } from '../lib/config-utils';

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

export const useTokenBalance = (tokenSymbol: string, chainId: number) => {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !address || !tokenSymbol || !chainId || !publicClient) {
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

        // Read token balance using publicClient
        const balanceResult = await publicClient.readContract({
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

      } catch (err: any) {
        console.error('useTokenBalance: Error fetching token balance:', err);
        setError(err.message || 'Failed to fetch token balance');
        setBalance("0");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [isConnected, address, tokenSymbol, chainId, publicClient]);

  return { balance, loading, error };
};

// New hook for trading contract balances (deposited and locked)
export const useTradingBalance = (tokenSymbol: string, chainId: number) => {
  const [depositedBalance, setDepositedBalance] = useState<string>("0");
  const [lockedBalance, setLockedBalance] = useState<string>("0");
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchTradingBalances = async () => {
      if (!isConnected || !address || !tokenSymbol || !chainId || !publicClient) {
        setDepositedBalance("0");
        setLockedBalance("0");
        setAvailableBalance("0");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('useTradingBalance: Fetching trading balances for', tokenSymbol, 'on chain', chainId);
        
        // Get chain and token config
        const chainConfig = configUtils.getChainByChainId(chainId);
        if (!chainConfig) {
          console.error(`Chain config not found for chain ${chainId}`);
          return;
        }

        const tokenConfig = chainConfig.tokens[tokenSymbol];
        if (!tokenConfig) {
          console.error(`Token config not found for ${tokenSymbol} on chain ${chainId}`);
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

        // Read deposited balance (getBalance)
        const depositedResult = await publicClient.readContract({
          address: tradeContractAddress as `0x${string}`,
          abi: MIDRIB_V2_ABI,
          functionName: 'getBalance',
          args: [address as `0x${string}`, tokenAddress as `0x${string}`],
        });

        // Read locked balance (getLockedBalance)
        const lockedResult = await publicClient.readContract({
          address: tradeContractAddress as `0x${string}`,
          abi: MIDRIB_V2_ABI,
          functionName: 'getLockedBalance',
          args: [address as `0x${string}`, tokenAddress as `0x${string}`],
        });

        console.log('useTradingBalance: Raw deposited result:', depositedResult);
        console.log('useTradingBalance: Raw locked result:', lockedResult);

        // Convert balances to human readable format using token decimals
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

      } catch (err: any) {
        console.error('useTradingBalance: Error fetching trading balances:', err);
        setError(err.message || 'Failed to fetch trading balances');
        setDepositedBalance("0");
        setLockedBalance("0");
        setAvailableBalance("0");
      } finally {
        setLoading(false);
      }
    };

    fetchTradingBalances();
  }, [isConnected, address, tokenSymbol, chainId, publicClient]);

  return { 
    depositedBalance, 
    lockedBalance, 
    availableBalance, 
    loading, 
    error 
  };
}; 