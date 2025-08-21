import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TradingPair } from "@/hooks/useTradingPairs";
import { useFormLogic } from "@/hooks/useFormLogic";
import { BaseOrQuote } from "@/protos/gen/arborter_config_pb";

interface TradeFormProps {
  selectedPair: string;
  tradingPair?: TradingPair;
}

// Define the valid trading sides (excluding UNSPECIFIED)
type TradingSide = BaseOrQuote.BASE | BaseOrQuote.QUOTE;

// Define the display mapping for tabs
const TAB_DISPLAY_MAP: Record<TradingSide, string> = {
  [BaseOrQuote.BASE]: "Buy", // BASE = buying the base asset
  [BaseOrQuote.QUOTE]: "Sell", // QUOTE = selling the base asset
} as const;

const TradeForm = ({ tradingPair }: TradeFormProps): JSX.Element => {
  // Use the shared form logic hook
  const {
    formState,
    tradingState,
    availableBalance,
    balanceLoading,
    isConnected,
    updateAmount,
    updatePrice,
    handlePercentageClick,
    handleSubmitOrder,
    handleSideChange,
    handleOrderTypeChange,
  } = useFormLogic({ tradingPair, isSimpleForm: false });

  const handleSubmitOrderForm = async (): Promise<void> => {
    // Submit the order using shared logic
    if (tradingState.activeTab) {
      await handleSubmitOrder(tradingState.activeTab);
    }
  };

  return (
    <section className="h-full bg-[#1a1c23] rounded-lg shadow-sm border border-gray-700 animate-fade-in overflow-hidden">
      <main className="p-2 sm:p-3 md:p-4 lg:p-6 h-full flex flex-col">
        {/* Buy/Sell Tabs */}
        <fieldset className="flex bg-[#2a2d3a] rounded-lg p-1 mb-3 sm:mb-4 lg:mb-6">
          {([BaseOrQuote.BASE, BaseOrQuote.QUOTE] as TradingSide[]).map(
            (tab: TradingSide) => (
              <button
                key={tab}
                onClick={() => handleSideChange(tab)}
                className={cn(
                  "flex-1 py-1.5 sm:py-2 md:py-2.5 lg:py-3 text-xs sm:text-sm font-bold rounded-md transition-colors",
                  tradingState.activeTab === tab
                    ? tab === BaseOrQuote.BASE
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-red-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white",
                )}
              >
                {TAB_DISPLAY_MAP[tab]}
              </button>
            ),
          )}
        </fieldset>

        {/* Order Type Toggle */}
        <fieldset className="mb-3 sm:mb-4 lg:mb-6">
          <legend className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-300">
              Order Type
            </span>
          </legend>
          <section className="flex bg-[#2a2d3a] rounded-lg p-1">
            {(["limit", "market"] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleOrderTypeChange(type)}
                className={cn(
                  "flex-1 py-1 px-2 sm:px-3 md:px-3.5 lg:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors",
                  tradingState.activeOrderType === type
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-600",
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </section>
        </fieldset>

        {/* Trade Form */}
        <section className="flex-1 flex flex-col min-h-[280px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[500px] justify-between">
          <fieldset className="flex-1 flex flex-col space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
            {/* Amount Input */}
            <section>
              <header className="flex justify-between items-center mb-1 sm:mb-2">
                <label
                  htmlFor="amount"
                  className="text-xs sm:text-sm font-medium text-gray-300"
                >
                  Order Amount
                </label>
              </header>
              <span className="text-xs text-gray-400">
                Available:{" "}
                {balanceLoading ? (
                  <span className="text-blue-400">Loading...</span>
                ) : (
                  <span className="text-blue-400">
                    {availableBalance} {tradingPair?.baseSymbol || "ATOM"}
                  </span>
                )}
              </span>
            </section>
            <section className="relative">
              <input
                type="text"
                id="amount"
                name="amount"
                value={formState.amount}
                onChange={(e) => updateAmount(e.target.value)}
                className={cn(
                  "w-full pl-2 pr-16 sm:pr-20 md:pr-24 lg:pr-28 xl:pr-32 py-2 sm:py-2.5 md:py-3 rounded-lg bg-[#2a2d3a] border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm sm:text-base transition-all",
                  ((): string => {
                    const quantity: number = parseFloat(
                      formState.amount.replace(",", "."),
                    );
                    const availableBalanceNum: number =
                      parseFloat(availableBalance);
                    if (
                      !isNaN(quantity) &&
                      !isNaN(availableBalanceNum) &&
                      quantity > availableBalanceNum
                    ) {
                      return "border-red-500 focus:border-red-500 focus:ring-red-500";
                    }
                    return "border-gray-600 focus:border-blue-500";
                  })(),
                )}
                placeholder="0,0"
                aria-describedby="amount-available"
              />
              <span id="amount-available" className="sr-only">
                Available balance: {availableBalance}{" "}
                {tradingPair?.baseSymbol || "ATOM"}
              </span>
              <section className="absolute right-2 sm:right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 min-w-0">
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">A</span>
                </span>
                <span className="text-xs text-gray-400 truncate max-w-[2rem] sm:max-w-[2.5rem] md:max-w-[3.5rem] lg:max-w-[4.5rem] xl:max-w-[5rem]">
                  {tradingPair?.baseSymbol || "ATOM"}
                </span>
              </section>
            </section>

            {/* Percentage Buttons */}
            <section>
              <nav className="flex gap-1 sm:gap-1.5 md:gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    onClick={() => handlePercentageClick(percentage)}
                    variant="ghost"
                    size="sm"
                    className="flex-1 py-1 sm:py-1.5 md:py-2 text-xs text-gray-400 hover:text-white hover:bg-[#2a2d3a] rounded"
                  >
                    {percentage}%
                  </Button>
                ))}
              </nav>
            </section>

            {/* Price Input (for limit orders) or Market Order Info */}
            {tradingState.activeOrderType === "limit" ? (
              <section>
                <header className="flex justify-between items-center mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-300">
                    Price
                  </span>
                </header>
                <section className="relative">
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formState.price || ""}
                    onChange={(e) => updatePrice(e.target.value)}
                    className="w-full pl-2 pr-12 sm:pr-16 md:pr-20 lg:pr-22 xl:pr-24 py-2 sm:py-2.5 md:py-3 rounded-lg bg-[#2a2d3a] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 text-sm sm:text-base transition-all"
                    placeholder="0,00"
                  />
                  <section className="absolute right-2 sm:right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 min-w-0">
                    <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">Q</span>
                    </span>
                    <span className="text-xs text-gray-400 truncate max-w-[1.5rem] sm:max-w-[2rem] md:max-w-[2.5rem] lg:max-w-[3.5rem] xl:max-w-[4rem]">
                      {tradingPair?.quoteSymbol || "TTK"}
                    </span>
                  </section>
                </section>
              </section>
            ) : (
              /* Market Order Info - maintains consistent height */
              <section>
                <header className="flex justify-between items-center mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-300">
                    Market Order
                  </span>
                </header>
                <article className="p-2 sm:p-2.5 md:p-3 bg-[#2a2d3a] rounded-lg border border-gray-600">
                  <p className="text-xs sm:text-sm text-gray-400">
                    Market orders execute at the best available price
                  </p>
                </article>
              </section>
            )}
          </fieldset>

          <footer>
            {/* Order Summary */}
            <section className="p-2 sm:p-3 md:p-4 bg-[#2a2d3a] rounded-lg">
              <dl className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                <section className="flex justify-between">
                  <dt className="text-gray-400">Order Type:</dt>
                  <dd className="text-white capitalize">
                    {tradingState.activeOrderType}
                  </dd>
                </section>
                <section className="flex justify-between">
                  <dt className="text-gray-400">Side:</dt>
                  <dd
                    className={cn(
                      "font-medium",
                      tradingState.activeTab === BaseOrQuote.BASE
                        ? "text-green-400"
                        : "text-red-400",
                    )}
                  >
                    {
                      TAB_DISPLAY_MAP[
                        tradingState.activeTab || BaseOrQuote.BASE
                      ]
                    }
                  </dd>
                </section>
                <section className="flex justify-between">
                  <dt className="text-gray-400">Amount:</dt>
                  <dd className="text-white">
                    {formState.amount || "0"}{" "}
                    {tradingPair?.baseSymbol || "ATOM"}
                  </dd>
                </section>
                {tradingState.activeOrderType === "limit" && formState.price ? (
                  <section className="flex justify-between">
                    <dt className="text-gray-400">Price:</dt>
                    <dd className="text-white">
                      {formState.price} {tradingPair?.quoteSymbol || "TTK"}
                    </dd>
                  </section>
                ) : tradingState.activeOrderType === "market" ? (
                  <section className="flex justify-between">
                    <dt className="text-gray-400">Price:</dt>
                    <dd className="text-gray-500">Market Price</dd>
                  </section>
                ) : null}
              </dl>
            </section>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitOrderForm}
              disabled={
                !isConnected ||
                !formState.amount ||
                parseFloat(formState.amount) <= 0 ||
                formState.isSubmitting
              }
              className={cn(
                "w-full py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors",
                tradingState.activeTab === BaseOrQuote.BASE
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white"
                  : "bg-gradient-to-r from-[#00b8a9] to-[#00a8b9] hover:from-[#00a8b9] hover:to-[#00a8b9] text-white",
              )}
            >
              {formState.isSubmitting ? (
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></span>
                  <span className="text-xs sm:text-sm">Processing...</span>
                </span>
              ) : (
                `${TAB_DISPLAY_MAP[tradingState.activeTab || BaseOrQuote.BASE]} ${tradingPair?.baseSymbol || "ATOM"}`
              )}
            </Button>
          </footer>
        </section>
      </main>
    </section>
  );
};

export default TradeForm;
