
import React, { useState, useEffect } from 'react';
import { cn, getEtherscanLink, shortenTxHash, triggerBalanceRefresh } from "@/lib/utils";
import { Info, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { TradingPair } from "@/hooks/useTradingPairs";
import { useAccount, useChainId } from "wagmi";
import { arborterService } from "@/lib/grpc-client";
import { signOrderWithGlobalProtobuf } from "../lib/signing-utils";
import { useToast } from "@/hooks/use-toast";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useTradingBalance } from "@/hooks/useTokenBalance";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";

interface TradeFormProps {
  selectedPair: string;
  tradingPair?: TradingPair;
}

const TradeForm = ({ selectedPair, tradingPair }: TradeFormProps) => {
  const [activeOrderType, setActiveOrderType] = useState<"limit" | "market">("limit");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [percentageValue, setPercentageValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const { switchToNetwork } = useNetworkSwitch();

  // Get trading balances for the current trading pair
  const { availableBalance, lockedBalance, loading: balanceLoading, refresh: refreshBalance } = useTradingBalance(
    tradingPair?.baseSymbol || "ATOM", 
    currentChainId || 0
  );

  // Helper function to determine the correct side based on current chain
  const getCorrectSideForChain = (chainId: number): "buy" | "sell" => {
    const chainConfig = configUtils.getChainByChainId(chainId);
    if (!chainConfig) return "buy";
    
    // Base chain = Sell, Quote chain = Buy
    return chainConfig.baseOrQuote === "BASE_OR_QUOTE_BASE" ? "sell" : "buy";
  };

  // Helper function to get the target chain for a given side
  const getTargetChainForSide = (side: "buy" | "sell"): number | null => {
    const allChains = configUtils.getAllChains();
    const targetBaseOrQuote = side === "sell" ? "BASE_OR_QUOTE_BASE" : "BASE_OR_QUOTE_QUOTE";
    
    const targetChain = allChains.find(chain => chain.baseOrQuote === targetBaseOrQuote);
    return targetChain ? (typeof targetChain.chainId === 'string' ? parseInt(targetChain.chainId, 10) : targetChain.chainId) : null;
  };

  // Auto-update active tab based on current chain
  useEffect(() => {
    if (currentChainId) {
      const correctSide = getCorrectSideForChain(currentChainId);
      console.log('TradeForm: Auto-update effect:', {
        currentChainId,
        currentSide: activeTab,
        correctSide,
        chainConfig: configUtils.getChainByChainId(currentChainId)
      });
      
      if (activeTab !== correctSide) {
        console.log(`TradeForm: Auto-updating side from ${activeTab} to ${correctSide} based on chain ${currentChainId}`);
        setActiveTab(correctSide);
      }
    }
  }, [currentChainId, activeTab]);

  // Handle side change with network switching
  const handleSideChange = async (newSide: "buy" | "sell") => {
    console.log('TradeForm: handleSideChange called:', {
      newSide,
      currentSide: activeTab,
      currentChainId,
      currentChainConfig: configUtils.getChainByChainId(currentChainId || 0)
    });
    
    if (newSide === activeTab) return; // No change needed
    
    const targetChainId = getTargetChainForSide(newSide);
    console.log('TradeForm: Target chain for side:', {
      newSide,
      targetChainId,
      targetChainConfig: targetChainId ? configUtils.getChainByChainId(targetChainId) : null
    });
    
    if (!targetChainId) {
      toast({
        title: "Chain not available",
        description: `No chain configured for ${newSide} side`,
        variant: "destructive",
      });
      return;
    }

    if (targetChainId === currentChainId) {
      // Same chain, just update the side
      console.log('TradeForm: Same chain, just updating side');
      setActiveTab(newSide);
      return;
    }

    // Different chain, need to switch
    console.log('TradeForm: Different chain, switching networks');
    try {
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      if (!chainConfig) {
        toast({
          title: "Chain not supported",
          description: `Chain ID ${targetChainId} is not configured`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Switching network",
        description: `Switching to ${chainConfig.network} for ${newSide}...`,
      });

      const success = await switchToNetwork(chainConfig);
      if (success) {
        setActiveTab(newSide);
        toast({
          title: "Network switched",
          description: `Successfully switched to ${chainConfig.network}`,
        });
      } else {
        toast({
          title: "Network switch failed",
          description: "Failed to switch to the required network",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error switching network:', error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  // Debug logging
  console.log('TradeForm balances:', {
    availableBalance,
    lockedBalance,
    tradingPair: tradingPair?.baseSymbol,
    currentChainId,
    activeTab,
    currentChainConfig: configUtils.getChainByChainId(currentChainId || 0)
  });

  const handlePercentageClick = (percentage: number) => {
    const availableBalanceNum = parseFloat(availableBalance);
    console.log('handlePercentageClick:', {
      percentage,
      availableBalance,
      availableBalanceNum
    });
    
    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      toast({
        title: "No available balance",
        description: "Please deposit funds to trade",
        variant: "destructive",
      });
      return;
    }

    const calculatedAmount = (availableBalanceNum * percentage) / 100;
    setAmount(calculatedAmount.toFixed(6).replace('.', ','));
    setPercentageValue(percentage);
  };

  const handleSubmitOrder = async () => {
    if (!isConnected || !address || !currentChainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive",
      });
      return;
    }

    if (!tradingPair) {
      toast({
        title: "Trading pair not found",
        description: "Please select a valid trading pair",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseFloat(amount.replace(',', '.'));
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough available balance
    const availableBalanceNum = parseFloat(availableBalance);
    console.log('Balance validation:', {
      quantity,
      availableBalance,
      availableBalanceNum,
      isEnough: quantity <= availableBalanceNum
    });
    
    if (isNaN(availableBalanceNum) || quantity > availableBalanceNum) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${availableBalance} ${tradingPair.baseSymbol} available. Please deposit more funds or reduce your order size.`,
        variant: "destructive",
      });
      return;
    }

    if (activeOrderType === "limit" && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for limit orders",
        variant: "destructive",
      });
      return;
    }

    // For market orders, ensure no price is entered
    if (activeOrderType === "market" && price && price.trim() !== "") {
      toast({
        title: "Price not needed for market orders",
        description: "Market orders execute at the best available price. Please clear the price field or switch to limit orders.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get market configuration for decimals from the trading pair
      if (!tradingPair) {
        throw new Error('Trading pair not found');
      }

      // Get the actual market_id from the trading pair configuration
      const marketId = tradingPair.marketId;
      if (!marketId) {
        throw new Error('Market ID not found in trading pair configuration');
      }

      // Use decimal information from the trading pair
      const baseTokenDecimals = tradingPair.baseTokenDecimals;
      const quoteTokenDecimals = tradingPair.quoteTokenDecimals;
      const pairDecimals = tradingPair.pairDecimals;

      // Use pair decimals for both signing and transaction (they should match)
      const orderQuantity = (quantity * Math.pow(10, pairDecimals)).toString();
      const orderPrice = activeOrderType === "limit" 
        ? (parseFloat(price) * Math.pow(10, pairDecimals)).toString()
        : ""; // Use empty string for market orders instead of undefined for consistency

      // Create order data for signing (using pair decimals to match what we send to server)
      const orderData = {
        side: (activeTab === "buy" ? "SIDE_BID" : "SIDE_ASK") as "SIDE_BID" | "SIDE_ASK",
        quantity: orderQuantity,
        price: orderPrice,
        marketId: tradingPair.marketId, // Use the actual marketId from the trading pair
        baseAccountAddress: address,
        quoteAccountAddress: address, // Using same address for both for now
        executionType: "EXECUTION_TYPE_UNSPECIFIED" as "EXECUTION_TYPE_UNSPECIFIED" | "EXECUTION_TYPE_DISCRETIONARY",
        matchingOrderIds: [], // Add missing field
      };

      console.log('Signing order with data:', {
        ...orderData,
        chainId: currentChainId,
        baseTokenDecimals,
        quoteTokenDecimals,
        pairDecimals,
        tradingPair
      });

      console.log('Decimal conversions:', {
        originalQuantity: quantity,
        originalPrice: price,
        orderQuantity, // Pair decimals (for both signing and transaction)
        orderPrice, // Pair decimals (for both signing and transaction)
        baseTokenDecimals,
        quoteTokenDecimals,
        pairDecimals,
        orderType: activeOrderType
      });

      console.log(`About to call signOrderWithGlobalProtobuf for ${activeOrderType} order...`);
      // Sign the order with MetaMask using global protobuf encoding (matching aspens SDK)
      const signatureHash = await signOrderWithGlobalProtobuf(orderData, currentChainId);

      // Create the order object for gRPC (matching aspens SDK structure)
      // Use pair decimals for both signing and transaction (they should match)
      const orderForGrpc = {
        side: orderData.side === "SIDE_BID" ? 1 : 2,
        quantity: orderQuantity, // Use pair decimals (same as signing)
        price: orderPrice, // Use pair decimals (same as signing)
        marketId: orderData.marketId,
        baseAccountAddress: orderData.baseAccountAddress,
        quoteAccountAddress: orderData.quoteAccountAddress,
        executionType: 0, // EXECUTION_TYPE_UNSPECIFIED
        matchingOrderIds: [],
      };

      console.log('Sending order to gRPC:', orderForGrpc);

      // Send the order
      const response = await arborterService.sendOrder(orderForGrpc, signatureHash);

      console.log('Order sent successfully:', response);

      // Check if response contains transaction hash
      const txHash = response?.data?.txHash || response?.txHash || response?.transactionHash;
      
      if (txHash) {
        const etherscanLink = getEtherscanLink(txHash, currentChainId);
        const shortHash = shortenTxHash(txHash);
        
        toast({
          title: "Order submitted successfully",
          description: (
            <div>
              <p>{`${activeTab === "buy" ? "Buy" : "Sell"} ${activeOrderType} order for ${quantity} ${tradingPair.baseSymbol} has been submitted`}</p>
              <a 
                href={etherscanLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline mt-1 inline-block"
              >
                View transaction: {shortHash}
              </a>
            </div>
          ),
        });
      } else {
        toast({
          title: "Order submitted successfully",
          description: `${activeTab === "buy" ? "Buy" : "Sell"} ${activeOrderType} order for ${quantity} ${tradingPair.baseSymbol} has been submitted`,
        });
      }

      // Reset form
      setAmount("0,0");
      setPrice("");
      setPercentageValue(0);
      
      // Refresh local balance
      refreshBalance();
      
      // Trigger global balance refresh for all components
      triggerBalanceRefresh();

    } catch (error: any) {
      console.error('Error submitting order:', error);
      
      toast({
        title: "Order submission failed",
        description: error.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      });
      
      // Trigger global balance refresh even on error to ensure UI is up to date
      triggerBalanceRefresh();
      
      // Refresh local balance even on error
      refreshBalance();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-[#1a1c23] rounded-lg shadow-sm border border-gray-700 animate-fade-in">
      <div className="p-6 h-full flex flex-col">
        {/* Order Type Tabs */}
        <div className="flex bg-[#2a2d3a] rounded-lg p-1 mb-6">
          {["limit", "market"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveOrderType(type as "limit" | "market")}
              className={cn(
                "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
                activeOrderType === type
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

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
                  : "text-gray-400 hover:text-white"
              )}
            >
              {tab.toUpperCase()}
            </button>
          ))}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                "w-full pl-2 pr-32 py-3 rounded-lg bg-[#2a2d3a] border text-white placeholder-gray-400 focus:outline-none",
                (() => {
                  const quantity = parseFloat(amount.replace(',', '.'));
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
          <div className="flex gap-2 mb-6">
            {[10, 25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handlePercentageClick(percentage)}
                className={cn(
                  "flex-1 py-2 text-sm rounded-lg transition-colors",
                  percentageValue === percentage
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-[#2a2d3a] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="0,00"
              />
            </div>
          ) : (
            <div className="mb-6">
              <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-300 font-medium">Market Order</span>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Will execute at the best available price
                </p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-2 py-3 border-t border-gray-700 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">{isNaN(Number(amount.replace(',', '.'))) || !amount ? '-' : amount} {tradingPair?.baseSymbol || "ATOM"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Price</span>
              <span className="text-white">
                {activeOrderType === "limit" && price && !isNaN(Number(price)) 
                  ? `${price} ${tradingPair?.quoteSymbol || "UST2"}` 
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
                  const amountValue = parseFloat(amount.replace(',', '.'));
                  if (isNaN(amountValue) || !amountValue) return '0.00';
                  const fee = amountValue * 0.01; // 1% fee
                  return fee.toFixed(2);
                })()} {tradingPair?.quoteSymbol || "UST2"}
              </span>
            </div>
          </div>

          {/* Prominent Buy/Sell Button */}
          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !isConnected || !currentChainId}
            className={cn(
              "w-full py-4 text-lg font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
              activeTab === "buy"
                ? "bg-gradient-to-r from-[#00b8a9] to-[#00a8b9] hover:from-[#00a8b9] hover:to-[#0098a9] text-white border-2 border-[#00b8a9] hover:border-[#00a8b9]"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-red-500 hover:border-red-600"
            )}
          >
            {isSubmitting ? (
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
