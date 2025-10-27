import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import type { TradingPair } from "@/lib/shared-types";
import { useConfig } from "./useConfig";
import { configUtils } from "../lib/config-utils";
import { BaseOrQuote } from "../lib/shared-types";

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

export const useBalanceManager = (
  tradingPair?: TradingPair,
  currentSide?: BaseOrQuote.BASE | BaseOrQuote.QUOTE,
): {
  availableBalance: string;
  lockedBalance: string;
  balanceLoading: boolean;
  refreshBalance: () => void;
} => {
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [lockedBalance, setLockedBalance] = useState<string>("0");
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);

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

  // Fetch balance for the current trading pair
  const fetchBalance = useCallback(async () => {
    if (
      !isConnected ||
      !address ||
      !tradingPair ||
      !config ||
      currentSide === undefined
    ) {
      setAvailableBalance("0");
      setLockedBalance("0");
      return;
    }

    setBalanceLoading(true);

    try {
      // Determine which token to check balance for based on current side
      let tokenAddress: string;
      let tokenDecimals: number;
      let chainId: number;

      if (currentSide === BaseOrQuote.QUOTE) {
        // BUY side (QUOTE) - need quote token balance (e.g., USDC)
        tokenAddress = tradingPair.quoteChainTokenAddress;
        tokenDecimals = tradingPair.quoteChainTokenDecimals;
        chainId = tradingPair.quoteChainId;
      } else {
        // SELL side (BASE) - need base token balance (e.g., ETH)
        tokenAddress = tradingPair.baseChainTokenAddress;
        tokenDecimals = tradingPair.baseChainTokenDecimals;
        chainId = tradingPair.baseChainId;
      }

      // Get the current chain configuration
      const currentChain = configUtils.getChainByChainId(chainId);

      if (!currentChain || !currentChain.tradeContract) {
        console.warn(
          "❌ useBalanceManager: No trade contract found for chain:",
          chainId,
        );
        setAvailableBalance("0");
        setLockedBalance("0");
        return;
      }

      const customPublicClient = createCustomPublicClient(currentChain.rpcUrl);

      // Check deposited balance (available for trading)
      const depositedBalanceResult = await customPublicClient.readContract({
        address: currentChain.tradeContract.address as `0x${string}`,
        abi: MIDRIB_V2_ABI,
        functionName: "tradeBalance",
        args: [address as `0x${string}`, tokenAddress as `0x${string}`],
      });

      // Check locked balance (in orders)
      const lockedBalanceResult = await customPublicClient.readContract({
        address: currentChain.tradeContract.address as `0x${string}`,
        abi: MIDRIB_V2_ABI,
        functionName: "lockedTradeBalance",
        args: [address as `0x${string}`, tokenAddress as `0x${string}`],
      });

      const depositedBalance = formatBalance(
        depositedBalanceResult as bigint,
        tokenDecimals,
      );
      const lockedBalanceFormatted = formatBalance(
        lockedBalanceResult as bigint,
        tokenDecimals,
      );

      setAvailableBalance(depositedBalance);
      setLockedBalance(lockedBalanceFormatted);
    } catch (error) {
      console.error("Error fetching balance for trading pair:", error);
      setAvailableBalance("0");
      setLockedBalance("0");
    } finally {
      setBalanceLoading(false);
    }
  }, [
    isConnected,
    address,
    tradingPair,
    config,
    currentSide,
    createCustomPublicClient,
    formatBalance,
  ]);

  // Refresh balance function
  const refreshBalance = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Fetch balance when dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    availableBalance,
    lockedBalance,
    balanceLoading,
    refreshBalance,
  };
};
