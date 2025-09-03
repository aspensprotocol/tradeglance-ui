import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TokenImage } from "@/components/ui/token-image";
import { useFormLogic } from "@/hooks/useFormLogic";
import { useConfig } from "@/hooks/useConfig";
import { BaseOrQuote } from "@/protos/gen/arborter_config_pb";
import { formatDecimalConsistent } from "@/lib/number-utils";
import type { TradeFormProps } from "@/lib/shared-types";

const TradeForm = ({
  tradingPair,
  onTradingSideChange,
}: TradeFormProps): JSX.Element => {
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

  // Debug logging removed for performance

  // Check if configuration is still loading
  const { config, loading: configLoading } = useConfig();
  const chains = config?.chains || [];
  const isConfigReady = chains.length > 0;

  const handleSubmitOrderForm = async (): Promise<void> => {
    // Submit the order using shared logic
    if (tradingState.activeTab) {
      await handleSubmitOrder(tradingState.activeTab);
    }
  };

  return (
    <section className="h-full bg-gradient-to-br from-white via-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 animate-fade-in overflow-visible relative shadow-visible">
      {/* Floating decorative elements */}
      <section className="absolute inset-0 pointer-events-none overflow-hidden">
        <section className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-emerald-300/5 to-teal-300/5 rounded-full blur-md animate-pulse delay-300"></section>
        <section className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-blue-300/5 to-indigo-300/5 rounded-full blur-md animate-pulse delay-700"></section>
      </section>

      <main className="p-4 sm:p-5 md:p-6 lg:p-6 h-full flex flex-col relative z-10">
        {/* Group 1: Buy/Sell Tabs and Order Type Toggle */}
        <section className="space-y-3 mb-4">
          {/* Configuration Loading Indicator */}
          {!isConfigReady && (
            <section className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-sm text-yellow-700">
                {configLoading
                  ? "Loading configuration..."
                  : "Configuration not ready"}
              </span>
            </section>
          )}

          {/* Configuration Error Indicator */}
          {!configLoading && !isConfigReady && (
            <section className="text-center p-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-700">
                Unable to load trading configuration. Please refresh the page.
              </span>
            </section>
          )}

          {/* Buy/Sell Tabs - Buy always left, Sell always right */}
          <fieldset className="flex bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-xl p-1.5 shadow-inner relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <section className="absolute inset-0 bg-gradient-to-r from-emerald-400/2 to-teal-400/2 pointer-events-none"></section>

            {/* Buy button - always left */}
            <button
              onClick={() => {
                console.log(
                  "TradeForm: Buy button clicked, calling handleSideChange with QUOTE",
                );
                handleSideChange(BaseOrQuote.QUOTE);
                onTradingSideChange?.(BaseOrQuote.QUOTE);
              }}
              disabled={!isConfigReady}
              className={cn(
                "flex-1 py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 transform hover:scale-105 relative z-10",
                tradingState.activeTab === BaseOrQuote.QUOTE
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg animate-pulse-glow" // Buy (green)
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/60",
                !isConfigReady && "opacity-50 cursor-not-allowed",
              )}
            >
              {tradingState.activeTab === BaseOrQuote.QUOTE && (
                <section className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-lg animate-pulse"></section>
              )}
              <span className="relative z-10">Buy</span>
            </button>
            {/* Sell button - always right */}
            <button
              onClick={() => {
                console.log(
                  "TradeForm: Sell button clicked, calling handleSideChange with BASE",
                );
                handleSideChange(BaseOrQuote.BASE);
                onTradingSideChange?.(BaseOrQuote.BASE);
              }}
              disabled={!isConfigReady}
              className={cn(
                "flex-1 py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 transform hover:scale-105 relative z-10",
                tradingState.activeTab === BaseOrQuote.BASE
                  ? "bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white shadow-lg animate-pulse-glow" // Sell (red)
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/60",
                !isConfigReady && "opacity-50 cursor-not-allowed",
              )}
            >
              {tradingState.activeTab === BaseOrQuote.BASE && (
                <section className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-lg animate-pulse"></section>
              )}
              <span className="relative z-10">Sell</span>
            </button>
          </fieldset>

          {/* Order Type Toggle */}
          <fieldset>
            <legend className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base font-semibold text-gray-700">
                Order Type
              </span>
            </legend>
            <section className="flex bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-xl p-1.5 shadow-inner relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <section className="absolute inset-0 bg-gradient-to-r from-blue-400/2 to-indigo-400/2 pointer-events-none"></section>

              {(["limit", "market"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleOrderTypeChange(type)}
                  className={cn(
                    "flex-1 py-2.5 px-3 text-sm sm:text-base font-medium rounded-xl transition-all duration-300 transform hover:scale-105 relative z-10",
                    tradingState.activeOrderType === type
                      ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-md animate-pulse-glow"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/60",
                  )}
                >
                  {tradingState.activeOrderType === type && (
                    <section className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg animate-pulse"></section>
                  )}
                  <span className="relative z-10">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </button>
              ))}
            </section>
          </fieldset>
        </section>

        {/* Group 2: Order Amount, Available, Input field, and percentages */}
        <section className="space-y-2 mb-4">
          {/* Amount Input */}
          <section>
            <header className="flex justify-between items-center mb-1">
              <label
                htmlFor="amount"
                className="text-sm sm:text-base font-semibold text-gray-700"
              >
                Order Amount
              </label>
            </header>
            <span className="text-sm text-gray-600">
              <div className="flex flex-col gap-1">
                <div>
                  Available:{" "}
                  {balanceLoading ? (
                    <span className="text-blue-500 font-medium animate-pulse">
                      Loading...
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">
                      {formatDecimalConsistent(availableBalance)}{" "}
                      {tradingState.activeTab === BaseOrQuote.QUOTE
                        ? tradingPair?.quoteSymbol || "USDC"
                        : tradingPair?.baseSymbol || "ATOM"}
                    </span>
                  )}
                </div>
              </div>
              {parseFloat(availableBalance) === 0 && (
                <span className="text-orange-600 text-xs block mt-1">
                  💡 You need to deposit tokens first to start trading
                </span>
              )}
            </span>
          </section>
          <section className="relative">
            <input
              type="number"
              id="amount"
              name="amount"
              min="0"
              step="any"
              value={formState.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith("-")) return; // Prevent negative numbers
                updateAmount(value);
              }}
              className={cn(
                "w-full pl-3 pr-20 sm:pr-24 md:pr-28 lg:pr-32 py-3 rounded-xl bg-white border-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 text-sm transition-all duration-300 shadow-sm hover:shadow-md relative z-10",
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
                    return "border-red-400 focus:border-red-500 focus:ring-red-500";
                  }
                  return "border-emerald-200 focus:border-emerald-500";
                })(),
              )}
              placeholder="0,0"
              aria-describedby="amount-available"
            />
            <span id="amount-available" className="sr-only">
              Available balance: {formatDecimalConsistent(availableBalance)}{" "}
              {tradingState.activeTab === BaseOrQuote.QUOTE
                ? tradingPair?.quoteSymbol || "USDC"
                : tradingPair?.baseSymbol || "ATOM"}
            </span>
            <section className="absolute right-3 sm:right-4 md:right-4 lg:right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 min-w-0">
              <TokenImage
                symbol={
                  tradingState.activeTab === BaseOrQuote.QUOTE
                    ? tradingPair?.quoteSymbol || "USDC"
                    : tradingPair?.baseSymbol || "ATOM"
                }
                size="sm"
                chainId={
                  tradingState.activeTab === BaseOrQuote.QUOTE
                    ? tradingPair?.quoteChainId
                    : tradingPair?.baseChainId
                }
              />
              <span className="text-sm text-gray-600 truncate max-w-[3rem] sm:max-w-[3.5rem] md:max-w-[4rem] lg:max-w-[4.5rem] xl:max-w-[5rem] font-medium">
                {tradingState.activeTab === BaseOrQuote.QUOTE
                  ? tradingPair?.quoteSymbol || "USDC"
                  : tradingPair?.baseSymbol || "ATOM"}
              </span>
            </section>
          </section>

          {/* Balance Information and Deposit Link */}
          {parseFloat(availableBalance) === 0 && (
            <section className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-orange-800">
                  <span className="font-medium">
                    No tokens available for trading
                  </span>
                  <p className="text-xs text-orange-600 mt-1">
                    You need to deposit{" "}
                    {tradingState.activeTab === BaseOrQuote.QUOTE
                      ? tradingPair?.quoteSymbol || "USDC"
                      : tradingPair?.baseSymbol || "ATOM"}{" "}
                    tokens first
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // You can implement a modal or navigation to deposit page here
                    console.log("Navigate to deposit page");
                  }}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100 text-xs px-3 py-1"
                >
                  Deposit
                </Button>
              </div>
            </section>
          )}

          {/* Percentage Buttons */}
          <section className="-mt-1">
            <nav className="flex gap-1.5 sm:gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  variant="ghost"
                  size="sm"
                  className="flex-1 py-0.5 px-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-emerald-100 rounded-md transition-all duration-300 font-medium hover:scale-105 transform bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md animate-pulse-glow relative overflow-hidden group h-6"
                >
                  {/* Floating sparkles */}
                  <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-60"></span>
                  <span className="absolute -top-0.5 -right-0.5 w-0.5 h-0.5 bg-indigo-400 rounded-full animate-ping opacity-60 delay-300"></span>

                  {/* Glowing effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

                  <span className="relative z-10">{percentage}%</span>
                </Button>
              ))}
            </nav>
          </section>
        </section>

        {/* Trade Form */}
        <section className="flex-1 flex flex-col justify-between">
          <fieldset className="flex-1 flex flex-col space-y-2 sm:space-y-3">
            {/* Group 3: Price and input field - Fixed height container */}
            <section className="h-[88px] mb-1">
              {tradingState.activeOrderType === "limit" ? (
                <section className="space-y-1 h-full flex flex-col justify-between">
                  <header className="flex justify-between items-center mb-1">
                    <span className="text-sm sm:text-base font-semibold text-gray-700">
                      Price
                    </span>
                  </header>
                  <section className="relative flex-1">
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      step="any"
                      value={formState.price || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith("-")) return; // Prevent negative numbers
                        updatePrice(value);
                      }}
                      className="w-full pl-3 pr-16 sm:pr-20 md:pr-22 lg:pr-24 py-3 rounded-xl bg-white border-2 border-emerald-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 focus:border-emerald-500 text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                      placeholder="0,00"
                    />
                    <section className="absolute right-3 sm:right-4 md:right-4 lg:right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 min-w-0">
                      <TokenImage
                        symbol={
                          tradingState.activeTab === BaseOrQuote.QUOTE
                            ? tradingPair?.baseSymbol || "ATOM"
                            : tradingPair?.quoteSymbol || "USDC"
                        }
                        size="sm"
                        chainId={
                          tradingState.activeTab === BaseOrQuote.QUOTE
                            ? tradingPair?.baseChainId
                            : tradingPair?.quoteChainId
                        }
                      />
                      <span className="text-sm text-gray-600 truncate max-w-[2rem] sm:max-w-[2.5rem] md:max-w-[3rem] lg:max-w-[3.5rem] xl:max-w-[4rem] font-medium">
                        {tradingState.activeTab === BaseOrQuote.QUOTE
                          ? tradingPair?.baseSymbol || "ATOM"
                          : tradingPair?.quoteSymbol || "USDC"}
                      </span>
                    </section>
                  </section>
                </section>
              ) : (
                /* Market Order Info - maintains consistent height */
                <section className="space-y-1 h-full flex flex-col justify-between">
                  <header className="flex justify-between items-center mb-1">
                    <span className="text-sm sm:text-base font-semibold text-gray-700">
                      Market Order
                    </span>
                  </header>
                  <article className="p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 relative overflow-hidden flex-1 flex items-center">
                    {/* Subtle gradient overlay */}
                    <section className="absolute inset-0 bg-gradient-to-r from-blue-400/2 to-indigo-400/2 pointer-events-none"></section>
                    <p className="text-sm sm:text-base text-blue-700 font-medium relative z-10">
                      Market orders execute at the best available price
                    </p>
                  </article>
                </section>
              )}
            </section>
          </fieldset>

          <footer className="mt-1">
            {/* Order Summary */}
            <section className="p-2.5 sm:p-3 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <section className="absolute inset-0 bg-gradient-to-r from-emerald-400/2 to-teal-400/2 pointer-events-none"></section>

              <dl className="space-y-1 text-xs sm:text-sm relative z-10">
                <section className="flex justify-between">
                  <dt className="text-neutral-700 font-medium">Order Type:</dt>
                  <dd className="text-neutral-900 font-semibold capitalize">
                    {tradingState.activeOrderType}
                  </dd>
                </section>
                <section className="flex justify-between">
                  <dt className="text-neutral-700 font-medium">Side:</dt>
                  <dd
                    className={cn(
                      "font-semibold",
                      tradingState.activeTab === BaseOrQuote.BASE
                        ? "text-red-500" // BASE = Sell (red)
                        : "text-emerald-500", // QUOTE = Buy (green)
                    )}
                  >
                    {tradingState.activeTab === BaseOrQuote.BASE
                      ? "Sell"
                      : "Buy"}
                  </dd>
                </section>
                <section className="flex justify-between">
                  <dt className="text-neutral-700 font-medium">Amount:</dt>
                  <dd className="text-neutral-900 font-semibold">
                    {formState.amount || "0"}{" "}
                    {tradingState.activeTab === BaseOrQuote.QUOTE
                      ? tradingPair?.quoteSymbol || "USDC"
                      : tradingPair?.baseSymbol || "ATOM"}
                  </dd>
                </section>
                {tradingState.activeOrderType === "limit" && (
                  <section className="flex justify-between">
                    <dt className="text-neutral-700 font-medium">Price:</dt>
                    <dd className="text-neutral-900 font-semibold">
                      {formState.price || "0"}{" "}
                      {tradingState.activeTab === BaseOrQuote.QUOTE
                        ? tradingPair?.baseSymbol || "ATOM"
                        : tradingPair?.quoteSymbol || "USDC"}
                    </dd>
                  </section>
                )}
                {tradingState.activeOrderType === "market" && (
                  <section className="flex justify-between">
                    <dt className="text-neutral-700 font-medium">Price:</dt>
                    <dd className="text-neutral-600 font-medium">
                      Market Price
                    </dd>
                  </section>
                )}
                <section className="flex justify-between">
                  <dt className="text-neutral-700 font-medium">Fee:</dt>
                  <dd className="text-neutral-600 font-medium">
                    {(() => {
                      const amount =
                        parseFloat(formState.amount.replace(",", ".")) || 0;
                      const price =
                        parseFloat(
                          (formState.price || "0").replace(",", "."),
                        ) || 0;
                      const feeRate = 0.01; // 1%
                      const feeAmount = amount * price * feeRate;

                      if (feeAmount > 0) {
                        return `${feeAmount.toFixed(3)} ${
                          tradingState.activeTab === BaseOrQuote.QUOTE
                            ? tradingPair?.baseSymbol || "ATOM"
                            : tradingPair?.quoteSymbol || "USDC"
                        }`;
                      }
                      return "0.000";
                    })()}
                  </dd>
                </section>
                <section className="flex justify-between">
                  <dt className="text-neutral-700 font-medium">Total:</dt>
                  <dd className="text-neutral-900 font-semibold">
                    {(() => {
                      const amount =
                        parseFloat(formState.amount.replace(",", ".")) || 0;
                      const price =
                        parseFloat(
                          (formState.price || "0").replace(",", "."),
                        ) || 0;
                      const feeRate = 0.01; // 1%

                      if (tradingState.activeTab === BaseOrQuote.BASE) {
                        // SELL: User receives quote tokens, pays fee in base tokens
                        const totalReceived = amount * price * (1 - feeRate);
                        return `${totalReceived.toFixed(3)} ${tradingPair?.quoteSymbol || "USDC"}`;
                      }
                      // BUY: User pays quote tokens, receives base tokens minus fee
                      const totalPaid = amount * price * (1 + feeRate);
                      return `${totalPaid.toFixed(3)} ${tradingPair?.quoteSymbol || "USDC"}`;
                    })()}
                  </dd>
                </section>
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
                "w-full py-3 rounded-2xl text-base font-semibold transition-all duration-300 mt-2 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden animate-pulse-glow",
                tradingState.activeTab === BaseOrQuote.BASE
                  ? "bg-gradient-to-r from-red-500 via-pink-500 to-cyan-500 hover:from-red-600 hover:via-pink-600 hover:to-cyan-600 text-white"
                  : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white",
              )}
            >
              {/* Floating sparkles */}
              <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
              <span className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-75 delay-700"></span>

              {/* Glowing effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

              {formState.isSubmitting ? (
                <span className="flex items-center gap-2 sm:gap-3 relative z-10">
                  <span className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></span>
                  <span className="text-sm sm:text-base">Processing...</span>
                </span>
              ) : (
                <span className="relative z-10">
                  {`${tradingState.activeTab === BaseOrQuote.BASE ? "Sell" : "Buy"} ${
                    tradingState.activeTab === BaseOrQuote.QUOTE
                      ? tradingPair?.quoteSymbol || "USDC"
                      : tradingPair?.baseSymbol || "ATOM"
                  }`}
                </span>
              )}
            </Button>
          </footer>
        </section>
      </main>
    </section>
  );
};

export default TradeForm;
