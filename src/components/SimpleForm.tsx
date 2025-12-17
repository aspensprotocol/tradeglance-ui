import { cn, formatAddress } from "@/lib/utils";
import { Settings, History, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenImage } from "@/components/ui/token-image";
import type { TradingPair } from "@/lib/shared-types";
import { useFormLogic } from "@/hooks/useFormLogic";
import { BaseOrQuote } from "../lib/shared-types";
import { formatDecimalConsistent } from "@/lib/number-utils";
import { useAccount } from "wagmi";
import { useState, useMemo, useEffect } from "react";

interface SimpleFormProps {
  selectedPair?: string;
  setSelectedPair?: (pair: string) => void;
  tradingPair?: TradingPair;
  tradingPairs?: TradingPair[];
}

const SimpleForm = ({
  setSelectedPair,
  tradingPair,
  tradingPairs,
}: SimpleFormProps): JSX.Element => {
  // Get current user's wallet address for filtering
  const { address } = useAccount();

  // State for individual token selection in Simple view
  const [selectedBaseToken, setSelectedBaseToken] = useState<string>(
    tradingPair?.baseSymbol || "",
  );
  const [selectedQuoteToken, setSelectedQuoteToken] = useState<string>(
    tradingPair?.quoteSymbol || "",
  );

  // Use the shared form logic hook
  const {
    formState,
    tradingState,
    networkState,
    availableBalance,
    balanceLoading,
    currentChainId,
    isConnected,
    tradingPairs: formLogicTradingPairs,
    chains,
    updateAmount,
    handlePercentageClick,
    handleSubmitOrder,
    swapNetworks,
    handleSenderNetworkChange,
    handleReceiverNetworkChange,
    getCurrentChainConfig,
  } = useFormLogic({ tradingPair, isSimpleForm: true });

  // Use prop tradingPairs if available, otherwise fall back to form logic
  const availableTradingPairs = tradingPairs || formLogicTradingPairs;

  // Get unique tokens from all trading pairs
  const uniqueTokens = useMemo(() => {
    if (!availableTradingPairs) {
      return {
        baseTokens: [] as string[],
        quoteTokens: [] as string[],
      };
    }

    const baseTokens = new Set<string>();
    const quoteTokens = new Set<string>();

    availableTradingPairs.forEach((pair) => {
      baseTokens.add(pair.baseSymbol);
      quoteTokens.add(pair.quoteSymbol);
    });

    return {
      baseTokens: Array.from(baseTokens).sort(),
      quoteTokens: Array.from(quoteTokens).sort(),
    };
  }, [availableTradingPairs]);

  // Find the trading pair based on selected tokens
  const currentTradingPair = useMemo(() => {
    if (!selectedBaseToken || !selectedQuoteToken || !availableTradingPairs) {
      return tradingPair;
    }

    return (
      availableTradingPairs.find(
        (pair) =>
          pair.baseSymbol === selectedBaseToken &&
          pair.quoteSymbol === selectedQuoteToken,
      ) || tradingPair
    );
  }, [
    selectedBaseToken,
    selectedQuoteToken,
    availableTradingPairs,
    tradingPair,
  ]);

  // Update selected pair when tokens change
  const handleBaseTokenChange = (token: string) => {
    setSelectedBaseToken(token);
    if (token && selectedQuoteToken) {
      const pair = availableTradingPairs?.find(
        (p) => p.baseSymbol === token && p.quoteSymbol === selectedQuoteToken,
      );
      if (pair && setSelectedPair) {
        setSelectedPair(pair.id);
      }
    }
  };

  const handleQuoteTokenChange = (token: string) => {
    setSelectedQuoteToken(token);
    if (selectedBaseToken && token) {
      const pair = availableTradingPairs?.find(
        (p) => p.baseSymbol === selectedBaseToken && p.quoteSymbol === token,
      );
      if (pair && setSelectedPair) {
        setSelectedPair(pair.id);
      }
    }
  };

  // Note: Auto-update of activeTab is now handled by useFormLogic hook

  // Update token selection when networks change
  useEffect(() => {
    if (currentTradingPair && tradingState.activeTab !== undefined) {
      const newBaseToken =
        tradingState.activeTab === BaseOrQuote.BASE
          ? currentTradingPair.baseSymbol
          : currentTradingPair.quoteSymbol;
      const newQuoteToken =
        tradingState.activeTab === BaseOrQuote.BASE
          ? currentTradingPair.quoteSymbol
          : currentTradingPair.baseSymbol;

      if (selectedBaseToken !== newBaseToken) {
        setSelectedBaseToken(newBaseToken);
      }
      if (selectedQuoteToken !== newQuoteToken) {
        setSelectedQuoteToken(newQuoteToken);
      }
    }
  }, [
    currentTradingPair,
    tradingState.activeTab,
    selectedBaseToken,
    selectedQuoteToken,
  ]);

  // Debug: Log selected pair for state tracking

  const handleSubmitSimple = async () => {
    // Submit the order using the activeTab (like Pro form)
    if (tradingState.activeTab) {
      await handleSubmitOrder(tradingState.activeTab);
    }
  };

  // Debug logging removed to prevent infinite loops

  return (
    <section className="h-full animate-fade-in overflow-hidden relative">
      {/* Floating decorative elements */}
      <section className="absolute inset-0 pointer-events-none overflow-hidden">
        <section className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-emerald-300/5 to-teal-300/5 rounded-full blur-md animate-pulse delay-300"></section>
        <section className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-blue-300/5 to-indigo-300/5 rounded-full blur-md animate-pulse delay-700"></section>
      </section>

      <main className="p-2 sm:p-3 h-full flex flex-col relative z-10">
        {/* Header */}
        <header className="flex flex-row items-center justify-between mb-2 pb-2 border-b border-emerald-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Simple Swap
          </h2>
          <nav className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-7 w-7 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-7 w-7 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          </nav>
        </header>

        <main className="space-y-2 flex-1 overflow-auto">
          {/* Sender Section */}
          <fieldset className="space-y-2 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 rounded-xl p-3 border-2 border-emerald-200 shadow-lg relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <section className="absolute inset-0 bg-gradient-to-r from-emerald-400/2 to-teal-400/2 pointer-events-none"></section>

            <section className="flex flex-col sm:flex-row gap-2 relative z-10">
              <section className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-semibold text-gray-700">
                  Token
                </span>
                <span className="flex items-center gap-2">
                  <TokenImage
                    symbol={selectedBaseToken || "?"}
                    size="sm"
                    chainId={tradingPair?.baseChainId}
                  />
                  <Select
                    value={selectedBaseToken}
                    onValueChange={handleBaseTokenChange}
                  >
                    <SelectTrigger className="w-16 bg-white border-2 border-emerald-200 text-gray-800 p-1.5 rounded-lg hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-2xl rounded-xl">
                      {uniqueTokens.baseTokens.map((token) => (
                        <SelectItem
                          key={token}
                          value={token}
                          className="hover:bg-gradient-to-r hover:from-emerald-100 hover:to-teal-100 cursor-pointer transition-all duration-200 text-gray-800"
                        >
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </section>

              <span className="hidden sm:block w-px bg-emerald-200 mx-2"></span>

              <section className="flex flex-col gap-1 flex-1">
                <span className="text-xs font-semibold text-gray-700">
                  Network
                </span>
                <span className="flex items-center gap-2">
                  <Select
                    value={networkState.senderNetwork}
                    onValueChange={handleSenderNetworkChange}
                  >
                    <SelectTrigger className="bg-white border-2 border-emerald-200 text-gray-800 flex-1 p-1.5 rounded-lg hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-2xl rounded-xl">
                      {chains.map((chain) => (
                        <SelectItem
                          key={chain.chainId}
                          value={chain.network}
                          className="hover:bg-gradient-to-r hover:from-emerald-100 hover:to-teal-100 cursor-pointer transition-all duration-200"
                        >
                          <section className="flex items-center gap-1">
                            <span className="text-gray-800">
                              {chain.network}
                            </span>
                            {chain.chainId === currentChainId && (
                              <span className="text-xs text-emerald-600 font-medium">
                                (Current)
                              </span>
                            )}
                          </section>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {networkState.senderNetwork &&
                    getCurrentChainConfig()?.chainId === currentChainId && (
                      <span className="w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"></span>
                    )}
                </span>
              </section>
            </section>

            <span className="flex items-center gap-1 relative z-10">
              <Input
                type="number"
                min="0"
                step="any"
                value={formState.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith("-")) return; // Prevent negative numbers
                  updateAmount(value);
                }}
                placeholder="0"
                className="bg-white border-2 border-emerald-200 text-xl font-bold text-gray-800 p-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </span>

            <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs relative z-10">
              <span className="text-gray-600 font-medium">$0.00</span>
              <span className="flex items-center gap-1">
                <span className="text-xs text-gray-600">
                  Balance:{" "}
                  {balanceLoading ? (
                    <span className="text-emerald-500 font-medium animate-pulse">
                      Loading...
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">
                      {formatDecimalConsistent(availableBalance)}{" "}
                      {tradingState.activeTab === BaseOrQuote.BASE
                        ? currentTradingPair?.baseSymbol || "ATOM"
                        : currentTradingPair?.quoteSymbol || "USDC"}
                    </span>
                  )}
                </span>
              </span>
            </section>

            {/* Percentage Buttons */}
            <nav className="flex gap-1 relative z-10">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className={cn(
                    "flex-1 py-0.5 px-1.5 text-xs font-medium rounded-md transition-all duration-200 transform  h-6",
                    formState.percentageValue === percentage
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : "bg-gradient-to-r from-slate-50 to-emerald-50 text-gray-600 hover:text-gray-800 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md",
                  )}
                >
                  {percentage}%
                </button>
              ))}
            </nav>
          </fieldset>

          {/* Swap Button */}
          <section className="flex justify-center py-1">
            <Button
              onClick={swapNetworks}
              variant="ghost"
              size="sm"
              className="rounded-full border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform "
            >
              <ArrowDownUp className="h-5 w-5 text-emerald-600" />
            </Button>
          </section>

          {/* Receiver Section */}
          <fieldset className="space-y-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-xl p-3 border-2 border-blue-200 shadow-lg relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <section className="absolute inset-0 bg-gradient-to-r from-blue-400/2 to-indigo-400/2 pointer-events-none"></section>

            <section className="flex flex-col sm:flex-row gap-2 relative z-10">
              <section className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-semibold text-gray-700">
                  Token
                </span>
                <span className="flex items-center gap-2">
                  <TokenImage
                    symbol={selectedQuoteToken || "?"}
                    size="sm"
                    chainId={tradingPair?.quoteChainId}
                  />
                  <Select
                    value={selectedQuoteToken}
                    onValueChange={handleQuoteTokenChange}
                  >
                    <SelectTrigger className="w-16 bg-white border-2 border-blue-200 text-gray-800 p-1.5 rounded-lg hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl rounded-xl">
                      {uniqueTokens.quoteTokens.map((token) => (
                        <SelectItem
                          key={token}
                          value={token}
                          className="hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200 text-gray-800"
                        >
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </section>

              <span className="hidden sm:block w-px bg-blue-200 mx-2"></span>

              <section className="flex flex-col gap-1 flex-1">
                <span className="text-xs font-semibold text-gray-700">
                  Network
                </span>
                <span className="flex items-center gap-2">
                  <Select
                    value={networkState.receiverNetwork}
                    onValueChange={handleReceiverNetworkChange}
                  >
                    <SelectTrigger className="bg-white border-2 border-blue-200 text-gray-800 flex-1 p-1.5 rounded-lg hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl rounded-xl">
                      {chains.map((chain) => (
                        <SelectItem
                          key={chain.chainId}
                          value={chain.network}
                          className="hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200"
                        >
                          <section className="flex items-center gap-1">
                            <span className="text-gray-800">
                              {chain.network}
                            </span>
                            {chain.chainId === currentChainId && (
                              <span className="text-xs text-blue-600 font-medium">
                                (Current)
                              </span>
                            )}
                          </section>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {networkState.receiverNetwork &&
                    getCurrentChainConfig()?.chainId === currentChainId && (
                      <span className="w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></span>
                    )}
                </span>
              </section>
            </section>

            {/* Address inside the field */}
            <span className="text-xs text-gray-600 relative z-10">
              To:{" "}
              {address
                ? formatAddress(address)
                : "Not connected"}
            </span>

            <span className="flex items-center gap-2 relative z-10">
              <span className="text-2xl font-bold text-blue-600">
                {formState.amount || "0"}
              </span>
            </span>

            <span className="text-xs text-gray-600 font-medium relative z-10">
              $0.00
            </span>
          </fieldset>

          {/* Fee Section */}
          <section className="text-center bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl py-2 border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-600 font-medium">
              Fee:{" "}
              {(() => {
                const amountValue = parseFloat(
                  formState.amount.replace(",", "."),
                );
                if (isNaN(amountValue) || !amountValue) return "0.00";
                const fee = amountValue * 0.01; // 1% fee
                return fee.toFixed(2);
              })()}{" "}
              {currentTradingPair?.quoteSymbol || "TTK"}
            </span>
          </section>

          {/* Simple Button */}
          <Button
            onClick={handleSubmitSimple}
            disabled={
              formState.isSubmitting ||
              !isConnected ||
              !currentChainId ||
              !formState.amount
            }
            className={cn(
              "w-full py-3 rounded-2xl text-base font-semibold transition-all duration-300 transform  shadow-lg hover:shadow-xl relative overflow-hidden animate-pulse-glow",
              (() => {
                if (!currentChainId)
                  return "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white";
                return tradingState.activeTab === BaseOrQuote.BASE
                  ? "bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 hover:from-red-600 hover:via-pink-600 hover:to-rose-600 text-white" // Sell (red)
                  : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white"; // Buy (green)
              })(),
            )}
          >
            {/* Floating sparkles */}
            <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
            <span className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-75 delay-700"></span>

            {/* Glowing effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

            {formState.isSubmitting ? (
              <span className="flex items-center gap-2 relative z-10">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Processing Simple...
              </span>
            ) : !isConnected ? (
              <span className="relative z-10">Connect Wallet</span>
            ) : (
              <span className="relative z-10">
                {(() => {
                  if (!currentChainId) return "Simple Tokens";
                  return tradingState.activeTab === BaseOrQuote.BASE
                    ? "Sell"
                    : "Buy";
                })()}
              </span>
            )}
          </Button>
        </main>
      </main>
    </section>
  );
};

export default SimpleForm;
