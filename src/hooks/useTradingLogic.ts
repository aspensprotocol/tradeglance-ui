import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from "wagmi";
import { arborterService } from "@/lib/grpc-client";
import { signOrderWithGlobalProtobuf, OrderData } from "@/lib/signing-utils";
import { useToast } from "@/hooks/use-toast";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useBalanceManager } from "@/hooks/useBalanceManager";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { triggerBalanceRefresh } from "@/lib/utils";
import { BaseOrQuote } from '@/protos/gen/arborter_config_pb';
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

export const useTradingLogic = ({ tradingPair, isSimpleForm = false }: UseTradingLogicOptions) => {
  const [formState, setFormState] = useState<TradingFormState>({
    amount: "",
    price: "",
    percentageValue: null,
    isSubmitting: false
  });

  const { address, isConnected } = useAccount();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const { tradingPairs } = useTradingPairs();
  const publicClient = usePublicClient();
  const { switchToNetwork } = useNetworkSwitch();

  // Get trading balances for the current trading pair
  const { availableBalance, lockedBalance, balanceLoading, refreshBalance } = useBalanceManager(tradingPair);

  // Helper function to determine the correct side based on current chain
  const getCorrectSideForChain = (chainId: number): "buy" | "sell" => {
    const chainConfig = configUtils.getChainByChainId(chainId);
    if (!chainConfig) return "buy";
    
    // Base chain = Sell (ASK), Quote chain = Buy (BID)
    return chainConfig.baseOrQuote === BaseOrQuote.BASE ? "sell" : "buy";
  };

  // Helper function to get the target chain for a given side
  const getTargetChainForSide = (side: "buy" | "sell"): number | null => {
    const allChains = configUtils.getAllChains();
    // Buy orders (BID) go on quote chain, Sell orders (ASK) go on base chain
    const targetBaseOrQuote = side === "buy" ? BaseOrQuote.QUOTE : BaseOrQuote.BASE;
    
    const targetChain = allChains.find(chain => chain.baseOrQuote === targetBaseOrQuote);
    return targetChain ? (typeof targetChain.chainId === 'string' ? parseInt(targetChain.chainId, 10) : targetChain.chainId) : null;
  };

  // Helper function to determine order side based on chain
  const getOrderSideForChain = (chainId: number): "SIDE_BID" | "SIDE_ASK" => {
    const chainConfig = configUtils.getChainByChainId(chainId);
    const isBaseChain = chainConfig?.baseOrQuote === BaseOrQuote.BASE;
    return isBaseChain ? "SIDE_ASK" : "SIDE_BID";
  };

  const handlePercentageClick = (percentage: number) => {
    const availableBalanceNum = parseFloat(availableBalance);
    
    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      toast({
        title: "No available balance",
        description: `Please deposit funds to ${isSimpleForm ? 'simple' : 'trade'}`,
        variant: "destructive",
      });
      return;
    }

    const calculatedAmount = (availableBalanceNum * percentage) / 100;
    setFormState(prev => ({
      ...prev,
      amount: calculatedAmount.toFixed(6),
      percentageValue: percentage
    }));
  };

  const handleMaxClick = () => {
    const availableBalanceNum = parseFloat(availableBalance);
    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      toast({
        title: "No available balance",
        description: `Please deposit funds to ${isSimpleForm ? 'simple' : 'trade'}`,
        variant: "destructive",
      });
      return;
    }
    setFormState(prev => ({
      ...prev,
      amount: availableBalanceNum.toFixed(6),
      percentageValue: 100
    }));
  };

  const validateOrder = (): { isValid: boolean; errorMessage?: string } => {
    if (!isConnected || !address || !currentChainId) {
      return { isValid: false, errorMessage: "Please connect your wallet" };
    }

    if (!tradingPair) {
      return { isValid: false, errorMessage: "Please select a valid trading pair" };
    }

    const quantity = parseFloat(formState.amount);
    if (isNaN(quantity) || quantity <= 0) {
      return { isValid: false, errorMessage: "Please enter a valid amount" };
    }

    // Check if user has enough available balance
    const availableBalanceNum = parseFloat(availableBalance);
    if (isNaN(availableBalanceNum) || quantity > availableBalanceNum) {
      return { isValid: false, errorMessage: `You only have ${availableBalance} ${tradingPair.baseSymbol} available` };
    }

    // For limit orders, validate price
    if (formState.price && (!formState.price || isNaN(parseFloat(formState.price)) || parseFloat(formState.price) <= 0)) {
      return { isValid: false, errorMessage: "Please enter a valid price for limit orders" };
    }

    return { isValid: true };
  };

  const createOrderData = (side: "buy" | "sell", orderType: "limit" | "market" = "limit"): OrderData => {
    if (!tradingPair || !address) {
      throw new Error('Trading pair or address not found');
    }

    const quantity = parseFloat(formState.amount);
    const pairDecimals = tradingPair.pairDecimals;
    
    // Use pair decimals for both signing and transaction
    const orderQuantity = (quantity * Math.pow(10, pairDecimals)).toString();
    const orderPrice = orderType === "limit" && formState.price
      ? (parseFloat(formState.price) * Math.pow(10, pairDecimals)).toString()
      : "";

    // Determine order side based on target chain
    const targetChainId = getTargetChainForSide(side);
    if (!targetChainId) {
      throw new Error(`No target chain found for ${side} side`);
    }
    
    const orderSide = getOrderSideForChain(targetChainId);

    return {
      side: (orderSide === "SIDE_BID" ? 1 : 2), // 1 = BID (buy), 2 = ASK (sell)
      quantity: orderQuantity,
      price: orderPrice,
      marketId: tradingPair.marketId,
      baseAccountAddress: address,
      quoteAccountAddress: address,
      executionType: 0,
      matchingOrderIds: [],
    };
  };

  const submitOrder = async (side: "buy" | "sell", orderType: "limit" | "market" = "limit") => {
    const validation = validateOrder();
    if (!validation.isValid) {
      toast({
        title: "Validation failed",
        description: validation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const orderData = createOrderData(side, orderType);
      const targetChainId = getTargetChainForSide(side);
      
      if (!targetChainId) {
        throw new Error(`No target chain found for ${side} side`);
      }

      // Sign the order with MetaMask using the target chain ID
      const signatureHash = await signOrderWithGlobalProtobuf(orderData, targetChainId);

      // Create the order object for gRPC
      const orderForGrpc = {
        side: orderData.side,
        quantity: orderData.quantity,
        price: orderData.price,
        marketId: orderData.marketId,
        baseAccountAddress: orderData.baseAccountAddress,
        quoteAccountAddress: orderData.quoteAccountAddress,
        executionType: orderData.executionType,
        matchingOrderIds: [],
      };

      // Send the order
      const response = await arborterService.sendOrder(orderForGrpc, signatureHash);

      console.log('Order sent successfully:', response);

      // Success toast
      const actionText = isSimpleForm ? 'Simple order' : `${side} ${orderType} order`;
      toast({
        title: "Order submitted successfully",
        description: `${actionText} for ${formState.amount} ${tradingPair?.baseSymbol} has been submitted`,
      });

      // Reset form
      setFormState({
        amount: "",
        price: "",
        percentageValue: null,
        isSubmitting: false
      });

      // Refresh balances
      refreshBalance();
      triggerBalanceRefresh();

    } catch (error: unknown) {
      console.error('Error submitting order:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to submit order. Please try again.";
      toast({
        title: "Order submission failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Trigger global balance refresh even on error
      triggerBalanceRefresh();
      refreshBalance();
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const updateFormState = (updates: Partial<TradingFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const updateAmount = (amount: string) => {
    setFormState(prev => ({ ...prev, amount }));
  };

  return {
    formState,
    availableBalance,
    lockedBalance,
    balanceLoading,
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
