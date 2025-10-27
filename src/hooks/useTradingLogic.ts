import { useState } from "react";
import { useAccount } from "wagmi";
import { useTradingPairs } from "./useTradingPairs";
import type { TradingPair } from "@/lib/shared-types";
import { BaseOrQuote } from "@/lib/shared-types";
import { arborterService } from "@/lib/grpc-client";
import type { OrderCreationData } from "@/lib/shared-types";
import { Side } from "@/protos/gen/arborter_pb";
import {
  ExecutionType,
  OrderSchema,
  type Order,
} from "@/protos/gen/arborter_pb";
import { create } from "@bufbuild/protobuf";
import { useBalanceManager } from "@/hooks/useBalanceManager";
import { triggerBalanceRefresh, triggerOrderbookRefresh } from "@/lib/utils";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useToast } from "@/hooks/use-toast";
import { signOrderWithGlobalProtobuf } from "@/lib/signing-utils";

export interface TradingFormState {
  amount: string;
  price?: string;
  percentageValue: number | null;
  isSubmitting: boolean;
}

export interface UseTradingLogicOptions {
  tradingPair?: TradingPair;
  isSimpleForm?: boolean;
  availableBalance?: string; // Allow passing in the correct available balance
}

// Define the valid trading sides (excluding UNSPECIFIED)
type TradingSide = BaseOrQuote.BASE | BaseOrQuote.QUOTE;

export interface UseTradingLogicReturn {
  formState: TradingFormState;
  availableBalance: string;
  lockedBalance: string;
  balanceLoading: boolean;
  refreshBalance: () => void;
  currentChainId: number | null;
  isConnected: boolean;
  address: string | undefined;
  tradingPairs: TradingPair[];
  handlePercentageClick: (percentage: number) => void;
  handleMaxClick: () => void;
  validateOrder: (
    side: TradingSide,
    availableBalance?: string,
  ) => { isValid: boolean; errorMessage?: string };
  submitOrder: (
    side: TradingSide,
    orderType?: "limit" | "market",
    customAvailableBalance?: string,
  ) => Promise<void>;
  updateFormState: (updates: Partial<TradingFormState>) => void;
  updateAmount: (amount: string) => void;
  getCorrectSideForChain: (chainId: number) => TradingSide;
  getTargetChainForSide: (side: TradingSide) => number | null;
  getOrderSideForChain: (chainId: number) => Side;
}

