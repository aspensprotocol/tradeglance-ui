import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import { configUtils } from "../lib/config-utils";
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
    name: "tradeBalance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "depositorAddress", type: "address" },
      { name: "tokenContract", type: "address" },
    ],
    name: "lockedTradeBalance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

// Helper function to create a custom public client with the correct RPC URL
const createCustomPublicClient = (
  rpcUrl: string,
): ReturnType<typeof createPublicClient> => {
  return createPublicClient({
    transport: http(rpcUrl),
  });
};

export const useTokenBalance = (
  tokenSymbol: string,
  chainId: number,
): {
  balance: string;
  loading: boolean;
  error: string | null;
} => {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !address || !tokenSymbol || !chainId) {
        setBalance("0");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get chain and token config
        const chainConfig = configUtils.getChainByChainId(chainId);
        if (!chainConfig) {
          console.error(`Chain config not found for chain ${chainId}`);
          setBalance("0");
          return;
        }

        const tokenConfig = chainConfig.tokens[tokenSymbol];
        if (!tokenConfig) {
          console.error(
            `Token config not found for ${tokenSymbol} on chain ${chainId}`,
          );
          setBalance("0");
          return;
        }

        const tokenAddress = tokenConfig.address;

        // Create custom public client with the correct RPC URL from config
        const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

        // Read token balance using custom publicClient
        const balanceResult = await customPublicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });

        // Convert balance to human readable format using token decimals
        const balanceDecimal = Number(balanceResult);
        const { decimals } = tokenConfig;
        const formattedBalance = (
          balanceDecimal / Math.pow(10, decimals)
        ).toFixed(6);

        setBalance(formattedBalance);
      } catch (err: unknown) {
        console.error("useTokenBalance: Error fetching token balance:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch token balance";
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
export const useTradingBalance = (
  tokenSymbol: string,
  chainId: number,
  marketId?: string,
): {
  depositedBalance: string;
  lockedBalance: string;
  availableBalance: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} => {
  const [depositedBalance, setDepositedBalance] = useState<string>("0");
  const [lockedBalance, setLockedBalance] = useState<string>("0");
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { config } = useConfig();

  const fetchTradingBalances = useCallback(async () => {
    if (!isConnected || !address || !config) {
      return;
    }

    // Check if marketId is provided and not empty
    if (!marketId || marketId === "") {
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

      // Get token configuration
      const tokenConfig = chainConfig.tokens[tokenSymbol];
      if (!tokenConfig) {
        console.error(
          `Token config not found for ${tokenSymbol} on chain ${chainId}`,
        );

        return;
      }

      const tokenAddress = tokenConfig.address;
      const tradeContractAddress = configUtils.getTradeContractAddress(chainId);

      if (!tradeContractAddress) {
        console.error(`Trade contract address not found for chain ${chainId}`);
        return;
      }

      // Create custom public client with the correct RPC URL from config
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      // Read deposited balance (tradeBalance) - use tokenAddress, not marketId
      const depositedResult = await customPublicClient.readContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MIDRIB_V2_ABI,
        functionName: "tradeBalance",
        args: [address as `0x${string}`, tokenAddress as `0x${string}`], // Use tokenAddress, not marketId
      });

      // Read locked balance (lockedTradeBalance) - use tokenAddress, not marketId
      const lockedResult = await customPublicClient.readContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MIDRIB_V2_ABI,
        functionName: "lockedTradeBalance",
        args: [address as `0x${string}`, tokenAddress as `0x${string}`], // Use tokenAddress, not marketId
      });

      // Convert to decimal format
      const { decimals } = tokenConfig;
      const depositedDecimal = Number(depositedResult);
      const lockedDecimal = Number(lockedResult);

      const formattedDeposited = (
        depositedDecimal / Math.pow(10, decimals)
      ).toFixed(6);
      const formattedLocked = (lockedDecimal / Math.pow(10, decimals)).toFixed(
        6,
      );
      const formattedAvailable = formattedDeposited; // Use just the deposited balance

      setDepositedBalance(formattedDeposited);
      setLockedBalance(formattedLocked);
      setAvailableBalance(formattedAvailable);
    } catch (err: unknown) {
      console.error("useTradingBalance: Error fetching trading balances:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch trading balances";
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
    const handleBalanceRefresh = (): void => {
      // Add a small delay to ensure blockchain state has updated
      setTimeout(() => {
        fetchTradingBalances();
      }, 500);
    };

    window.addEventListener("balance-refresh", handleBalanceRefresh);

    return () => {
      window.removeEventListener("balance-refresh", handleBalanceRefresh);
    };
  }, [
    isConnected,
    address,
    tokenSymbol,
    chainId,
    marketId,
    config,
    fetchTradingBalances,
  ]);

  // Add polling to catch any missed balance updates
  useEffect(() => {
    if (!isConnected || !address || !config || !marketId) return;

    // Poll every 15 seconds to ensure balances stay current
    const pollInterval = setInterval(() => {
      fetchTradingBalances();
    }, 15000);

    // eslint-disable-next-line consistent-return
    return (): void => {
      clearInterval(pollInterval);
    };
  }, [
    isConnected,
    address,
    tokenSymbol,
    chainId,
    marketId,
    config,
    fetchTradingBalances, // Include it since it's memoized with stable dependencies
  ]);

  return {
    depositedBalance,
    lockedBalance,
    availableBalance,
    loading,
    error,
    refresh: fetchTradingBalances,
  };
};
