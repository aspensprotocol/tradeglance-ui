import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import { useConfig } from "./useConfig";

// ERC-20 Token ABI for balanceOf function
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

// MidribV2 Contract ABI for trading balances
const MIDRIB_V2_ABI = [
  {
    constant: true,
    inputs: [
      { name: "depositorAddress", type: "address" },
      { name: "tokenContract", type: "address" },
    ],
    name: "getBalance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "depositorAddress", type: "address" },
      { name: "tokenContract", type: "address" },
    ],
    name: "getLockedBalance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

export interface TokenBalance {
  symbol: string;
  chainId: number;
  network: string;
  tokenAddress: string;
  decimals: number;
  walletBalance: string;
  depositedBalance: string;
  lockedBalance: string;
  hasAnyBalance: boolean;
}

export const useAllBalances = (): {
  balances: TokenBalance[];
  loading: boolean;
  error: string | null;
  refreshBalances: () => void;
  hasAnyBalances: boolean;
} => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { config } = useConfig();

  // Helper function to create a custom public client with the correct RPC URL
  const createCustomPublicClient = useCallback((rpcUrl: string) => {
    return createPublicClient({
      transport: http(rpcUrl),
    });
  }, []);

  // Helper function to format balance with decimals
  const formatBalance = useCallback(
    (balance: bigint, decimals: number): string => {
      const divisor = BigInt(10 ** decimals);
      const wholePart = balance / divisor;
      const fractionalPart = balance % divisor;

      if (fractionalPart === BigInt(0)) {
        return wholePart.toString();
      }

      const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
      return `${wholePart}.${fractionalStr}`;
    },
    [],
  );

  // Check balances for a specific token
  const checkTokenBalances = useCallback(
    async (
      tokenSymbol: string,
      chainId: number,
      network: string,
      tokenAddress: string,
      decimals: number,
      rpcUrl: string,
      tradeContractAddress: string,
    ): Promise<TokenBalance> => {
      try {
        const customPublicClient = createCustomPublicClient(rpcUrl);

        // Check wallet balance
        const walletBalanceResult = await customPublicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });

        // Check deposited balance (available for trading)
        const depositedBalanceResult = await customPublicClient.readContract({
          address: tradeContractAddress as `0x${string}`,
          abi: MIDRIB_V2_ABI,
          functionName: "getBalance",
          args: [address as `0x${string}`, tokenAddress as `0x${string}`],
        });

        // Check locked balance (in orders)
        const lockedBalanceResult = await customPublicClient.readContract({
          address: tradeContractAddress as `0x${string}`,
          abi: MIDRIB_V2_ABI,
          functionName: "getLockedBalance",
          args: [address as `0x${string}`, tokenAddress as `0x${string}`],
        });

        const walletBalance = formatBalance(
          walletBalanceResult as bigint,
          decimals,
        );
        const depositedBalance = formatBalance(
          depositedBalanceResult as bigint,
          decimals,
        );
        const lockedBalance = formatBalance(
          lockedBalanceResult as bigint,
          decimals,
        );

        const hasAnyBalance =
          parseFloat(walletBalance) > 0 ||
          parseFloat(depositedBalance) > 0 ||
          parseFloat(lockedBalance) > 0;

        return {
          symbol: tokenSymbol,
          chainId,
          network,
          tokenAddress,
          decimals,
          walletBalance,
          depositedBalance,
          lockedBalance,
          hasAnyBalance,
        };
      } catch (err) {
        console.error(
          `Error checking balances for ${tokenSymbol} on ${network}:`,
          err,
        );
        // Return zero balances on error
        return {
          symbol: tokenSymbol,
          chainId,
          network,
          tokenAddress,
          decimals,
          walletBalance: "0",
          depositedBalance: "0",
          lockedBalance: "0",
          hasAnyBalance: false,
        };
      }
    },
    [address, createCustomPublicClient, formatBalance],
  );

  const fetchAllBalances = useCallback(async () => {
    if (!isConnected || !address || !config) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allBalances: TokenBalance[] = [];

      // Check balances for all tokens across all chains
      for (const chain of config.chains) {
        const chainTokens = Object.keys(chain.tokens);

        for (const tokenSymbol of chainTokens) {
          const token = chain.tokens[tokenSymbol];
          if (!token || !chain.tradeContract) continue;

          const balance = await checkTokenBalances(
            tokenSymbol,
            chain.chainId,
            chain.network,
            token.address,
            token.decimals,
            chain.rpcUrl,
            chain.tradeContract.address,
          );

          allBalances.push(balance);
        }
      }

      // Only keep tokens that have any balance
      const tokensWithBalances = allBalances.filter(
        (balance: TokenBalance) => balance.hasAnyBalance,
      );

      setBalances(tokensWithBalances);
      console.log("All balances fetched:", tokensWithBalances);
    } catch (err) {
      console.error("Failed to fetch all balances:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, config, checkTokenBalances]);

  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  const refreshBalances = (): void => {
    fetchAllBalances();
  };

  return {
    balances,
    loading,
    error,
    refreshBalances,
    hasAnyBalances: balances.length > 0,
  };
};
