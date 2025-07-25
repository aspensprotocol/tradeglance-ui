import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Info, Loader2, Settings, History, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TradingPair } from "@/hooks/useTradingPairs";
import { useAccount, useChainId } from "wagmi";
import { arborterService } from "@/lib/grpc-client";
import { signOrderWithGlobalProtobuf } from "../lib/signing-utils";
import { useToast } from "@/hooks/use-toast";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useTradingBalance } from "@/hooks/useTokenBalance";
import { useTradingPairs } from "@/hooks/useTradingPairs";

interface BridgeFormProps {
  selectedPair?: string;
  tradingPair?: TradingPair;
}

const BridgeForm = ({ selectedPair, tradingPair }: BridgeFormProps) => {
  const [senderToken, setSenderToken] = useState("");
  const [senderNetwork, setSenderNetwork] = useState("");
  const [senderAmount, setSenderAmount] = useState("");
  const [receiverToken, setReceiverToken] = useState("");
  const [receiverNetwork, setReceiverNetwork] = useState("");
  const [receiverAmount, setReceiverAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [percentageValue, setPercentageValue] = useState<number | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const { tradingPairs } = useTradingPairs();

  // Get trading balances for the current trading pair
  const { availableBalance, lockedBalance, loading: balanceLoading } = useTradingBalance(
    tradingPair?.baseSymbol || "ATOM", 
    currentChainId || 0
  );

  // Debug logging
  console.log('BridgeForm balances:', {
    availableBalance,
    lockedBalance,
    tradingPair: tradingPair?.baseSymbol,
    currentChainId,
    senderNetwork,
    receiverNetwork,
    availableChains: configUtils.getAllChains().map(c => ({ chainId: c.chainId, network: c.network }))
  });

  const handleMaxClick = () => {
    const availableBalanceNum = parseFloat(availableBalance);
    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      toast({
        title: "No available balance",
        description: "Please deposit funds to bridge",
        variant: "destructive",
      });
      return;
    }
    setSenderAmount(availableBalanceNum.toFixed(6));
    setPercentageValue(100);
  };

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
        description: "Please deposit funds to bridge",
        variant: "destructive",
      });
      return;
    }

    const calculatedAmount = (availableBalanceNum * percentage) / 100;
    setSenderAmount(calculatedAmount.toFixed(6));
    setPercentageValue(percentage);
  };

  const handleSwapTokens = () => {
    setSenderToken(receiverToken);
    setReceiverToken(senderToken);
    setSenderNetwork(receiverNetwork);
    setReceiverNetwork(senderNetwork);
    setSenderAmount(receiverAmount);
    setReceiverAmount(senderAmount);
  };

  // Update tokens when trading pair changes
  useEffect(() => {
    if (tradingPair) {
      setSenderToken(tradingPair.baseSymbol);
      setReceiverToken(tradingPair.quoteSymbol);
    }
  }, [tradingPair]);

  // Auto-detect and fill network parameters based on current chain and available chains
  useEffect(() => {
    if (currentChainId) {
      // Get current chain info
      const currentChain = configUtils.getChainByChainId(currentChainId);
      
      if (currentChain) {
        // Set sender network to current network
        setSenderNetwork(currentChain.network);
        
        // Get all available chains for receiver network options
        const allChains = configUtils.getAllChains();
        const otherChains = allChains.filter(chain => chain.chainId !== currentChainId);
        
        // Set receiver network to the first available other chain, or current if no others
        if (otherChains.length > 0) {
          setReceiverNetwork(otherChains[0].network);
        } else {
          setReceiverNetwork(currentChain.network);
        }
        
        console.log('BridgeForm: Auto-detected networks:', {
          currentChainId,
          currentNetwork: currentChain.network,
          senderNetwork: currentChain.network,
          receiverNetwork: otherChains.length > 0 ? otherChains[0].network : currentChain.network,
          availableChains: allChains.map(c => ({ chainId: c.chainId, network: c.network }))
        });
      }
    }
  }, [currentChainId]);

  // Update receiver amount when sender amount changes (simulate bridge conversion)
  useEffect(() => {
    if (senderAmount && !isNaN(parseFloat(senderAmount))) {
      const amount = parseFloat(senderAmount);
      // Simple 1:1 conversion for demo purposes
      setReceiverAmount(amount.toFixed(6));
    } else {
      setReceiverAmount("");
    }
  }, [senderAmount]);

  const handleSubmitBridge = async () => {
    if (!isConnected || !address || !currentChainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to bridge",
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

    const quantity = parseFloat(senderAmount);
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
        description: `You only have ${availableBalance} ${tradingPair.baseSymbol} available. Please deposit more funds or reduce your bridge amount.`,
        variant: "destructive",
      });
      return;
    }

    // Validate that sender and receiver networks are different
    if (senderNetwork === receiverNetwork) {
      toast({
        title: "Invalid bridge configuration",
        description: "Sender and receiver networks must be different for bridging.",
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
      const orderPrice = (parseFloat("0") * Math.pow(10, pairDecimals)).toString(); // Bridge orders use 0 price

      // Create order data for signing (using pair decimals to match what we send to server)
      const orderData = {
        side: "SIDE_BID" as "SIDE_BID" | "SIDE_ASK", // Bridge orders are always buy side
        quantity: orderQuantity,
        price: orderPrice,
        marketId: tradingPair.marketId, // Use the actual marketId from the trading pair
        baseAccountAddress: address,
        quoteAccountAddress: address, // Using same address for both for now
        executionType: "EXECUTION_TYPE_UNSPECIFIED" as "EXECUTION_TYPE_UNSPECIFIED" | "EXECUTION_TYPE_DISCRETIONARY",
        matchingOrderIds: [], // Add missing field
      };

      console.log('Signing bridge order with data:', {
        ...orderData,
        chainId: currentChainId,
        baseTokenDecimals,
        quoteTokenDecimals,
        pairDecimals,
        tradingPair
      });

      console.log('Decimal conversions:', {
        originalQuantity: quantity,
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

      console.log('Sending bridge order to gRPC:', orderForGrpc);

      // Send the order
      const response = await arborterService.sendOrder(orderForGrpc, signatureHash);

      console.log('Bridge order sent successfully:', response);

      toast({
        title: "Bridge order submitted successfully",
        description: `Bridge order for ${quantity} ${tradingPair.baseSymbol} from ${senderNetwork} to ${receiverNetwork} has been submitted`,
      });

      // Reset form
      setSenderAmount("");
      setReceiverAmount("");
      setPercentageValue(null);

    } catch (error: any) {
      console.error('Error submitting bridge order:', error);
      
      toast({
        title: "Bridge order submission failed",
        description: error.message || "Failed to submit bridge order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-900 text-white border-gray-700 rounded-lg shadow-lg">
        <div className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-medium text-white">Bridge</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-blue-400 hover:bg-gray-800">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-blue-400 hover:bg-gray-800">
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-3 space-y-2">
          {/* Sender Section */}
          <div className="space-y-1 bg-gray-800 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">From: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</span>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-xs text-gray-400">Token</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{senderToken ? senderToken.charAt(0) : '?'}</span>
                  </div>
                  <Select value={senderToken} onValueChange={setSenderToken}>
                    <SelectTrigger className="w-20 bg-transparent border-none text-white p-0 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {tradingPairs.map((pair) => (
                        <SelectItem key={pair.baseSymbol} value={pair.baseSymbol} className="text-white hover:bg-gray-600">
                          {pair.baseSymbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="w-px bg-gray-700 mx-1"></div>
              
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-xs text-gray-400">Network</span>
                <div className="flex items-center gap-2">
                  <Select value={senderNetwork} onValueChange={setSenderNetwork}>
                    <SelectTrigger className="bg-transparent border-none text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {configUtils.getAllChains().map((chain) => (
                        <SelectItem 
                          key={chain.chainId} 
                          value={chain.network} 
                          className="text-white hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <span>{chain.network}</span>
                            {chain.chainId === currentChainId && (
                              <span className="text-xs text-green-400">(Current)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {senderNetwork && configUtils.getChainByNetwork(senderNetwork)?.chainId === currentChainId && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={senderAmount}
                onChange={(e) => setSenderAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent border-none text-2xl font-medium text-white p-0 h-auto focus:ring-0 focus-visible:ring-0"
              />
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">$0.00</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">
                  Balance: {balanceLoading ? "Loading..." : availableBalance}
                </span>
                <Button
                  onClick={handleMaxClick}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-400 hover:text-blue-300 h-auto p-1 bg-blue-500/20 rounded"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Percentage Buttons */}
            <div className="flex gap-1">
              {[10, 25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className={cn(
                    "flex-1 py-0.5 text-xs rounded transition-colors",
                    percentageValue === percentage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600"
                  )}
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center py-2">
            <Button
              onClick={handleSwapTokens}
              variant="ghost"
              size="sm"
              className="rounded-lg border border-blue-500 bg-blue-500/20 hover:bg-blue-500/30 p-2"
            >
              <ArrowDownUp className="h-4 w-4 text-blue-400" />
            </Button>
          </div>

          {/* Receiver Section */}
          <div className="space-y-1 bg-gray-800 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">To: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</span>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-xs text-gray-400">Token</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{receiverToken ? receiverToken.charAt(0) : '?'}</span>
                  </div>
                  <Select value={receiverToken} onValueChange={setReceiverToken}>
                    <SelectTrigger className="w-20 bg-transparent border-none text-white p-0 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {tradingPairs.map((pair) => (
                        <SelectItem key={pair.quoteSymbol} value={pair.quoteSymbol} className="text-white hover:bg-gray-600">
                          {pair.quoteSymbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="w-px bg-gray-700 mx-1"></div>
              
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-xs text-gray-400">Network</span>
                <div className="flex items-center gap-2">
                  <Select value={receiverNetwork} onValueChange={setReceiverNetwork}>
                    <SelectTrigger className="bg-transparent border-none text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {configUtils.getAllChains().map((chain) => (
                        <SelectItem 
                          key={chain.chainId} 
                          value={chain.network} 
                          className="text-white hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <span>{chain.network}</span>
                            {chain.chainId === currentChainId && (
                              <span className="text-xs text-green-400">(Current)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {receiverNetwork && configUtils.getChainByNetwork(receiverNetwork)?.chainId === currentChainId && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-medium text-blue-400">{receiverAmount || "0"}</span>
            </div>
            
            <div className="text-sm text-gray-500">$0.00</div>
          </div>

          {/* Fee Section */}
          <div className="bg-gray-800 rounded-lg p-1">
            <Select>
              <SelectTrigger className="bg-transparent border-none text-white">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                  <span>Fee: 0 ETH</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="standard" className="text-white hover:bg-gray-600">Standard: 0 ETH</SelectItem>
                <SelectItem value="fast" className="text-white hover:bg-gray-600">Fast: 0.001 ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bridge Button */}
          <Button 
            onClick={handleSubmitBridge}
            disabled={isSubmitting || !isConnected || !currentChainId || !senderAmount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Bridge...
              </div>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              "Bridge Tokens"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BridgeForm; 