export const useTradingLogic = ({
  tradingPair,
  isSimpleForm = false,
  availableBalance: externalAvailableBalance,
}: UseTradingLogicOptions): UseTradingLogicReturn => {
  const [formState, setFormState] = useState<TradingFormState>({
    amount: "",
    price: "",
    percentageValue: null,
    isSubmitting: false,
  });

  const { address, isConnected } = useAccount();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const { tradingPairs } = useTradingPairs();

  // Helper function to determine the correct side based on current chain
  const getCorrectSideForChain = (chainId: number): TradingSide => {
    if (!tradingPair) return BaseOrQuote.BASE; // Default to BASE (sell) if no trading pair

    // In the new format, determine if this chain is the base or quote chain
    // by comparing with the trading pair's chain IDs
    const isBaseChain: boolean = chainId === tradingPair.baseChainId;
    
    // Base chain = Sell (BASE), Quote chain = Buy (QUOTE)
    return isBaseChain ? BaseOrQuote.BASE : BaseOrQuote.QUOTE;
  };

  // Get trading balances for the current trading pair
  const currentSide = currentChainId
    ? getCorrectSideForChain(currentChainId)
    : undefined;
  const {
    availableBalance: internalAvailableBalance,
    lockedBalance,
    balanceLoading,
    refreshBalance,
  } = useBalanceManager(tradingPair, currentSide);

  // Use external available balance if provided, otherwise use internal
  const availableBalance = externalAvailableBalance || internalAvailableBalance;

  // Helper function to get the target chain for a given side
  const getTargetChainForSide = (side: TradingSide): number | null => {
    if (!tradingPair) {
      return null;
    }

    // In the new format, the market determines which chain is base vs quote
    // Sell orders (ASK) go on base chain, Buy orders (BID) go on quote chain
    if (side === BaseOrQuote.BASE) {
      // BASE side (SELL) - use the base chain from the trading pair
      return tradingPair.baseChainId;
    }
    // QUOTE side (BUY) - use the quote chain from the trading pair
    return tradingPair.quoteChainId;
  };

  // Helper function to determine order side based on chain
  const getOrderSideForChain = (chainId: number): Side => {
    if (!tradingPair) {
      return Side.ASK; // Default to ASK if no trading pair
    }

    // In the new format, determine if this chain is the base or quote chain
    // by comparing with the trading pair's chain IDs
    const isBaseChain: boolean = chainId === tradingPair.baseChainId;
    // Base chain = ASK (sell), Quote chain = BID (buy)
    return isBaseChain ? Side.ASK : Side.BID;
  };

  const handlePercentageClick = (percentage: number): void => {
    const availableBalanceNum: number = parseFloat(availableBalance);

    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      // Get the correct token symbol based on current side
      const tokenSymbol =
        currentSide === BaseOrQuote.QUOTE
          ? tradingPair?.quoteSymbol
          : tradingPair?.baseSymbol;
      toast({
        title: "No available balance",
        description: `Please deposit ${tokenSymbol || "funds"} to ${isSimpleForm ? "simple" : "trade"}`,
        variant: "destructive",
      });
      return;
    }

    const calculatedAmount: number = (availableBalanceNum * percentage) / 100;
    setFormState((prev) => ({
      ...prev,
      amount: calculatedAmount.toFixed(6),
      percentageValue: percentage,
    }));
  };

  const handleMaxClick = (): void => {
    const availableBalanceNum: number = parseFloat(availableBalance);
    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      // Get the correct token symbol based on current side
      const tokenSymbol =
        currentSide === BaseOrQuote.QUOTE
          ? tradingPair?.quoteSymbol
          : tradingPair?.baseSymbol;
      toast({
        title: "No available balance",
        description: `Please deposit ${tokenSymbol || "funds"} to ${isSimpleForm ? "simple" : "trade"}`,
        variant: "destructive",
      });
      return;
    }
    setFormState((prev) => ({
      ...prev,
      amount: availableBalanceNum.toFixed(6),
      percentageValue: 100,
    }));
  };

  const validateOrder = (
    side: TradingSide,
    customAvailableBalance?: string,
  ): { isValid: boolean; errorMessage?: string } => {
    console.log("🔍 validateOrder: Starting validation with:", {
      side,
      customAvailableBalance,
      availableBalance,
      isConnected,
      address,
      currentChainId,
      tradingPair,
      formStateAmount: formState.amount,
    });

    if (!isConnected || !address || !currentChainId) {
      console.log("❌ validateOrder: Wallet not connected");
      return { isValid: false, errorMessage: "Please connect your wallet" };
    }

    if (!tradingPair) {
      console.log("❌ validateOrder: No trading pair selected");
      return {
        isValid: false,
        errorMessage: "Please select a valid trading pair",
      };
    }

    const quantity: number = parseFloat(formState.amount);
    console.log("🔍 validateOrder: Parsed quantity:", quantity);
    if (isNaN(quantity) || quantity <= 0) {
      console.log("❌ validateOrder: Invalid quantity");
      return { isValid: false, errorMessage: "Please enter a valid amount" };
    }

    // Check if user has enough available balance
    const balanceToCheck = customAvailableBalance || availableBalance;
    const availableBalanceNum: number = parseFloat(balanceToCheck);
    console.log("🔍 validateOrder: Balance check:", {
      balanceToCheck,
      availableBalanceNum,
      quantity,
      isNaN: isNaN(availableBalanceNum),
      exceedsBalance: quantity > availableBalanceNum,
    });

    if (isNaN(availableBalanceNum) || quantity > availableBalanceNum) {
      // Get the correct token symbol based on the actual trading side (not current chain)
      const tokenSymbol =
        side === BaseOrQuote.QUOTE
          ? tradingPair.quoteSymbol
          : tradingPair.baseSymbol;
      return {
        isValid: false,
        errorMessage: `You only have ${balanceToCheck} ${tokenSymbol} available`,
      };
    }

    // For limit orders, validate price
    if (
      formState.price &&
      (!formState.price ||
        isNaN(parseFloat(formState.price)) ||
        parseFloat(formState.price) <= 0)
    ) {
      return {
        isValid: false,
        errorMessage: "Please enter a valid price for limit orders",
      };
    }

    return { isValid: true };
  };

  const createOrderData = (
    side: TradingSide,
    orderType: "limit" | "market" = "limit",
  ): OrderCreationData => {
    if (!tradingPair || !address) {
      throw new Error("Trading pair or address not found");
    }

    const quantity: number = parseFloat(formState.amount);
    const { pairDecimals } = tradingPair;

    // Use pair decimals for both signing and transaction
    const orderQuantity: string = (
      quantity * Math.pow(10, pairDecimals)
    ).toString();
    const orderPrice: string =
      orderType === "limit" && formState.price
        ? (parseFloat(formState.price) * Math.pow(10, pairDecimals)).toString()
        : "";

    // Determine order side based on target chain
    const targetChainId: number | null = getTargetChainForSide(side);
    if (!targetChainId) {
      throw new Error(`No target chain found for ${side} side`);
    }

    const orderSide: Side = getOrderSideForChain(targetChainId);

    const orderData = {
      side: orderSide,
      quantity: orderQuantity,
      price: orderPrice,
      marketId: tradingPair.id,
      baseAccountAddress: address,
      quoteAccountAddress: address,
      executionType: ExecutionType.UNSPECIFIED,
      matchingOrderIds: [],
    };

    console.log("🔍 useTradingLogic: Order data created:", {
      ...orderData,
      tradingPair: {
        id: tradingPair.id,
        baseChainId: tradingPair.baseChainId,
        quoteChainId: tradingPair.quoteChainId,
        baseChainNetwork: tradingPair.baseChainNetwork,
        quoteChainNetwork: tradingPair.quoteChainNetwork,
      },
      targetChainId,
      side: side === BaseOrQuote.BASE ? "BASE" : "QUOTE",
    });

    return orderData;
  };

  const submitOrder = async (
    side: TradingSide,
    orderType: "limit" | "market" = "limit",
    customAvailableBalance?: string,
    retryCount: number = 0,
  ): Promise<void> => {
    console.log("🔍 useTradingLogic: About to validate order:", {
      side,
      customAvailableBalance,
      availableBalance,
      currentSide,
      retryCount,
    });

    const validation: { isValid: boolean; errorMessage?: string } =
      validateOrder(side, customAvailableBalance);

    console.log("🔍 useTradingLogic: Validation result:", validation);

    if (!validation.isValid) {
      console.error(
        "❌ useTradingLogic: Order validation failed:",
        validation.errorMessage,
      );
      toast({
        title: "Validation failed",
        description: validation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    console.log(
      "✅ useTradingLogic: Order validation passed, proceeding to sign and submit",
    );

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const orderData: OrderCreationData = createOrderData(side, orderType);
      const targetChainId: number | null = getTargetChainForSide(side);

      if (!targetChainId) {
        throw new Error(`No target chain found for ${side} side`);
      }

      // Sign the order with MetaMask using the target chain ID
      // IMPORTANT: MetaMask removed eth_sign in August 2025, so we must use personal_sign
      // personal_sign adds a prefix, but we'll work around this by using a different approach
      const signMessage = async (message: string): Promise<string> => {
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed");
        }

        // Use personal_sign to sign the raw protobuf bytes
        // Note: personal_sign adds a prefix, but we'll handle this in the backend
        // The backend will need to be updated to handle personal_sign signatures
        console.log("🔍 useTradingLogic: About to call personal_sign with:", {
          address,
          message,
        });

        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, address],
        });

        console.log("✅ useTradingLogic: personal_sign returned:", signature);
        return signature;
      };

      console.log("🔍 useTradingLogic: About to create signature...");

      const signatureHash: Uint8Array = await signOrderWithGlobalProtobuf(
        orderData,
        targetChainId,
        signMessage,
      );

      console.log(
        "✅ useTradingLogic: Signature created successfully:",
        signatureHash,
      );

      // Create the order object for gRPC using protobuf Order type
      const orderForGrpc: Order = create(OrderSchema, {
        side: orderData.side,
        quantity: orderData.quantity,
        price: orderData.price,
        marketId: orderData.marketId,
        baseAccountAddress: orderData.baseAccountAddress,
        quoteAccountAddress: orderData.quoteAccountAddress,
        executionType: orderData.executionType,
        matchingOrderIds: orderData.matchingOrderIds?.map((id) => BigInt(id)) || [],
      });

      // Send the order
      await arborterService.sendOrder(orderForGrpc, signatureHash);

      // Success toast - convert TradingSide to display text
      // Enum 1 (BASE) = SELL, Enum 2 (QUOTE) = BUY
      const sideDisplay = side === BaseOrQuote.BASE ? "Sell" : "Buy";
      const actionText: string = isSimpleForm
        ? "Simple order"
        : `${sideDisplay} ${orderType} order`;
      // Get the correct token symbol based on the side
      const tokenSymbol =
        side === BaseOrQuote.QUOTE
          ? tradingPair?.quoteSymbol
          : tradingPair?.baseSymbol;
      toast({
        title: "Order submitted successfully",
        description: `${actionText} for ${formState.amount} ${tokenSymbol} has been submitted`,
      });

      // Reset form
      setFormState({
        amount: "",
        price: "",
        percentageValue: null,
        isSubmitting: false,
      });

      // Refresh balances
      refreshBalance();
      triggerBalanceRefresh();
      triggerOrderbookRefresh();
    } catch (error: unknown) {
      console.error("Error submitting order:", error);

      // Convert error to string for analysis
      const errorString =
        error instanceof Error ? error.message : String(error);
      const errorStringLower = errorString.toLowerCase();

      // Check if this is a retryable error
      const isRetryable = 
        errorStringLower.includes("trading service is temporarily overloaded") ||
        errorStringLower.includes("connection to trading service was reset") ||
        errorStringLower.includes("request timed out") ||
        errorStringLower.includes("network error occurred") ||
        errorStringLower.includes("network connection was interrupted") ||
        errorStringLower.includes("backend communication error") ||
        errorStringLower.includes("request was cancelled") ||
        errorStringLower.includes("503") ||
        errorStringLower.includes("service unavailable") ||
        errorStringLower.includes("upstream connect error") ||
        errorStringLower.includes("reset before headers") ||
        errorStringLower.includes("incomplete chunked encoding");

      // If it's retryable and we haven't exceeded max retries, retry
      const maxRetries = 2;
      if (isRetryable && retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 3000); // Exponential backoff, max 3s
        console.log(`🔄 Retrying order submission in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        toast({
          title: "Retrying order submission",
          description: `Attempt ${retryCount + 2} of ${maxRetries + 1}. Please wait...`,
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the order submission
        return submitOrder(side, orderType, customAvailableBalance, retryCount + 1);
      }

      // Enhanced error handling with more specific error messages
      let errorMessage: string;

      // Check for specific error types
      if (
        errorStringLower.includes("signature") ||
        errorStringLower.includes("invalid signature")
      ) {
        errorMessage = "Signature validation failed. Please try again.";
      } else if (
        errorStringLower.includes("balance") ||
        errorStringLower.includes("insufficient")
      ) {
        errorMessage =
          "Insufficient balance. Please check your available tokens.";
      } else if (
        errorStringLower.includes("network") ||
        errorStringLower.includes("connection") ||
        errorStringLower.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (errorStringLower.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (
        errorStringLower.includes("grpc") ||
        errorStringLower.includes("rpc")
      ) {
        errorMessage = "Backend communication error. Please try again.";
      } else if (errorStringLower.includes("cors")) {
        errorMessage = "CORS error. Please check your connection.";
      } else if (
        errorStringLower.includes("aborted") ||
        errorStringLower.includes("cancelled")
      ) {
        errorMessage = "Request was cancelled. Please try again.";
      } else {
        // Show the actual error message if available
        errorMessage =
          error instanceof Error
            ? `Order submission failed: ${error.message}`
            : `Order submission failed: ${String(error)}`;
      }

      // Add retry information to error message if we've exhausted retries
      if (isRetryable && retryCount >= maxRetries) {
        errorMessage += " (All retry attempts exhausted)";
      }

      toast({
        title: "Order submission failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Trigger global balance refresh even on error
      triggerBalanceRefresh();
      refreshBalance();
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const updateFormState = (updates: Partial<TradingFormState>): void => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const updateAmount = (amount: string): void => {
    setFormState((prev) => ({ ...prev, amount }));
  };

  return {
    formState,
    availableBalance,
    lockedBalance,
    balanceLoading,
    refreshBalance,
    currentChainId,
    isConnected,
    address,
    tradingPairs,
    handlePercentageClick,
    handleMaxClick,
    validateOrder,
    submitOrder,
    updateFormState,
    updateAmount,
    getCorrectSideForChain,
    getTargetChainForSide,
    getOrderSideForChain,
  };
};
