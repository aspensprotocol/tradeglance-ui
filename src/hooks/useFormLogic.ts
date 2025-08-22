import { useState, useEffect, useCallback, useMemo } from "react";
import { useTradingLogic } from "./useTradingLogic";
import { useNetworkManagement } from "./useNetworkManagement";
import { useUnifiedBalance } from "./useUnifiedBalance";
import type { TradingPair } from "./useTradingPairs";
import type { Chain } from "../protos/gen/arborter_config_pb";
import { BaseOrQuote } from "../protos/gen/arborter_config_pb";

// MetaMask Chain Permissions Update Notice:
// As of November 2024, MetaMask introduced a new "Chain Permissions" system that replaces
// the old wallet_switchEthereumChain and wallet_addEthereumChain methods. This update
// requires users to manually switch networks in MetaMask instead of automatic switching.
// See: https://metamask.io/news/metamask-feature-update-chain-permissions

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
    availableBalance,
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
  } = useTradingLogic({ tradingPair, isSimpleForm });

  // Get unified balance data with caching
  const {
    availableBalance: unifiedAvailableBalance,
    balanceLoading: unifiedBalanceLoading,
  } = useUnifiedBalance(
    tradingPair,
    currentChainId ? getCorrectSideForChain(currentChainId) : undefined,
  );

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
        await submitOrder(currentChain.baseOrQuote);
      } else {
        // For trade form, submit directly with the provided side
        await submitOrder(side);
      }
    },
    [isSimpleForm, validateNetworksBase, getCurrentChainConfig, submitOrder],
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
      const baseChain = allChains.find(
        (chain) => chain.baseOrQuote === BaseOrQuote.BASE,
      );
      const quoteChain = allChains.find(
        (chain) => chain.baseOrQuote === BaseOrQuote.QUOTE,
      );

      if (!baseChain || !quoteChain) {
        console.error("FormLogic: Missing base or quote chain configuration");
        return;
      }

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

      // With MetaMask's new Chain Permissions system, we don't automatically switch chains
      // Instead, we provide guidance to the user about which chain they should be on
      if (newSide === BaseOrQuote.BASE) {
        // Switching to BASE side (SELL) - suggest base chain
        console.log(
          "FormLogic: User should manually switch to base chain in MetaMask:",
          baseChain.network,
        );
      } else {
        // Switching to QUOTE side (BUY) - suggest quote chain
        console.log(
          "FormLogic: User should manually switch to quote chain in MetaMask:",
          quoteChain.network,
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

    // Only change if the current side doesn't match the optimal side
    if (
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
          // BASE side (SELL): sender = base network, receiver = quote network
          handleSenderNetworkChange(baseChain.network);
          handleReceiverNetworkChange(quoteChain.network);

          // With MetaMask's new Chain Permissions system, we don't automatically switch chains
          console.log(
            "FormLogic: User should manually switch to base chain (sell chain) in MetaMask:",
            baseChain.network,
          );
        } else {
          // QUOTE side (BUY): sender = quote network, receiver = base network
          handleSenderNetworkChange(quoteChain.network);
          handleReceiverNetworkChange(baseChain.network);

          // With MetaMask's new Chain Permissions system, we don't automatically switch chains
          console.log(
            "FormLogic: User should manually switch to quote chain (buy chain) in MetaMask:",
            quoteChain.network,
          );
        }
      }
    }
  }, [
    currentChainId,
    getCurrentChainConfig,
    activeTab,
    getAllChains,
    handleSenderNetworkChange,
    handleReceiverNetworkChange,
    tradingPair,
  ]);

  // Auto-detect optimal side when chain changes
  useEffect(() => {
    detectAndSetOptimalSide();
  }, [currentChainId, detectAndSetOptimalSide]);

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

  // Memoize the chains array to prevent unnecessary re-renders
  const chains = useMemo(() => getAllChains(), [getAllChains]);

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
    availableBalance: unifiedAvailableBalance || availableBalance,
    balanceLoading: unifiedBalanceLoading || balanceLoading,
    currentChainId,
    isConnected,
    address,
    tradingPairs,
    chains,

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
