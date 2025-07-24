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