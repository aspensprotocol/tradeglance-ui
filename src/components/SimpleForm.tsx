import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Settings, History, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TradingPair } from "@/hooks/useTradingPairs";
import { useAccount, usePublicClient } from "wagmi";
import { arborterService } from "@/lib/grpc-client";
import { signOrderWithGlobalProtobuf } from "../lib/signing-utils";
import { useToast } from "@/hooks/use-toast";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useBalanceManager } from "@/hooks/useBalanceManager";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { triggerBalanceRefresh } from "@/lib/utils";

interface SimpleFormProps {
  selectedPair?: string;
  tradingPair?: TradingPair;
}

const SimpleForm = ({ selectedPair, tradingPair }: SimpleFormProps) => {
  const [senderToken, setSenderToken] = useState("");
  const [senderNetwork, setSenderNetwork] = useState("");
  const [senderAmount, setSenderAmount] = useState("");
  const [receiverToken, setReceiverToken] = useState("");
  const [receiverNetwork, setReceiverNetwork] = useState("");
  const [receiverAmount, setReceiverAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [percentageValue, setPercentageValue] = useState<number | null>(null);

  const { address, isConnected } = useAccount();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const { tradingPairs } = useTradingPairs();
  const publicClient = usePublicClient();
  const { switchToNetwork } = useNetworkSwitch();

  // Get trading balances for the current trading pair
  const { availableBalance, lockedBalance, balanceLoading, refreshBalance } = useBalanceManager(tradingPair);

  // Debug logging
  console.log('SimpleForm balances:', {
    availableBalance,
    lockedBalance,
    tradingPair: tradingPair?.baseSymbol,
    currentChainId,
    senderNetwork,
    receiverNetwork,
    availableChains: configUtils.getAllChains().map(c => ({ chainId: c.chainId, network: c.network }))
  });

  // Force refresh balance to see what's happening
  useEffect(() => {
    if (isConnected && address && currentChainId && tradingPair?.baseSymbol) {
      console.log('SimpleForm: Force refreshing balance for debugging...');
      // This will trigger the useTradingBalance hook to run
    }
  }, [isConnected, address, currentChainId, tradingPair?.baseSymbol]);

  const handleMaxClick = () => {
    const availableBalanceNum = parseFloat(availableBalance);
    if (isNaN(availableBalanceNum) || availableBalanceNum <= 0) {
      toast({
        title: "No available balance",
        description: "Please deposit funds to simple",
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
        description: "Please deposit funds to simple",
        variant: "destructive",
      });
      return;
    }

    const calculatedAmount = (availableBalanceNum * percentage) / 100;
    setSenderAmount(calculatedAmount.toFixed(6));
    setPercentageValue(percentage);
  };

  const handleSenderNetworkChange = async (newNetwork: string) => {
    try {
      // Get the chain config for the new network
      const newChainConfig = configUtils.getChainByNetwork(newNetwork);
      if (!newChainConfig) {
        toast({
          title: "Network not found",
          description: "Selected network is not available",
          variant: "destructive",
        });
        return;
      }

      // Switch MetaMask to the new network
      const chainId = typeof newChainConfig.chainId === 'string' ? parseInt(newChainConfig.chainId, 10) : newChainConfig.chainId;
      const success = await switchToNetwork(newChainConfig);
      
      if (!success) {
        toast({
          title: "Network switch failed",
          description: "Failed to switch to the selected network",
          variant: "destructive",
        });
        return;
      }

      // Update sender network
      setSenderNetwork(newNetwork);

      // Auto-update receiver network to a different network
      const allChains = configUtils.getAllChains();
      const otherChains = allChains.filter(chain => chain.network !== newNetwork);
      
      if (otherChains.length > 0) {
        setReceiverNetwork(otherChains[0].network);
      }

      console.log('Network switched:', {
        newSenderNetwork: newNetwork,
        newReceiverNetwork: otherChains.length > 0 ? otherChains[0].network : 'none',
        chainId
      });

    } catch (error: any) {
      console.error('Error switching network:', error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch network in MetaMask",
        variant: "destructive",
      });
    }
  };

  const handleReceiverNetworkChange = (newNetwork: string) => {
    // Prevent setting receiver network to the same as sender network
    if (newNetwork === senderNetwork) {
      toast({
        title: "Invalid network selection",
        description: "Receiver network cannot be the same as sender network",
        variant: "destructive",
      });
      return;
    }

    setReceiverNetwork(newNetwork);
  };

  const handleSwapTokens = async () => {
    // Store current values before swapping
    const oldSenderToken = senderToken;
    const oldReceiverToken = receiverToken;
    const oldSenderNetwork = senderNetwork;
    const oldReceiverNetwork = receiverNetwork;
    const oldSenderAmount = senderAmount;
    const oldReceiverAmount = receiverAmount;

    // Swap the values
    setSenderToken(oldReceiverToken);
    setReceiverToken(oldSenderToken);
    setSenderNetwork(oldReceiverNetwork);
    setReceiverNetwork(oldSenderNetwork);
    setSenderAmount(oldReceiverAmount);
    setReceiverAmount(oldSenderAmount);

    // Switch MetaMask to the new sender network (which was the old receiver network)
    try {
      const newSenderChainConfig = configUtils.getChainByNetwork(oldReceiverNetwork);
      if (newSenderChainConfig) {
        const success = await switchToNetwork(newSenderChainConfig);
        
        if (!success) {
          toast({
            title: "Network switch failed",
            description: "Failed to switch to the new sender network",
            variant: "destructive",
          });
          // Optionally revert the swap if network switch fails
          // setSenderToken(oldSenderToken);
          // setReceiverToken(oldReceiverToken);
          // setSenderNetwork(oldSenderNetwork);
          // setReceiverNetwork(oldReceiverNetwork);
          // setSenderAmount(oldSenderAmount);
          // setReceiverAmount(oldReceiverAmount);
        }
      }
    } catch (error: any) {
      console.error('Error switching network during swap:', error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch network during swap",
        variant: "destructive",
      });
    }
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
        
        console.log('SimpleForm: Auto-detected networks:', {
          currentChainId,
          currentNetwork: currentChain.network,
          senderNetwork: currentChain.network,
          receiverNetwork: otherChains.length > 0 ? otherChains[0].network : currentChain.network,
          availableChains: allChains.map(c => ({ chainId: c.chainId, network: c.network }))
        });
      }
    }
  }, [currentChainId]);

      // Update receiver amount when sender amount changes (simulate simple conversion)
  useEffect(() => {
    if (senderAmount && !isNaN(parseFloat(senderAmount))) {
      const amount = parseFloat(senderAmount);
      // Simple 1:1 conversion for demo purposes
      setReceiverAmount(amount.toFixed(6));
    } else {
      setReceiverAmount("");
    }
  }, [senderAmount]);

  const handleSubmitSimple = async () => {
    if (!isConnected || !address || !currentChainId) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to simple",
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
    // Convert available balance to pair decimals for comparison
    const pairDecimals = tradingPair.pairDecimals;
    const availableBalanceInPairDecimals = parseFloat(availableBalance) * Math.pow(10, pairDecimals);
    const quantityInPairDecimals = quantity * Math.pow(10, pairDecimals);
    
    console.log('Balance validation:', {
      quantity,
      availableBalance,
      availableBalanceNum: parseFloat(availableBalance),
      availableBalanceInPairDecimals,
      quantityInPairDecimals,
      pairDecimals,
      isEnough: quantityInPairDecimals <= availableBalanceInPairDecimals
    });
    
    if (isNaN(availableBalanceInPairDecimals) || quantityInPairDecimals > availableBalanceInPairDecimals) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${availableBalance} ${tradingPair.baseSymbol} available. Please deposit more funds or reduce your simple amount.`,
        variant: "destructive",
      });
      return;
    }

    // Validate that sender and receiver networks are different
    if (senderNetwork === receiverNetwork) {
      toast({
        title: "Invalid simple configuration",
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

      // MANUAL BALANCE CHECK - Let's see what the smart contract actually returns
      console.log('=== MANUAL BALANCE CHECK BEFORE ORDER ===');
      
      // Get chain and token config
      const chainConfig = configUtils.getChainByChainId(currentChainId);
      console.log('Manual check - Chain config:', chainConfig);
      
      if (chainConfig) {
        const tokenConfig = chainConfig.tokens[tradingPair.baseSymbol];
        console.log('Manual check - Token config:', tokenConfig);
        
        if (tokenConfig) {
          const tokenAddress = tokenConfig.address;
          const tradeContractAddress = chainConfig.tradeContractAddress;
          
          console.log('Manual check - Token address:', tokenAddress);
          console.log('Manual check - Trade contract address:', tradeContractAddress);
          console.log('Manual check - User address:', address);
          
          try {
            // Read deposited balance directly
            const depositedResult = await publicClient.readContract({
              address: tradeContractAddress as `0x${string}`,
              abi: [{ 
                "inputs": [
                  {"name": "_depositorAddress", "type": "address"},
                  {"name": "_tokenContract", "type": "address"}
                ],
                "name": "getBalance",
                "outputs": [{"name": "_balance", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
              }],
              functionName: 'getBalance',
              args: [address as `0x${string}`, tokenAddress as `0x${string}`],
            });
            
            console.log('Manual check - Raw deposited result:', depositedResult);
            console.log('Manual check - Deposited result type:', typeof depositedResult);
            
            const decimals = tokenConfig.decimals;
            const depositedDecimal = Number(depositedResult);
            const formattedDeposited = (depositedDecimal / Math.pow(10, decimals)).toFixed(6);
            
            console.log('Manual check - Formatted deposited balance:', formattedDeposited);
            console.log('Manual check - UI shows available balance:', availableBalance);
            console.log('Manual check - Are they the same?', formattedDeposited === availableBalance);
          } catch (err) {
            console.error('Manual check - Error reading balance:', err);
          }
        }
      }
      console.log('=== END MANUAL BALANCE CHECK ===');

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
      const orderPrice = (parseFloat("1") * Math.pow(10, pairDecimals)).toString(); // Simple orders use 1 price

      // Determine order side based on current chain
      // Base chain (anvil-1) = SELL, Quote chain (anvil-2) = BUY
      const currentChain = configUtils.getChainByChainId(currentChainId);
      const isBaseChain = currentChain?.baseOrQuote === "BASE_OR_QUOTE_BASE";
      const orderSide = isBaseChain ? "SIDE_ASK" : "SIDE_BID"; // SELL for base chain, BUY for quote chain
      
      console.log('Order side determination:', {
        currentChainId,
        currentChainNetwork: currentChain?.network,
        baseOrQuote: currentChain?.baseOrQuote,
        isBaseChain,
        orderSide
      });

      // Create order data for signing (using pair decimals to match what we send to server)
      const orderData = {
        side: orderSide as "SIDE_BID" | "SIDE_ASK",
        quantity: orderQuantity,
        price: orderPrice,
        marketId: tradingPair.marketId, // Use the actual marketId from the trading pair
        baseAccountAddress: address,
        quoteAccountAddress: address, // Using same address for both for now
        executionType: "EXECUTION_TYPE_UNSPECIFIED" as "EXECUTION_TYPE_UNSPECIFIED" | "EXECUTION_TYPE_DISCRETIONARY",
        matchingOrderIds: [], // Add missing field
      };

      console.log('Signing simple order with data:', {
        ...orderData,
        chainId: currentChainId,
        baseTokenDecimals,
        quoteTokenDecimals,
        pairDecimals,
        tradingPair,
        orderSide: orderData.side
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

              console.log('Sending simple order to gRPC:', orderForGrpc);

      // Send the order
      const response = await arborterService.sendOrder(orderForGrpc, signatureHash);

              console.log('Simple order sent successfully:', response);

      toast({
                  title: "Simple order submitted successfully",
          description: `Simple order for ${quantity} ${tradingPair.baseSymbol} from ${senderNetwork} to ${receiverNetwork} has been submitted`,
      });

      // Refresh balance to show updated amounts
      refreshBalance();
      
      // Trigger global balance refresh for all components
      triggerBalanceRefresh();

      // Reset form
      setSenderAmount("");
      setReceiverAmount("");
      setPercentageValue(null);

    } catch (error: any) {
              console.error('Error submitting simple order:', error);
      
      toast({
                  title: "Simple order submission failed",
          description: error.message || "Failed to submit simple order. Please try again.",
        variant: "destructive",
      });
      
      // Trigger global balance refresh even on error to ensure UI is up to date
      triggerBalanceRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-900 text-white border-gray-700 rounded-lg shadow-lg">
        <div className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-medium text-white">Simple</h2>
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
                  <Select value={senderNetwork} onValueChange={handleSenderNetworkChange}>
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
                  <Select value={receiverNetwork} onValueChange={handleReceiverNetworkChange}>
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
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
              <span className="text-white">
                Fee: {(() => {
                  const amountValue = parseFloat(senderAmount.replace(',', '.'));
                  if (isNaN(amountValue) || !amountValue) return '0.00';
                  const fee = amountValue * 0.01; // 1% fee
                  return fee.toFixed(2);
                })()} {tradingPair?.quoteSymbol || "TTK"}
              </span>
            </div>
          </div>

                      {/* Simple Button */}
          <Button 
            onClick={handleSubmitSimple}
            disabled={isSubmitting || !isConnected || !currentChainId || !senderAmount}
            className={cn(
              "w-full text-white font-medium py-2",
              (() => {
                if (!currentChainId) return "bg-blue-600 hover:bg-blue-700";
                const currentChain = configUtils.getChainByChainId(currentChainId);
                const isBaseChain = currentChain?.baseOrQuote === "BASE_OR_QUOTE_BASE";
                return isBaseChain 
                  ? "bg-red-600 hover:bg-red-700" // Sell (red)
                  : "bg-green-600 hover:bg-green-700"; // Buy (green)
              })()
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Simple...
              </div>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (() => {
              if (!currentChainId) return "Simple Tokens";
              const currentChain = configUtils.getChainByChainId(currentChainId);
              const isBaseChain = currentChain?.baseOrQuote === "BASE_OR_QUOTE_BASE";
              return isBaseChain ? "Sell" : "Buy";
            })()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleForm; 