
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
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

interface TradeFormProps {
  selectedPair: string;
  tradingPair?: TradingPair;
}

const TradeForm = ({ selectedPair, tradingPair }: TradeFormProps) => {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [activeOrderType, setActiveOrderType] = useState<"market" | "limit">("limit");
  const [amount, setAmount] = useState("0,0");
  const [price, setPrice] = useState("");
  const [percentageValue, setPercentageValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();

  // Get trading balances for the current trading pair
  const { availableBalance, lockedBalance, loading: balanceLoading } = useTradingBalance(
    tradingPair?.baseSymbol || "ATOM", 
    currentChainId || 0
  );

  // Debug logging
  console.log('TradeForm balances:', {
    availableBalance,
    lockedBalance,
    tradingPair: tradingPair?.baseSymbol,
    currentChainId
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
        : undefined;

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
        pairDecimals
      });

      console.log('About to call signOrderWithGlobalProtobuf...');
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

      toast({
        title: "Order submitted successfully",
        description: `${activeTab === "buy" ? "Buy" : "Sell"} order for ${quantity} ${tradingPair.baseSymbol} has been submitted`,
      });

      // Reset form
      setAmount("0,0");
      setPrice("");
      setPercentageValue(0);

    } catch (error: any) {
      console.error('Error submitting order:', error);
      
      toast({
        title: "Order submission failed",
        description: error.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-[#1a1d29] rounded-lg shadow-sm border border-gray-700 animate-fade-in text-white">
      <div className="p-4 space-y-4">
        {/* Order Type Tabs */}
        <div className="flex rounded-lg bg-[#2a2d3a] p-1">
          {["limit", "market"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveOrderType(type as any)}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors capitalize",
                activeOrderType === type
                  ? "bg-[#1a1d29] text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex rounded-lg border border-gray-600 overflow-hidden">
          <button
            onClick={() => setActiveTab("buy")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "buy"
                ? "bg-[#00b8a9] text-white border-2 border-[#00b8a9]"
                : "text-gray-400 hover:text-white"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "sell"
                ? "bg-red-400 text-white border-2 border-red-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            Sell
          </button>
        </div>

        {/* Price Section - Only show for limit orders */}
        {activeOrderType === "limit" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Price</label>
            </div>
            <div className="relative">
              <Info className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
              <input
                type="text"
                id="price"
                name="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-10 pr-20 py-3 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-[#2a2d3a]"
                placeholder=""
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">₿</span>
                </div>
                <span className="text-sm text-gray-300">{tradingPair?.quoteSymbol || "UST2"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Order Amount</label>
              <span className="text-xs text-gray-400">(Set Order Size)</span>
            </div>
            <div className="text-xs text-gray-400">
              Available: {balanceLoading ? (
                <span className="text-blue-400">Loading...</span>
              ) : (
                <span className="text-green-400">
                  {availableBalance} {tradingPair?.baseSymbol || "ATOM"}
                  <span className="text-gray-500 ml-1">(deposited - locked)</span>
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
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xs text-white">⚛</span>
                </div>
                <span className="text-sm text-gray-300">{tradingPair?.baseSymbol || "ATOM"}</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">₿</span>
                </div>
                <span className="text-sm text-gray-300">{tradingPair?.quoteSymbol || "UST2"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Percentage Buttons */}
        <div className="flex gap-2">
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

        {/* Order Summary */}
        <div className="space-y-2 py-3 border-t border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Amount</span>
            <span className="text-white">{isNaN(Number(amount.replace(',', '.'))) || !amount ? '-' : amount} {tradingPair?.baseSymbol || "ATOM"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Price</span>
            <span className="text-white">{activeOrderType === "limit" && price && !isNaN(Number(price)) ? price : '-'} {tradingPair?.quoteSymbol || "UST2"}</span>
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
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : !isConnected ? (
            "Connect Wallet to Trade"
          ) : !currentChainId ? (
            "Switch to Supported Network"
          ) : (
            `${activeTab === "buy" ? "Buy" : "Sell"} ${tradingPair?.baseSymbol || "ATOM"}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default TradeForm;
