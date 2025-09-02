import { useState, useEffect, useCallback, useMemo } from "react";
import { useTradingLogic } from "./useTradingLogic";
import { useNetworkManagement } from "./useNetworkManagement";
import { useUnifiedBalance } from "./useUnifiedBalance";
import type { TradingPair } from "@/lib/shared-types";
import type { Chain } from "../protos/gen/arborter_config_pb";
import { BaseOrQuote } from "../protos/gen/arborter_config_pb";

// MetaMask Network Management Update (August 2025):
// MetaMask has removed the manual network selection dropdown and introduced a new network management system.
// Users must manually switch networks using the globe icon in MetaMask instead of automatic switching.
// This update ensures compatibility with MetaMask's new architecture.

export interface UseFormLogicOptions {
  tradingPair?: TradingPair;
  isSimpleForm?: boolean;
}

export interface FormStateUpdates {
  amount?: string;
  price?: string;
  percentageValue?: number | null;
  isSubmitting?: boolean;
}

export interface UseFormLogicReturn {
  // Form state
  formState: {
    amount: string;
    price?: string;
    percentageValue: number | null;
    isSubmitting: boolean;
  };

  // Network state
  networkState: {
    senderNetwork: string;
    receiverNetwork: string;
  };

  // Trading state
  tradingState: {
    senderToken: string;
    receiverToken: string;
    receiverAmount: string;
    activeTab?: BaseOrQuote.BASE | BaseOrQuote.QUOTE;
    activeOrderType?: "limit" | "market";
    userManuallySelectedSide: boolean;
  };

  // Data
  availableBalance: string;
  walletBalance: string;
  balanceLoading: boolean;
  currentChainId: number | null;
  isConnected: boolean;
  address: string | undefined;
  tradingPairs: TradingPair[];
  chains: Chain[];

  // Actions
  updateAmount: (amount: string) => void;
  updatePrice: (price: string) => void;
  updateFormState: (updates: FormStateUpdates) => void;
  handlePercentageClick: (percentage: number) => void;
  handleMaxClick: () => void;
  handleSubmitOrder: (
    side: BaseOrQuote.BASE | BaseOrQuote.QUOTE,
  ) => Promise<void>;
  handleSwapTokens: () => Promise<void>;

  // Network actions
  handleSenderNetworkChange: (network: string) => void;
  handleReceiverNetworkChange: (network: string) => void;
  swapNetworks: () => Promise<void>;
  validateNetworks: () => { isValid: boolean; error?: string };
  getCurrentChainConfig: () => Chain | null;
  getAllChains: () => Chain[];

  // Trading actions
  getCorrectSideForChain: (
    chainId: number,
  ) => BaseOrQuote.BASE | BaseOrQuote.QUOTE;
  getTargetChainForSide: (
    side: BaseOrQuote.BASE | BaseOrQuote.QUOTE,
  ) => number | null;
  handleSideChange: (newSide: BaseOrQuote.BASE | BaseOrQuote.QUOTE) => void;
  handleOrderTypeChange: (newOrderType: "limit" | "market") => void;
  resetManualSideSelection: () => void;
}

