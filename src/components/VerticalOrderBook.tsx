import { TradingPair } from "@/hooks/useTradingPairs";
import { formatDecimal, formatLargeNumber } from "../lib/number-utils";
import { useOrderbookContext } from "../contexts/OrderbookContext";

interface VerticalOrderBookProps {
  tradingPair?: TradingPair;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
}

const VerticalOrderBook = ({
  tradingPair,
  selectedPair,
  onPairChange,
  tradingPairs,
}: VerticalOrderBookProps): JSX.Element => {
  // Get the market ID from the trading pair prop (not from selectedTradingPair)
  const marketId = tradingPair?.id || "";

  // Use the shared orderbook context instead of separate hook
  const { orderbook, loading, initialLoading, error, refresh } =
    useOrderbookContext();

  // Debug logging
  console.log("🔍 VerticalOrderBook render:", {
    props: {
      tradingPair,
      selectedPair,
      tradingPairsCount: tradingPairs.length,
    },
    marketId,
    marketIdType: typeof marketId,
    marketIdTruthy: !!marketId,
    hookState: {
      orderbook,
      loading,
      initialLoading,
      error,
      hasRefetch: !!refresh,
    },
    orderbookData: {
      hasOrderbook: !!orderbook,
      orderbookKeys: orderbook ? Object.keys(orderbook) : [],
      orderbookType: typeof orderbook,
      asksCount: orderbook?.asks?.length || 0,
      bidsCount: orderbook?.bids?.length || 0,
      spread: orderbook?.spread,
      spreadPercentage: orderbook?.spreadPercentage,
    },
  });

  // Use real orderbook data
  const asks = orderbook?.asks || [];
  const bids = orderbook?.bids || [];
  const spreadValue = orderbook?.spread || 0;
  const spreadPercentage = orderbook?.spreadPercentage || 0;

  const formatNumber = (num: number): string => formatLargeNumber(num);
  const formatPrice = (price: string): string => formatDecimal(price);

  // Log the rendering decision
  console.log("🔍 VerticalOrderBook: Rendering decision:", {
    initialLoading,
    hasError: !!error,
    hasOrderbook: !!orderbook,
    hasAsks: asks.length > 0,
    hasBids: bids.length > 0,
    willShowLoading: initialLoading,
    willShowError: !!error,
    willShowNoData: !orderbook || (asks.length === 0 && bids.length === 0),
    willShowData: orderbook && (asks.length > 0 || bids.length > 0),
  });

  // Show loading state until we have actual data
  if (initialLoading) {
    return (
      <main className="h-full bg-white rounded-lg shadow-sm border">
        <header className="p-4 border-b">
          <nav className="flex items-center justify-between">
            <select
              value={selectedPair}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onPairChange(e.target.value)
              }
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
            >
              <option value="">Select a trading pair</option>
              {tradingPairs.map((pair: TradingPair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.displayName}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                console.log("Manual orderbook refresh triggered");
                refresh();
              }}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh orderbook"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </nav>
        </header>
        <section className="p-4 h-full flex items-center justify-center">
          <article className="text-center">
            <span className="text-gray-500">
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></span>
              Loading orderbook...
            </span>
          </article>
        </section>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="h-full bg-white rounded-lg shadow-sm border">
        <header className="p-4 border-b">
          <nav className="flex items-center justify-between">
            <select
              value={selectedPair}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onPairChange(e.target.value)
              }
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
            >
              <option value="">Select a trading pair</option>
              {tradingPairs.map((pair: TradingPair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.displayName}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                console.log("Manual orderbook refresh triggered");
                refresh();
              }}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh orderbook"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </nav>
        </header>
        <section className="p-4 h-full flex items-center justify-center">
          <span className="text-red-500">Error loading orderbook: {error}</span>
        </section>
      </main>
    );
  }

  // Show no data state only when we're not loading and have no data
  if (!orderbook || (asks.length === 0 && bids.length === 0)) {
    return (
      <main className="h-full bg-white rounded-lg shadow-sm border">
        <header className="p-4 border-b">
          <nav className="flex items-center justify-between">
            <select
              value={selectedPair}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onPairChange(e.target.value)
              }
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
            >
              <option value="">Select a trading pair</option>
              {tradingPairs.map((pair: TradingPair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.displayName}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                console.log("Manual orderbook refresh triggered");
                refresh();
              }}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh orderbook"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </nav>
        </header>
        <section className="p-4 h-full flex items-center justify-center">
          <article className="text-center">
            <span className="text-gray-500">
              <span className="text-lg mb-2">📊</span>
              No orderbook data available
              <span className="text-sm mt-1">
                This market may not have active orders yet
              </span>
            </span>
          </article>
        </section>
      </main>
    );
  }

  // Additional validation to ensure we have proper data
  if (!Array.isArray(asks) || !Array.isArray(bids)) {
    return (
      <main className="h-full bg-white rounded-lg shadow-sm border">
        <header className="p-4 border-b">
          <nav className="flex items-center justify-between">
            <select
              value={selectedPair}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onPairChange(e.target.value)
              }
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
            >
              <option value="">Select a trading pair</option>
              {tradingPairs.map((pair: TradingPair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.displayName}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                console.log("Manual orderbook refresh triggered");
                refresh();
              }}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh orderbook"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </nav>
        </header>
        <section className="p-4 h-full flex items-center justify-center">
          <span className="text-red-500">Invalid orderbook data format</span>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full bg-white rounded-lg shadow-sm border">
      <header className="p-4 border-b">
        <nav className="flex items-center justify-between">
          <select
            value={selectedPair}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onPairChange(e.target.value)
            }
            className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
          >
            <option value="">Select a trading pair</option>
            {tradingPairs.map((pair: TradingPair) => (
              <option key={pair.id} value={pair.id}>
                {pair.displayName}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              console.log("Manual orderbook refresh triggered");
              refresh();
            }}
            className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh orderbook"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </nav>
      </header>
      <section className="p-4 h-full overflow-auto">
        {/* Header */}
        <header className="grid grid-cols-3 text-xs text-gray-500 mb-2 gap-x-4">
          <span className="text-left">Price</span>
          <span className="text-right">
            Amount ({tradingPair?.baseSymbol || "TOKEN"})
          </span>
          <span className="text-right">
            Total ({tradingPair?.quoteSymbol || "TOKEN"})
          </span>
        </header>

        {/* Asks (Sell orders) - Red */}
        <section className="space-y-1">
          {asks.map((ask, i: number) => (
            <article
              key={i}
              className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-red-500 font-mono">
                {formatPrice(ask.price)}
              </span>
              <span className="text-right text-gray-700">{ask.quantity}</span>
              <span className="text-right text-gray-700">
                {(Number(ask.price) * Number(ask.quantity)).toFixed(6)}
              </span>
            </article>
          ))}
        </section>

        {/* Spread */}
        <article className="flex items-center justify-center py-2 my-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-600 mr-2">Spread:</span>
          <span className="text-gray-700 font-mono">
            {formatPrice(spreadValue.toString())}
          </span>
          <span className="text-gray-600 ml-2">
            ({spreadPercentage.toFixed(3)}%)
          </span>
        </article>

        {/* Bids (Buy orders) - Green */}
        <section className="space-y-1">
          {bids.map((bid, i: number) => (
            <article
              key={i}
              className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-green-500 font-mono">
                {formatPrice(bid.price)}
              </span>
              <span className="text-right text-gray-700">{bid.quantity}</span>
              <span className="text-right text-gray-700">
                {(Number(bid.price) * Number(bid.quantity)).toFixed(6)}
              </span>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
};

export default VerticalOrderBook;
