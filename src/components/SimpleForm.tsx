import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Settings, History, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TradingPair } from "@/hooks/useTradingPairs";
import { useTradingLogic } from "@/hooks/useTradingLogic";
import { useNetworkManagement } from "@/hooks/useNetworkManagement";
import { BaseOrQuote } from '../protos/gen/arborter_config_pb';

interface SimpleFormProps {
  selectedPair?: string;
  tradingPair?: TradingPair;
}

const SimpleForm = ({ selectedPair, tradingPair }: SimpleFormProps) => {
  const [senderToken, setSenderToken] = useState("");
  const [receiverToken, setReceiverToken] = useState("");
  const [receiverAmount, setReceiverAmount] = useState("");

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
    getCorrectSideForChain,
  } = useTradingLogic({ tradingPair, isSimpleForm: true });

  const {
    networkState,
    handleSenderNetworkChange,
    handleReceiverNetworkChange,
    swapNetworks,
    validateNetworks,
    getCurrentChainConfig,
    getAllChains,
  } = useNetworkManagement();

  // Update tokens when trading pair changes
  useEffect(() => {
    if (tradingPair) {
      setSenderToken(tradingPair.baseSymbol);
      setReceiverToken(tradingPair.quoteSymbol);
    }
  }, [tradingPair]);

  // Update receiver amount when sender amount changes (simulate simple conversion)
  useEffect(() => {
    if (formState.amount && !isNaN(parseFloat(formState.amount))) {
      const amount = parseFloat(formState.amount);
      // Simple 1:1 conversion for demo purposes
      setReceiverAmount(amount.toFixed(6));
    } else {
      setReceiverAmount("");
    }
  }, [formState.amount]);

  const handleSubmitSimple = async () => {
    // Validate networks first
    const networkValidation = validateNetworks();
    if (!networkValidation.isValid) {
      // Use the toast from trading logic hook
      return;
    }

    // Determine the side based on current chain
    const currentChain = getCurrentChainConfig();
    const isBaseChain = currentChain?.baseOrQuote === BaseOrQuote.BASE;
    const side = isBaseChain ? "sell" : "buy";

    // Submit the order using shared logic
    await submitOrder(side, "limit");
  };

  const handleSwapTokens = async () => {
    // Store current values before swapping
    const oldSenderToken = senderToken;
    const oldReceiverToken = receiverToken;
    const oldSenderAmount = formState.amount;
    const oldReceiverAmount = receiverAmount;

    // Swap the values
    setSenderToken(oldReceiverToken);
    setReceiverToken(oldSenderToken);
    setReceiverAmount(oldSenderAmount);
    updateAmount(oldReceiverAmount);

    // Swap networks using shared logic
    await swapNetworks();
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
                          {pair.displayName.split('/')[0]}
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
                  <Select value={networkState.senderNetwork} onValueChange={handleSenderNetworkChange}>
                    <SelectTrigger className="bg-transparent border-none text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {getAllChains().map((chain) => (
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
                  {networkState.senderNetwork && getCurrentChainConfig()?.chainId === currentChainId && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={formState.amount}
                onChange={(e) => updateAmount(e.target.value)}
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
                    formState.percentageValue === percentage
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
                          {pair.displayName.split('/')[1]}
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
                  <Select value={networkState.receiverNetwork} onValueChange={handleReceiverNetworkChange}>
                    <SelectTrigger className="bg-transparent border-none text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {getAllChains().map((chain) => (
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
                  {networkState.receiverNetwork && getCurrentChainConfig()?.chainId === currentChainId && (
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
                  const amountValue = parseFloat(formState.amount.replace(',', '.'));
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
            disabled={formState.isSubmitting || !isConnected || !currentChainId || !formState.amount}
            className={cn(
              "w-full text-white font-medium py-2",
              (() => {
                if (!currentChainId) return "bg-blue-600 hover:bg-blue-700";
                const currentChain = getCurrentChainConfig();
                const isBaseChain = currentChain?.baseOrQuote === BaseOrQuote.BASE;
                return isBaseChain 
                  ? "bg-red-600 hover:bg-red-700" // Sell (red)
                  : "bg-green-600 hover:bg-green-700"; // Buy (green)
              })()
            )}
          >
            {formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Simple...
              </div>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (() => {
              if (!currentChainId) return "Simple Tokens";
              const currentChain = getCurrentChainConfig();
              const isBaseChain = currentChain?.baseOrQuote === BaseOrQuote.BASE;
              return isBaseChain ? "Sell" : "Buy";
            })()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleForm; 