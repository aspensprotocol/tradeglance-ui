import { useState } from "react";
import { useAccount } from "wagmi";
import { arborterService } from "@/lib/grpc-client";
import {
  signOrderWithGlobalProtobuf,
  OrderCreationData,
} from "@/lib/signing-utils";
import { OrderSchema, Side, ExecutionType } from "@/protos/gen/arborter_pb";
import { create } from "@bufbuild/protobuf";
import { useToast } from "@/hooks/use-toast";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useBalanceManager } from "@/hooks/useBalanceManager";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { triggerBalanceRefresh, triggerOrderbookRefresh } from "@/lib/utils";
import { BaseOrQuote } from "@/protos/gen/arborter_config_pb";
import { TradingPair } from "@/hooks/useTradingPairs";

export interface TradingFormState {
  amount: string;
  price?: string;
  percentageValue: number | null;
  isSubmitting: boolean;
}

export interface UseTradingLogicOptions {
  tradingPair?: TradingPair;
  isSimpleForm?: boolean;
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
  validateOrder: (side: TradingSide) => { isValid: boolean; error?: string };
  submitOrder: (side: TradingSide) => Promise<void>;
  updateFormState: (updates: Partial<TradingFormState>) => void;
  updateAmount: (amount: string) => void;
  getCorrectSideForChain: (chainId: number) => TradingSide;
  getTargetChainForSide: (side: TradingSide) => number | null;
  getOrderSideForChain: (chainId: number) => Side;
}

export const useTradingLogic = ({
  tradingPair,
  isSimpleForm = false,
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
    const chainConfig = configUtils.getChainByChainId(chainId);
    if (!chainConfig) return BaseOrQuote.BASE; // Default to BASE (sell) if no config

    // Base chain = Sell (ASK), Quote chain = Buy (BID)
    // Enum 1 (BASE) = SELL, Enum 2 (QUOTE) = BUY
    return chainConfig.baseOrQuote === BaseOrQuote.BASE
      ? BaseOrQuote.BASE
      : BaseOrQuote.QUOTE;
  };

  // Get trading balances for the current trading pair
  const currentSide = currentChainId
    ? getCorrectSideForChain(currentChainId)
    : undefined;
  const { availableBalance, lockedBalance, balanceLoading, refreshBalance } =
    useBalanceManager(tradingPair, currentSide);

  // Helper function to get the target chain for a given side
  const getTargetChainForSide = (side: TradingSide): number | null => {
    const allChains = configUtils.getAllChains();
    // Sell orders (ASK) go on base chain, Buy orders (BID) go on quote chain
    const targetBaseOrQuote: BaseOrQuote =
      side === BaseOrQuote.BASE ? BaseOrQuote.BASE : BaseOrQuote.QUOTE;

    const targetChain = allChains.find(
      (chain) => chain.baseOrQuote === targetBaseOrQuote,
    );
    return targetChain
      ? typeof targetChain.chainId === "string"
        ? parseInt(targetChain.chainId, 10)
        : targetChain.chainId
      : null;
  };

  // Helper function to determine order side based on chain
  const getOrderSideForChain = (chainId: number): Side => {
    const chainConfig = configUtils.getChainByChainId(chainId);
    const isBaseChain: boolean = chainConfig?.baseOrQuote === BaseOrQuote.BASE;
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

  const validateOrder = (): { isValid: boolean; errorMessage?: string } => {
    if (!isConnected || !address || !currentChainId) {
      return { isValid: false, errorMessage: "Please connect your wallet" };
    }

    if (!tradingPair) {
      return {
        isValid: false,
        errorMessage: "Please select a valid trading pair",
      };
    }

    const quantity: number = parseFloat(formState.amount);
    if (isNaN(quantity) || quantity <= 0) {
      return { isValid: false, errorMessage: "Please enter a valid amount" };
    }

    // Check if user has enough available balance
    const availableBalanceNum: number = parseFloat(availableBalance);
    if (isNaN(availableBalanceNum) || quantity > availableBalanceNum) {
      // Get the correct token symbol based on current side
      const tokenSymbol =
        currentSide === BaseOrQuote.QUOTE
          ? tradingPair.quoteSymbol
          : tradingPair.baseSymbol;
      return {
        isValid: false,
        errorMessage: `You only have ${availableBalance} ${tokenSymbol} available`,
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
    const pairDecimals: number = tradingPair.pairDecimals;

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

    return {
      side: orderSide,
      quantity: orderQuantity,
      price: orderPrice,
      marketId: tradingPair.id,
      baseAccountAddress: address,
      quoteAccountAddress: address,
      executionType: ExecutionType.UNSPECIFIED,
      matchingOrderIds: [],
    };
  };

  const submitOrder = async (
    side: TradingSide,
    orderType: "limit" | "market" = "limit",
  ): Promise<void> => {
    const validation: { isValid: boolean; errorMessage?: string } =
      validateOrder();
    if (!validation.isValid) {
      toast({
        title: "Validation failed",
        description: validation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const orderData: OrderCreationData = createOrderData(side, orderType);
      const targetChainId: number | null = getTargetChainForSide(side);

      if (!targetChainId) {
        throw new Error(`No target chain found for ${side} side`);
      }

      // Sign the order with MetaMask using the target chain ID
      const signatureHash: Uint8Array = await signOrderWithGlobalProtobuf(
        orderData,
        targetChainId,
      );

      // Create the order object for gRPC using protobuf Order type
      const orderForGrpc = create(OrderSchema, {
        side: orderData.side,
        quantity: orderData.quantity,
        price: orderData.price,
        marketId: orderData.marketId,
        baseAccountAddress: orderData.baseAccountAddress,
        quoteAccountAddress: orderData.quoteAccountAddress,
        executionType: orderData.executionType,
        matchingOrderIds: orderData.matchingOrderIds.map((id) => BigInt(id)), // Convert number[] to bigint[]
      });

      // Send the order
      const response = await arborterService.sendOrder(
        orderForGrpc,
        signatureHash,
      );

      console.log("Order sent successfully:", response);

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

      const errorMessage: string =
        error instanceof Error
          ? error.message
          : "Failed to submit order. Please try again.";
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
