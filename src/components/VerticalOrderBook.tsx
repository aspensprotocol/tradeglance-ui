import React, { useMemo } from "react";
import { TradingPair } from "@/hooks/useTradingPairs";
import { formatDecimalConsistent } from "../lib/number-utils";
import { useOrderbookContext } from "../hooks/useOrderbookContext";
import { OrderbookEntry } from "../protos/gen/arborter_pb";

interface VerticalOrderBookProps {
  tradingPair?: TradingPair;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
}

// Virtualized orderbook row component for better performance
const OrderbookRow = React.memo(({ 
  entry, 
  isAsk, 
}: { 
  entry: OrderbookEntry; 
  index: number; 
  isAsk: boolean; 
  baseSymbol: string;
  quoteSymbol: string;
}) => (
  <article
    className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer"
  >
    <span className={`font-mono ${isAsk ? 'text-red-500' : 'text-green-500'}`}>
      {entry.price}
    </span>
    <span className="text-right text-gray-700">{entry.quantity}</span>
    <span className="text-right text-gray-700">
      {formatDecimalConsistent(Number(entry.price) * Number(entry.quantity))}
    </span>
  </article>
));

OrderbookRow.displayName = 'OrderbookRow';

const VerticalOrderBook = React.memo(({
  tradingPair,
  selectedPair,
  onPairChange,
  tradingPairs,
}: VerticalOrderBookProps): JSX.Element => {

  // Use the shared orderbook context instead of separate hook
  const { orderbook, initialLoading, error, refresh } =
    useOrderbookContext();

  // Memoize the orderbook data to prevent unnecessary re-renders
  const { asks, bids, spreadValue, spreadPercentage } = useMemo(() => ({
    asks: orderbook?.asks || [],
    bids: orderbook?.bids || [],
    spreadValue: orderbook?.spread || 0,
    spreadPercentage: orderbook?.spreadPercentage || 0,
  }), [orderbook]);

  // Memoize the trading pair options to prevent recreation
  const tradingPairOptions = useMemo(() => 
    tradingPairs.map((pair: TradingPair) => (
      <option key={pair.id} value={pair.id}>
        {pair.displayName}
      </option>
    )),
    [tradingPairs]
  );

  // Memoize the header component to prevent recreation
  const headerComponent = useMemo(() => (
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
          {tradingPairOptions}
        </select>
        <button
          onClick={() => refresh()}
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </nav>
    </header>
  ), [selectedPair, onPairChange, tradingPairOptions, refresh]);

  // Memoize the orderbook content to prevent unnecessary re-renders
  const orderbookContent = useMemo(() => {
    // Show loading state until we have actual data
    if (initialLoading) {
      return (
        <main className="h-full bg-white rounded-lg shadow-sm border">
          {headerComponent}
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
          {headerComponent}
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
          {headerComponent}
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
          <span className="text-red-500">Invalid orderbook data format</span>
        </main>
      );
    }

    // Return the actual orderbook content
    return (
      <>
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
            <OrderbookRow
              key={`ask-${i}-${ask.orderId}`}
              entry={ask}
              index={i}
              isAsk={true}
              baseSymbol={tradingPair?.baseSymbol || "TOKEN"}
              quoteSymbol={tradingPair?.quoteSymbol || "TOKEN"}
            />
          ))}
        </section>

        {/* Spread */}
        <article className="flex items-center justify-center py-2 my-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-600 mr-2">Spread:</span>
          <span className="text-gray-700 font-mono">
            {spreadValue.toString()}
          </span>
          <span className="text-gray-600 ml-2">
            ({formatDecimalConsistent(spreadPercentage)}%)
          </span>
        </article>

        {/* Bids (Buy orders) - Green */}
        <section className="space-y-1">
          {bids.map((bid, i: number) => (
            <OrderbookRow
              key={`bid-${i}-${bid.orderId}`}
              entry={bid}
              index={i}
              isAsk={false}
              baseSymbol={tradingPair?.baseSymbol || "TOKEN"}
              quoteSymbol={tradingPair?.quoteSymbol || "TOKEN"}
            />
          ))}
        </section>
      </>
    );
  }, [initialLoading, error, orderbook, asks, bids, spreadValue, spreadPercentage, tradingPair, headerComponent]);

  // Always return the component - no early returns to violate Rules of Hooks
  return (
    <main className="h-full bg-white rounded-lg shadow-sm border">
      {headerComponent}
      <section className="p-4 h-full overflow-auto">
        {orderbookContent}
      </section>
    </main>
  );
});

VerticalOrderBook.displayName = 'VerticalOrderBook';

export default VerticalOrderBook;
