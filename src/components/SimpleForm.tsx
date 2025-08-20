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
import { TradingPair } from "@/hooks/useTradingPairs";
import { useFormLogic } from "@/hooks/useFormLogic";
import { BaseOrQuote } from "../protos/gen/arborter_config_pb";

interface SimpleFormProps {
  selectedPair?: string;
  tradingPair?: TradingPair;
}

const SimpleForm = ({ tradingPair }: SimpleFormProps): JSX.Element => {
  // Use the shared form logic hook
  const {
    formState,
    networkState,
    availableBalance,
    balanceLoading,
    currentChainId,
    isConnected,
    address,
    tradingPairs,
    chains,
    updateAmount,
    handlePercentageClick,
    handleSubmitOrder,
    handleSwapTokens,
    handleSenderNetworkChange,
    handleReceiverNetworkChange,
    getCurrentChainConfig,
  } = useFormLogic({ tradingPair, isSimpleForm: true });

  const handleSubmitSimple = async () => {
    // Submit the order using shared logic
    await handleSubmitOrder(BaseOrQuote.BASE); // This will be overridden by the hook logic
  };

  return (
    <section className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <main className="bg-gray-900 text-white border-gray-700 rounded-lg shadow-lg">
        <header className="flex flex-row items-center justify-between p-3 sm:p-4 border-b border-gray-700">
          <h2 className="text-lg sm:text-xl font-medium text-white">Simple</h2>
          <nav className="flex gap-2">
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

        <main className="p-3 sm:p-4 space-y-4 sm:space-y-3">
          {/* Sender Section */}
          <fieldset className="space-y-4 sm:space-y-2 bg-gray-800 rounded-lg p-4 sm:p-2">
            <legend className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                From:{" "}
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </span>
            </legend>

            <section className="flex flex-col sm:flex-row gap-4 sm:gap-3">
              <section className="flex flex-col gap-2 min-w-0">
                <span className="text-xs text-gray-400">Token</span>
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {tradingPair?.baseSymbol
                        ? tradingPair.baseSymbol.charAt(0)
                        : "?"}
                    </span>
                  </span>
                  <Select
                    value={tradingPair?.baseSymbol}
                    onValueChange={(value) => {
                      const pair = tradingPairs.find(
                        (p) => p.baseSymbol === value,
                      );
                      if (pair) {
                        // This will trigger a re-render of the form, which will update the receiver token
                        // and potentially the trading pair.
                        // The useFormLogic hook will handle the actual state update.
                      }
                    }}
                  >
                    <SelectTrigger className="w-20 bg-transparent border-none text-white p-0 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {tradingPairs.map((pair) => (
                        <SelectItem
                          key={pair.baseSymbol}
                          value={pair.baseSymbol}
                          className="text-white hover:bg-gray-600"
                        >
                          {pair.displayName.split("/")[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </section>

              <span className="hidden sm:block w-px bg-gray-700 mx-1"></span>

              <section className="flex flex-col gap-2 flex-1">
                <span className="text-xs text-gray-400">Network</span>
                <span className="flex items-center gap-2">
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
                          <section className="flex items-center gap-2">
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

            <span className="flex items-center gap-2">
              <Input
                value={formState.amount}
                onChange={(e) => updateAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent border-none text-xl sm:text-2xl font-medium text-white p-0 h-auto focus:ring-0 focus-visible:ring-0"
              />
            </span>

            <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 text-sm">
              <span className="text-gray-500">$0.00</span>
              <span className="flex items-center gap-2">
                <span className="text-gray-400">
                  Balance: {balanceLoading ? "Loading..." : availableBalance}
                </span>
              </span>
            </section>

            {/* Percentage Buttons */}
            <nav className="flex gap-2 sm:gap-1">
              {[10, 25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className={cn(
                    "flex-1 py-3 sm:py-0.5 text-sm sm:text-xs rounded transition-colors",
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
          <section className="flex justify-center py-3 sm:py-2">
            <Button
              onClick={handleSwapTokens}
              variant="ghost"
              size="sm"
              className="rounded-lg border border-blue-500 bg-blue-500/20 hover:bg-blue-500/30 p-4 sm:p-2"
            >
              <ArrowDownUp className="h-6 w-6 sm:h-4 sm:w-4 text-blue-400" />
            </Button>
          </section>

          {/* Receiver Section */}
          <fieldset className="space-y-4 sm:space-y-2 bg-gray-800 rounded-lg p-4 sm:p-2">
            <legend className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                To:{" "}
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </span>
            </legend>

            <section className="flex flex-col sm:flex-row gap-4 sm:gap-3">
              <section className="flex flex-col gap-2 min-w-0">
                <span className="text-xs text-gray-400">Token</span>
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {tradingPair?.quoteSymbol
                        ? tradingPair.quoteSymbol.charAt(0)
                        : "?"}
                    </span>
                  </span>
                  <Select
                    value={tradingPair?.quoteSymbol}
                    onValueChange={(value) => {
                      const pair = tradingPairs.find(
                        (p) => p.quoteSymbol === value,
                      );
                      if (pair) {
                        // This will trigger a re-render of the form, which will update the receiver token
                        // and potentially the trading pair.
                        // The useFormLogic hook will handle the actual state update.
                      }
                    }}
                  >
                    <SelectTrigger className="w-20 bg-transparent border-none text-white p-0 h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {tradingPairs.map((pair) => (
                        <SelectItem
                          key={pair.quoteSymbol}
                          value={pair.quoteSymbol}
                          className="text-white hover:bg-gray-600"
                        >
                          {pair.displayName.split("/")[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </section>

              <span className="hidden sm:block w-px bg-gray-700 mx-1"></span>

              <section className="flex flex-col gap-2 flex-1">
                <span className="text-xs text-gray-400">Network</span>
                <span className="flex items-center gap-2">
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
                          <section className="flex items-center gap-2">
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

            <span className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-medium text-blue-400">
                {formState.amount || "0"}
              </span>
            </span>

            <span className="text-sm text-gray-500">$0.00</span>
          </fieldset>

          {/* Fee Section */}
          <section className="bg-gray-800 rounded-lg p-3 sm:p-1">
            <article className="flex items-center gap-2 px-3 py-3 sm:py-2">
              <span className="w-4 h-4 bg-gray-600 rounded-full"></span>
              <span className="text-white">
                Fee:{" "}
                {(() => {
                  const amountValue = parseFloat(
                    formState.amount.replace(",", "."),
                  );
                  if (isNaN(amountValue) || !amountValue) return "0.00";
                  const fee = amountValue * 0.01; // 1% fee
                  return fee.toFixed(2);
                })()}{" "}
                {tradingPair?.quoteSymbol || "TTK"}
              </span>
            </article>
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
              "w-full text-white font-medium py-4 sm:py-2 text-base sm:text-sm",
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
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
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