export const useFormLogic = ({
  tradingPair,
  isSimpleForm = false,
}: UseFormLogicOptions): UseFormLogicReturn => {
  // Local form state
  const [senderToken, setSenderToken] = useState<string>("");
  const [receiverToken, setReceiverToken] = useState<string>("");
  const [receiverAmount, setReceiverAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    BaseOrQuote.BASE | BaseOrQuote.QUOTE
  >(BaseOrQuote.BASE);
  const [activeOrderType, setActiveOrderType] = useState<"limit" | "market">(
    "limit",
  );
  const [userManuallySelectedSide, setUserManuallySelectedSide] =
    useState<boolean>(false);

  // Use shared hooks
  const {
    formState,
    balanceLoading,
    currentChainId,
    isConnected,
    address,
    tradingPairs,
    handlePercentageClick,
    handleMaxClick,
    submitOrder,
    updateAmount: updateAmountBase,
    updateFormState: updateFormStateBase,
    getCorrectSideForChain,
    getTargetChainForSide,
  } = useTradingLogic({
    tradingPair,
    isSimpleForm,
    availableBalance: "0", // We'll update this after we calculate the correct balance
  });

  // Get unified balance data with caching
  const { balanceLoading: unifiedBalanceLoading, allBalances } =
    useUnifiedBalance(
      tradingPair,
      activeTab, // Use activeTab instead of getCorrectSideForChain
    );

  // Calculate wallet balance and deposited balance for the current trading side
  const { walletBalance, depositedBalance } = useMemo(() => {
    if (!tradingPair || !allBalances)
      return { walletBalance: "0", depositedBalance: "0" };

    // Use the activeTab instead of getCorrectSideForChain to get the correct side
    // This ensures the balance updates when the user switches between buy/sell
    let targetChainId: number;
    let targetSymbol: string;

    if (activeTab === BaseOrQuote.QUOTE) {
      // BUY side - need quote token balance
      targetChainId = tradingPair.quoteChainId;
      targetSymbol = tradingPair.quoteSymbol;
    } else {
      // SELL side - need base token balance
      targetChainId = tradingPair.baseChainId;
      targetSymbol = tradingPair.baseSymbol;
    }

    const balanceData = allBalances.find(
      (balance) =>
        balance.chainId === targetChainId && balance.symbol === targetSymbol,
    );

    // Debug logging removed for performance

    return {
      walletBalance: balanceData?.walletBalance || "0",
      depositedBalance: balanceData?.depositedBalance || "0",
    };
  }, [tradingPair, activeTab, allBalances]);

  const {
    networkState,
    handleSenderNetworkChange: handleSenderNetworkChangeBase,
    handleReceiverNetworkChange: handleReceiverNetworkChangeBase,
    swapNetworks: swapNetworksBase,
    validateNetworks: validateNetworksBase,
    getCurrentChainConfig,
    getAllChains,
  } = useNetworkManagement();

  // Update tokens when trading pair changes
  useEffect(() => {
    if (tradingPair) {
      // For BUY orders (QUOTE): send quote token, receive base token
      // For SELL orders (BASE): send base token, receive quote token
      // Enum 1 (BASE) = SELL, Enum 2 (QUOTE) = BUY
      if (activeTab === BaseOrQuote.QUOTE) {
        // BUY side - sending quote token, receiving base token
        setSenderToken(tradingPair.quoteSymbol);
        setReceiverToken(tradingPair.baseSymbol);
      } else {
        // SELL side - sending base token, receiving quote token
        setSenderToken(tradingPair.baseSymbol);
        setReceiverToken(tradingPair.quoteSymbol);
      }
    }
  }, [tradingPair, activeTab]);

  // Update receiver amount when sender amount changes (for simple form)
  useEffect(() => {
    if (
      isSimpleForm &&
      formState.amount &&
      !isNaN(parseFloat(formState.amount))
    ) {
      const amount: number = parseFloat(formState.amount);
      // Simple 1:1 conversion for demo purposes
      setReceiverAmount(amount.toFixed(6));
    } else {
      setReceiverAmount("");
    }
  }, [formState.amount, isSimpleForm]);

  // Auto-update active tab based on current chain (for trade form)
  // But only if the user hasn't manually selected a side
  useEffect(() => {
    if (!isSimpleForm && currentChainId && !userManuallySelectedSide) {
      const correctSide: BaseOrQuote.BASE | BaseOrQuote.QUOTE =
        getCorrectSideForChain(currentChainId);

      if (activeTab !== correctSide) {
        setActiveTab(correctSide);
      }
    }
  }, [
    currentChainId,
    activeTab,
    getCorrectSideForChain,
    isSimpleForm,
    userManuallySelectedSide,
  ]);

  // Wrapper functions that add form-specific logic
  const updateAmount = useCallback(
    (amount: string): void => {
      updateAmountBase(amount);
    },
    [updateAmountBase],
  );

  const updateFormState = useCallback(
    (updates: FormStateUpdates): void => {
      updateFormStateBase(updates);
    },
    [updateFormStateBase],
  );

  const handleSubmitOrder = useCallback(
    async (side: BaseOrQuote.BASE | BaseOrQuote.QUOTE): Promise<void> => {
      if (isSimpleForm) {
        // For simple form, validate networks first
        const networkValidation: { isValid: boolean; error?: string } =
          validateNetworksBase();
        if (!networkValidation.isValid) {
          return;
        }

        // Determine the side based on current chain
        const currentChain: Chain | null = getCurrentChainConfig();

        if (
          !currentChain ||
          !currentChain.baseOrQuote ||
          (currentChain.baseOrQuote !== BaseOrQuote.BASE &&
            currentChain.baseOrQuote !== BaseOrQuote.QUOTE)
        ) {
          console.error("Invalid chain configuration for simple order");
          return;
        }

        // Submit the order using shared logic
        await submitOrder(currentChain.baseOrQuote, "limit", depositedBalance);
      } else {
        // For trade form, submit directly with the provided side
        await submitOrder(side, "limit", depositedBalance);
      }
    },
    [
      isSimpleForm,
      validateNetworksBase,
      getCurrentChainConfig,
      submitOrder,
      depositedBalance,
    ],
  );

  const handleSwapTokens = useCallback(async (): Promise<void> => {
    // Store current values before swapping
    const oldSenderToken: string = senderToken;
    const oldReceiverToken: string = receiverToken;
    const oldSenderAmount: string = formState.amount;
    const oldReceiverAmount: string = receiverAmount;

    // Swap the values
    setSenderToken(oldReceiverToken);
    setReceiverToken(oldSenderToken);
    setReceiverAmount(oldSenderAmount);
    updateAmount(oldReceiverAmount);

    // Swap networks using shared logic
    await swapNetworksBase();
  }, [
    senderToken,
    receiverToken,
    formState.amount,
    receiverAmount,
    updateAmount,
    swapNetworksBase,
  ]);

  const handleSenderNetworkChange = useCallback(
    (network: string): void => {
      handleSenderNetworkChangeBase(network);
    },
    [handleSenderNetworkChangeBase],
  );

  const handleReceiverNetworkChange = useCallback(
    (network: string): void => {
      handleReceiverNetworkChangeBase(network);
    },
    [handleReceiverNetworkChangeBase],
  );

  const swapNetworks = useCallback(async (): Promise<void> => {
    await swapNetworksBase();
  }, [swapNetworksBase]);

  const validateNetworks = useCallback((): {
    isValid: boolean;
    error?: string;
  } => {
    return validateNetworksBase();
  }, [validateNetworksBase]);

  const handleSideChange = useCallback(
    (newSide: BaseOrQuote.BASE | BaseOrQuote.QUOTE): void => {
      if (newSide === activeTab) {
        return; // No change needed
      }

      // Get all available chains
      const allChains = getAllChains();
      console.log("FormLogic: Available chains:", allChains); // Debug logging

      // Always allow side change even if chains aren't loaded yet
      // This ensures the toggle works immediately for better UX

      // Update the active tab first
      setActiveTab(newSide);
      setUserManuallySelectedSide(true);

      // Update tokens based on the new side
      if (tradingPair) {
        if (newSide === BaseOrQuote.QUOTE) {
          // BUY side - sending quote token, receiving base token
          setSenderToken(tradingPair.quoteSymbol);
          setReceiverToken(tradingPair.baseSymbol);
        } else {
          // SELL side - sending base token, receiving quote token
          setSenderToken(tradingPair.baseSymbol);
          setReceiverToken(tradingPair.quoteSymbol);
        }
      }

      // With MetaMask's new network management system, we don't automatically switch networks
      // Instead, we provide guidance to the user about which network they should be on
      if (allChains.length > 0) {
        const baseChain = allChains.find(
          (chain) => chain.baseOrQuote === BaseOrQuote.BASE,
        );
        const quoteChain = allChains.find(
          (chain) => chain.baseOrQuote === BaseOrQuote.QUOTE,
        );

        if (baseChain && quoteChain) {
          // Provide guidance about which network the user should be on
          if (newSide === BaseOrQuote.BASE) {
            // BASE side (SELL): user should be on base network
            console.log(
              "FormLogic: Switched to BASE side (SELL) - user should be on",
              baseChain.network,
            );
          } else {
            // QUOTE side (BUY): user should be on quote network
            console.log(
              "FormLogic: Switched to QUOTE side (BUY) - user should be on",
              quoteChain.network,
            );
          }
        } else {
          console.warn(
            "FormLogic: Chain configuration incomplete, but side change succeeded",
            {
              allChains,
              baseChain,
              quoteChain,
            },
          );
        }
      } else {
        console.log(
          "FormLogic: Chains not loaded yet, but side change succeeded",
        );
      }
    },
    [activeTab, getAllChains, tradingPair],
  );

  // Smart side detection based on current network
  const detectAndSetOptimalSide = useCallback((): void => {
    if (!currentChainId) return;

    const currentChain = getCurrentChainConfig();
    if (!currentChain) return;

    // Determine the optimal side based on the current network
    const optimalSide = currentChain.baseOrQuote;

    // IMPORTANT: Only change if the user hasn't manually selected a side
    // This prevents overriding user's manual toggle selection
    if (
      !userManuallySelectedSide &&
      activeTab !== optimalSide &&
      (optimalSide === BaseOrQuote.BASE || optimalSide === BaseOrQuote.QUOTE)
    ) {
      setActiveTab(optimalSide as BaseOrQuote.BASE | BaseOrQuote.QUOTE);
      // Reset the manual selection flag since this is an automatic change
      setUserManuallySelectedSide(false);

      // Update tokens based on the optimal side
      if (tradingPair) {
        if (optimalSide === BaseOrQuote.QUOTE) {
          // BUY side - sending quote token, receiving base token
          setSenderToken(tradingPair.quoteSymbol);
          setReceiverToken(tradingPair.baseSymbol);
        } else {
          // SELL side - sending base token, receiving quote token
          setSenderToken(tradingPair.baseSymbol);
          setReceiverToken(tradingPair.quoteSymbol);
        }
      }

      // Update networks to match the optimal side
      const allChains = getAllChains();
      const baseChain = allChains.find(
        (chain) => chain.baseOrQuote === BaseOrQuote.BASE,
      );
      const quoteChain = allChains.find(
        (chain) => chain.baseOrQuote === BaseOrQuote.QUOTE,
      );

      if (baseChain && quoteChain) {
        if (optimalSide === BaseOrQuote.BASE) {
          // BASE side (SELL): user should be on base network
          console.log(
            "FormLogic: Optimal side is BASE (SELL) - user should be on",
            baseChain.network,
          );
        } else {
          // QUOTE side (BUY): user should be on quote network
          console.log(
            "FormLogic: Optimal side is QUOTE (BUY) - user should be on",
            quoteChain.network,
          );
        }
      }
    }
  }, [
    currentChainId,
    getCurrentChainConfig,
    activeTab,
    userManuallySelectedSide,
    getAllChains,
    tradingPair,
  ]);

  // Auto-detect optimal side when chain changes
  useEffect(() => {
    detectAndSetOptimalSide();
  }, [currentChainId, detectAndSetOptimalSide]);

  // Ensure we always have a valid active tab, even if configuration is loading
  useEffect(() => {
    if (
      !activeTab ||
      (activeTab !== BaseOrQuote.BASE && activeTab !== BaseOrQuote.QUOTE)
    ) {
      console.log("FormLogic: Setting default active tab to BASE (SELL)");
      setActiveTab(BaseOrQuote.BASE);
    }
  }, [activeTab]);

  // Handle order type changes
  const handleOrderTypeChange = useCallback(
    (newOrderType: "limit" | "market"): void => {
      if (newOrderType === activeOrderType) {
        return; // No change needed
      }

      setActiveOrderType(newOrderType);

      // If switching to market order, clear the price
      if (newOrderType === "market") {
        updateFormState({ price: "" });
      }
    },
    [activeOrderType, updateFormState],
  );

  // Update price function
  const updatePrice = useCallback(
    (price: string): void => {
      updateFormState({ price });
    },
    [updateFormState],
  );

  // Reset manual side selection flag
  const resetManualSideSelection = useCallback((): void => {
    setUserManuallySelectedSide(false);
  }, []);

  return {
    // Form state
    formState,

    // Network state
    networkState,

    // Trading state
    tradingState: {
      senderToken,
      receiverToken,
      receiverAmount,
      activeTab,
      activeOrderType,
      userManuallySelectedSide,
    },

    // Data
    availableBalance: depositedBalance, // Use the actual deposited balance from allBalances
    walletBalance,
    balanceLoading: unifiedBalanceLoading || balanceLoading,
    currentChainId,
    isConnected,
    address,
    tradingPairs,
    chains: getAllChains(),

    // Actions
    updateAmount,
    updatePrice,
    updateFormState,
    handlePercentageClick,
    handleMaxClick,
    handleSubmitOrder,
    handleSwapTokens,

    // Network actions
    handleSenderNetworkChange,
    handleReceiverNetworkChange,
    swapNetworks,
    validateNetworks,
    getCurrentChainConfig,
    getAllChains,

    // Trading actions
    getCorrectSideForChain,
    getTargetChainForSide,
    handleSideChange,
    handleOrderTypeChange,
    resetManualSideSelection,
  };
};
