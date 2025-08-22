import { cn } from "@/lib/utils";
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
import type { TradingPair } from "@/hooks/useTradingPairs";
import { useFormLogic } from "@/hooks/useFormLogic";
import { BaseOrQuote } from "../protos/gen/arborter_config_pb";
import { formatDecimalConsistent } from "@/lib/number-utils";
import { useAccount } from "wagmi";
import { useState, useMemo } from "react";

interface SimpleFormProps {
  selectedPair?: string;
  setSelectedPair?: (pair: string) => void;
  tradingPair?: TradingPair;
  tradingPairs?: TradingPair[];
}

const SimpleForm = ({ selectedPair, setSelectedPair, tradingPair, tradingPairs }: SimpleFormProps): JSX.Element => {
  // Get current user's wallet address for filtering
  const { address } = useAccount();
  
  // State for "Mine" filter toggle
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  
  // State for individual token selection in Simple view
  const [selectedBaseToken, setSelectedBaseToken] = useState<string>(tradingPair?.baseSymbol || "");
  const [selectedQuoteToken, setSelectedQuoteToken] = useState<string>(tradingPair?.quoteSymbol || "");
  
  // Use the shared form logic hook
  const {
    formState,
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
    handleSwapTokens,
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
    
    availableTradingPairs.forEach(pair => {
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
    
    return availableTradingPairs.find(
      pair => pair.baseSymbol === selectedBaseToken && pair.quoteSymbol === selectedQuoteToken
    ) || tradingPair;
  }, [selectedBaseToken, selectedQuoteToken, availableTradingPairs, tradingPair]);

  // Update selected pair when tokens change
  const handleBaseTokenChange = (token: string) => {
    setSelectedBaseToken(token);
    if (token && selectedQuoteToken) {
      const pair = availableTradingPairs?.find(
        p => p.baseSymbol === token && p.quoteSymbol === selectedQuoteToken
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
        p => p.baseSymbol === selectedBaseToken && p.quoteSymbol === token
      );
      if (pair && setSelectedPair) {
        setSelectedPair(pair.id);
      }
    }
  };

  // Debug: Log selected pair for state tracking
  console.log("SimpleForm selectedPair:", selectedPair);
  console.log("SimpleForm currentTradingPair:", currentTradingPair);

  const handleSubmitSimple = async () => {
    // Submit the order using shared logic
    await handleSubmitOrder(BaseOrQuote.BASE); // This will be overridden by the hook logic
  };

  return (
    <section className="w-full max-w-2xl mx-auto px-2 sm:px-0 h-full">
      <main className="bg-gray-900 text-white border-gray-700 rounded-lg shadow-lg h-full flex flex-col">
        <header className="flex flex-row items-center justify-between p-2 pt-3 border-b border-gray-700">
          <h2 className="text-lg sm:text-xl font-medium text-white">Simple</h2>
          <nav className="flex gap-2">
            {/* Mine filter toggle */}
            {address && (
              <button
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                  showOnlyMine
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                }`}
                title={showOnlyMine ? "Show all orders" : "Show only my orders"}
              >
                {showOnlyMine ? "Mine" : "All"}
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-blue-400 hover:bg-gray-800"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-blue-400 hover:bg-gray-800"
            >
              <History className="h-4 w-4" />
            </Button>
          </nav>
        </header>

        <main className="p-2 pt-5 pb-3 space-y-2 flex-1 overflow-auto">
          {/* Sender Section */}
          <fieldset className="space-y-1 bg-gray-800 rounded-lg p-2">
            <section className="flex flex-col sm:flex-row gap-1">
              <section className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-gray-400">Token</span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {selectedBaseToken
                        ? selectedBaseToken.charAt(0)
                        : "?"}
                    </span>
                  </span>
                  <Select
                    value={selectedBaseToken}
                    onValueChange={handleBaseTokenChange}
                  >
                    <SelectTrigger className="w-16 bg-transparent border-none text-white p-0 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {uniqueTokens.baseTokens.map((token) => (
                        <SelectItem
                          key={token}
                          value={token}
                          className="text-white hover:bg-gray-600"
                        >
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </section>

              <span className="hidden sm:block w-px bg-gray-700 mx-0.5"></span>

              <section className="flex flex-col gap-0.5 flex-1">
                <span className="text-xs text-gray-400">Network</span>
                <span className="flex items-center gap-1">
                  <Select
                    value={networkState.senderNetwork}
                    onValueChange={handleSenderNetworkChange}
                  >
                    <SelectTrigger className="bg-transparent border-none text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {chains.map((chain) => (
                        <SelectItem
                          key={chain.chainId}
                          value={chain.network}
                          className="text-white hover:bg-gray-600"
                        >
                          <section className="flex items-center gap-1">
                            <span>{chain.network}</span>
                            {chain.chainId === currentChainId && (
                              <span className="text-xs text-green-400">
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
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    )}
                </span>
              </section>
            </section>

            <span className="flex items-center gap-1">
              <Input
                type="number"
                value={formState.amount}
                onChange={(e) => updateAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent border-none text-xl font-medium text-white p-0 h-6 focus:ring-0 focus-visible:ring-0"
              />
            </span>

            <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
              <span className="text-gray-500">$0.00</span>
              <span className="flex items-center gap-1">
                <span className="text-gray-400">
                  Balance: {balanceLoading ? "Loading..." : `${formatDecimalConsistent(availableBalance)} ${currentTradingPair?.baseSymbol || "ATOM"}`}
                </span>
              </span>
            </section>

            {/* Percentage Buttons */}
            <nav className="flex gap-1">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded transition-colors",
                    formState.percentageValue === percentage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600",
                  )}
                >
                  {percentage}%
                </button>
              ))}
            </nav>
          </fieldset>

          {/* Swap Button */}
          <section className="flex justify-center py-2">
            <Button
              onClick={handleSwapTokens}
              variant="ghost"
              size="sm"
              className="rounded-lg border border-blue-500 bg-blue-500/20 hover:bg-blue-500/30 p-3"
            >
              <ArrowDownUp className="h-7 w-7 sm:h-4 sm:w-4 text-blue-400" />
            </Button>
          </section>

          {/* Receiver Section */}
          <fieldset className="space-y-1 bg-gray-800 rounded-lg p-2">
            <section className="flex flex-col sm:flex-row gap-1">
              <section className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-gray-400">Token</span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {selectedQuoteToken
                        ? selectedQuoteToken.charAt(0)
                        : "?"}
                    </span>
                  </span>
                  <Select
                    value={selectedQuoteToken}
                    onValueChange={handleQuoteTokenChange}
                  >
                    <SelectTrigger className="w-16 bg-transparent border-none text-white p-0 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {uniqueTokens.quoteTokens.map((token) => (
                        <SelectItem
                          key={token}
                          value={token}
                          className="text-white hover:bg-gray-600"
                        >
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </section>

              <span className="hidden sm:block w-px bg-gray-700 mx-0.5"></span>

              <section className="flex flex-col gap-0.5 flex-1">
                <span className="text-xs text-gray-400">Network</span>
                <span className="flex items-center gap-1">
                  <Select
                    value={networkState.receiverNetwork}
                    onValueChange={handleReceiverNetworkChange}
                  >
                    <SelectTrigger className="bg-transparent border-none text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {chains.map((chain) => (
                        <SelectItem
                          key={chain.chainId}
                          value={chain.network}
                          className="text-white hover:bg-gray-600"
                        >
                          <section className="flex items-center gap-1">
                            <span>{chain.network}</span>
                            {chain.chainId === currentChainId && (
                              <span className="text-xs text-green-400">
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
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    )}
                </span>
              </section>
            </section>

            {/* Address inside the field */}
            <span className="text-xs text-gray-400">
              To:{" "}
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not connected"}
            </span>

            <span className="flex items-center gap-2">
              <span className="text-2xl sm:text-2xl font-medium text-blue-400">
                {formState.amount || "0"}
              </span>
            </span>

            <span className="text-sm text-gray-500">$0.00</span>
          </fieldset>

          {/* Fee Section */}
          <section className="text-center bg-gray-800 rounded-lg py-1">
            <span className="text-xs text-gray-400">
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
              "w-full text-white font-medium py-8 text-lg",
              (() => {
                if (!currentChainId) return "bg-blue-600 hover:bg-blue-700";
                const currentChain = getCurrentChainConfig();
                const isBaseChain =
                  currentChain?.baseOrQuote === BaseOrQuote.BASE;
                return isBaseChain
                  ? "bg-red-600 hover:bg-red-700" // Sell (red)
                  : "bg-green-600 hover:bg-green-700"; // Buy (green)
              })(),
            )}
          >
            {formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 sm:h-4 sm:w-4 border-b-2 border-white"></span>
                Processing Simple...
              </span>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              (() => {
                if (!currentChainId) return "Simple Tokens";
                const currentChain = getCurrentChainConfig();
                const isBaseChain =
                  currentChain?.baseOrQuote === BaseOrQuote.BASE;
                return isBaseChain ? "Sell" : "Buy";
              })()
            )}
          </Button>
        </main>
      </main>
    </section>
  );
};

export default SimpleForm;
