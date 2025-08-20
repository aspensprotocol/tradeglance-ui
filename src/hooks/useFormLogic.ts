import { useState, useEffect, useCallback } from "react";
import { useTradingLogic } from "./useTradingLogic";
import { useNetworkManagement } from "./useNetworkManagement";
import { TradingPair } from "./useTradingPairs";
import { BaseOrQuote, Chain } from "../protos/gen/arborter_config_pb";

// MetaMask Chain Permissions Update Notice:
// As of November 2024, MetaMask introduced a new "Chain Permissions" system that replaces
// the old wallet_switchEthereumChain and wallet_addEthereumChain methods. This update
// requires users to manually switch networks in MetaMask instead of automatic switching.
// See: https://metamask.io/news/metamask-feature-update-chain-permissions
console.log(
  "FormLogic: Using MetaMask Chain Permissions system - automatic chain switching disabled",
);

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
  handleSwapTokens: () => void;

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
        console.log(
          `FormLogic: Auto-updating side from ${activeTab} to ${correctSide} based on chain ${currentChainId}`,
        );
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
      console.log("FormLogic: handleSideChange called:", {
        newSide,
        currentSide: activeTab,
        currentChainId,
        currentChainConfig: getCurrentChainConfig(),
      });

      if (newSide === activeTab) {
        console.log("FormLogic: No change needed, same side");
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

      console.log("FormLogic: Found chains:", {
        baseChain: { network: baseChain.network, chainId: baseChain.chainId },
        quoteChain: {
          network: quoteChain.network,
          chainId: quoteChain.chainId,
        },
      });

      // Update the active tab first
      console.log(
        "FormLogic: Updating active tab from",
        activeTab,
        "to",
        newSide,
      );
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
          "FormLogic: Suggesting base chain (sell chain) for BASE side",
        );
        console.log(
          "FormLogic: User should manually switch to base chain in MetaMask:",
          baseChain.network,
        );

        // Show a toast or notification suggesting the user switch chains manually
        // This is handled by the UI layer if needed
      } else {
        // Switching to QUOTE side (BUY) - suggest quote chain
        console.log(
          "FormLogic: Suggesting quote chain (buy chain) for QUOTE side",
        );
        console.log(
          "FormLogic: User should manually switch to quote chain in MetaMask:",
          quoteChain.network,
        );

        // Show a toast or notification suggesting the user switch chains manually
        // This is handled by the UI layer if needed
      }

      console.log("FormLogic: Side change completed for side:", newSide);
    },
    [
      activeTab,
      currentChainId,
      getCurrentChainConfig,
      getAllChains,
      tradingPair,
    ],
  );

  // Smart side detection based on current network
  const detectAndSetOptimalSide = useCallback(async (): Promise<void> => {
    if (!currentChainId) return;

    const currentChain = getCurrentChainConfig();
    if (!currentChain) return;

    // Determine the optimal side based on the current network
    const optimalSide = currentChain.baseOrQuote;

    console.log("FormLogic: Detecting optimal side for current network:", {
      currentChainId,
      currentNetwork: currentChain.network,
      currentBaseOrQuote: currentChain.baseOrQuote,
      optimalSide,
      currentActiveTab: activeTab,
    });

    // Only change if the current side doesn't match the optimal side
    if (
      activeTab !== optimalSide &&
      (optimalSide === BaseOrQuote.BASE || optimalSide === BaseOrQuote.QUOTE)
    ) {
      console.log("FormLogic: Auto-switching to optimal side:", optimalSide);
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

  // Pre-warm chains in MetaMask for faster switching
  useEffect(() => {
    // With MetaMask's new Chain Permissions system, we don't pre-warm chains
    // Users will need to manually add chains when they want to use them
    console.log(
      "FormLogic: Chain pre-warming disabled - use MetaMask Chain Permissions instead",
    );
  }, [getAllChains, isSimpleForm]);

  // Auto-detect optimal side when chain changes
  useEffect(() => {
    detectAndSetOptimalSide();
  }, [currentChainId, detectAndSetOptimalSide]);

  // Handle order type changes
  const handleOrderTypeChange = useCallback(
    (newOrderType: "limit" | "market"): void => {
      console.log("FormLogic: handleOrderTypeChange called:", {
        newOrderType,
        currentOrderType: activeOrderType,
      });

      if (newOrderType === activeOrderType) {
        console.log("FormLogic: No change needed, same order type");
        return; // No change needed
      }

      console.log(
        "FormLogic: Updating order type from",
        activeOrderType,
        "to",
        newOrderType,
      );
      setActiveOrderType(newOrderType);

      // If switching to market order, clear the price
      if (newOrderType === "market") {
        console.log("FormLogic: Clearing price for market order");
        updateFormState({ price: "" });
      }

      console.log(
        "FormLogic: Order type change completed for type:",
        newOrderType,
      );
    },
    [activeOrderType, updateFormState],
  );

  // Update price function
  const updatePrice = useCallback(
    (price: string): void => {
      console.log("FormLogic: updatePrice called:", {
        newPrice: price,
        currentPrice: formState.price,
      });
      updateFormState({ price });
      console.log("FormLogic: Price updated to:", price);
    },
    [updateFormState, formState.price],
  );

  // Reset manual side selection flag
  const resetManualSideSelection = useCallback((): void => {
    console.log("FormLogic: Resetting manual side selection flag");
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
    availableBalance,
    balanceLoading,
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
