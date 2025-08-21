
import React, { useState, useEffect } from 'react';
import { cn, getEtherscanLink, shortenTxHash } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TradingPair } from "@/hooks/useTradingPairs";
import { useTradingLogic } from "@/hooks/useTradingLogic";
import { useNetworkManagement } from "@/hooks/useNetworkManagement";
import { BaseOrQuote } from '../protos/gen/arborter_config_pb';

interface TradeFormProps {
  selectedPair: string;
  tradingPair?: TradingPair;
}

const TradeForm = ({ selectedPair, tradingPair }: TradeFormProps) => {
  const [activeOrderType, setActiveOrderType] = useState<"limit" | "market">("limit");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

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
    updateAmount,
    updateFormState,
    getCorrectSideForChain,
    getTargetChainForSide,
  } = useTradingLogic({ tradingPair, isSimpleForm: false });

  const {
    getCurrentChainConfig,
  } = useNetworkManagement();

  // Auto-update active tab based on current chain (disabled to allow manual selection)
  // useEffect(() => {
  //   if (currentChainId) {
  //     const correctSide = getCorrectSideForChain(currentChainId);
  //     
  //     if (activeTab !== correctSide) {
  //       console.log(`TradeForm: Auto-updating side from ${activeTab} to ${correctSide} based on chain ${currentChainId}`);
  //       setActiveTab(correctSide);
  //     }
  //   }
  // }, [currentChainId, activeTab, getCorrectSideForChain]);

  // Handle side change with network switching
  const handleSideChange = async (newSide: "buy" | "sell") => {
    console.log('TradeForm: handleSideChange called:', {
      newSide,
      currentSide: activeTab,
      currentChainId,
      currentChainConfig: getCurrentChainConfig()
    });
    
    if (newSide === activeTab) return; // No change needed
    
    // Always allow tab switching - let the user choose the side
    setActiveTab(newSide);
    
    // Optional: Handle network switching in the background if needed
    const targetChainId = getTargetChainForSide(newSide);
    console.log('TradeForm: Target chain for side:', {
      newSide,
      targetChainId,
      targetChainConfig: targetChainId ? getCurrentChainConfig() : null
    });
  };

  const handleSubmitOrder = async () => {
    // Submit the order using shared logic
    await submitOrder(activeTab, activeOrderType);
  };

  return (
    <div className="h-full bg-[#1a1c23] rounded-lg shadow-sm border border-gray-700 animate-fade-in">
      <div className="p-6 h-full flex flex-col">
        {/* Buy/Sell Tabs */}
        <div className="flex bg-[#2a2d3a] rounded-lg p-1 mb-6">
          {["buy", "sell"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleSideChange(tab as "buy" | "sell")}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-md transition-colors",
                activeTab === tab
                  ? tab === "buy"
                    ? "bg-gradient-to-r from-[#00b8a9] to-[#00a8b9] text-white"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                  : "text-gray-400 hover:text-white bg-[#2a2d3a]"
              )}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Order Type Toggle */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">Order Type</span>
          </div>
          <div className="flex bg-[#2a2d3a] rounded-lg p-1">
            {["limit", "market"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveOrderType(type as "limit" | "market")}
                className={cn(
                  "flex-1 py-1 px-4 text-sm font-medium rounded-md transition-colors",
                  activeOrderType === type
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Form */}
        <div className="flex-1 flex flex-col">
          {/* Amount Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-300">
                Order Amount
              </label>
            </div>
            <div className="text-xs text-gray-400">
              Available: {balanceLoading ? (
                <span className="text-blue-400">Loading...</span>
              ) : (
                <span className="text-green-400">
                  {availableBalance} {tradingPair?.baseSymbol || "ATOM"}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              id="amount"
              name="amount"
              value={formState.amount}
              onChange={(e) => updateAmount(e.target.value)}
              className={cn(
                "w-full pl-2 pr-32 py-3 rounded-lg bg-[#2a2d3a] border text-white placeholder-gray-400 focus:outline-none",
                (() => {
                  const quantity = parseFloat(formState.amount.replace(',', '.'));
                  const availableBalanceNum = parseFloat(availableBalance);
                  if (!isNaN(quantity) && !isNaN(availableBalanceNum) && quantity > availableBalanceNum) {
                    return "border-red-500 focus:border-red-500";
                  }
                  return "border-gray-600 focus:border-blue-500";
                })()
              )}
              placeholder="0,0"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">₿</span>
                </div>
                <span className="text-sm text-gray-300">{tradingPair?.baseSymbol || "ATOM"}</span>
              </div>
            </div>
          </div>

          {/* Percentage Buttons */}
          <div className="flex gap-2 mb-6 mt-1">
            {[10, 25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handlePercentageClick(percentage)}
                className={cn(
                  "flex-1 py-1 text-sm rounded-lg transition-colors",
                  formState.percentageValue === percentage
                    ? "bg-blue-600 text-white"
                    : "bg-[#2a2d3a] text-gray-400 hover:text-white hover:bg-[#3a3d4a]"
                )}
              >
                {percentage}%
              </button>
            ))}
          </div>

          {/* Price Input (for limit orders) or Market Order Info */}
          {activeOrderType === "limit" ? (
            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                Price
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formState.price || ""}
                onChange={(e) => updateFormState({ price: e.target.value })}
                className="w-full px-3 py-3 rounded-lg bg-[#2a2d3a] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="0,00"
              />
            </div>
          ) : (
            <div className="mb-6">
              <div className="block text-sm font-medium text-gray-300 mb-2">Market Order</div>
              <div className="w-full px-3 py-3 rounded-lg bg-blue-900/20 border border-blue-500/30 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-300 font-medium">Will execute at the best available price</span>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-2 py-3 border-t border-gray-700 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">{isNaN(Number(formState.amount.replace(',', '.'))) || !formState.amount ? '-' : formState.amount} {tradingPair?.baseSymbol || "ATOM"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Price</span>
              <span className="text-white">
                {activeOrderType === "limit" && formState.price && !isNaN(Number(formState.price)) 
                  ? `${formState.price} ${tradingPair?.quoteSymbol || "UST2"}` 
                  : activeOrderType === "market" 
                    ? "Market Price" 
                    : `- ${tradingPair?.quoteSymbol || "UST2"}`
                }
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Estimated Fee</span>
              <span className="text-white">
                {(() => {
                  const amountValue = parseFloat(formState.amount.replace(',', '.'));
                  if (isNaN(amountValue) || !amountValue) return '0.00';
                  const fee = amountValue * 0.01; // 1% fee
                  return fee.toFixed(2);
                })()} {tradingPair?.quoteSymbol || "UST2"}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-gray-600">
              <span className="text-gray-400 font-medium">Total</span>
              <span className="text-white font-medium">
                {(() => {
                  const amountValue = parseFloat(formState.amount.replace(',', '.'));
                  const priceValue = activeOrderType === "limit" ? parseFloat(formState.price || '0') : 0;
                  
                  if (isNaN(amountValue) || !amountValue) return `- ${tradingPair?.quoteSymbol || "UST2"}`;
                  
                  if (activeOrderType === "market") {
                    return `Market Price + Fee ${tradingPair?.quoteSymbol || "UST2"}`;
                  }
                  
                  if (isNaN(priceValue) || !priceValue) return `- ${tradingPair?.quoteSymbol || "UST2"}`;
                  
                  const subtotal = amountValue * priceValue;
                  const fee = amountValue * 0.01; // 1% fee
                  const total = subtotal + fee;
                  
                  return `${total.toFixed(2)} ${tradingPair?.quoteSymbol || "UST2"}`;
                })()}
              </span>
            </div>
          </div>

          {/* Prominent Buy/Sell Button */}
          <Button
            onClick={handleSubmitOrder}
            disabled={formState.isSubmitting || !isConnected || !currentChainId}
            className={cn(
              "w-full py-4 text-lg font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
              activeTab === "buy"
                ? "bg-gradient-to-r from-[#00b8a9] to-[#00a8b9] hover:from-[#00a8b9] hover:to-[#0098a9] text-white border-2 border-[#00b8a9] hover:border-[#00a8b9]"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-red-500 hover:border-red-600"
            )}
          >
            {formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              `${activeTab.toUpperCase()} ${tradingPair?.baseSymbol || "ATOM"}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradeForm;
