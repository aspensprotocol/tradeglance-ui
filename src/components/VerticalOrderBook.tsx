import React, { useState } from "react";
import type { TradingPair } from "@/lib/shared-types";
import { formatDecimalConsistent } from "../lib/number-utils";
import { useMarketOrderbook } from "../hooks/useMarketOrderbook";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";
import type { VerticalOrderBookProps } from "../lib/shared-types";
import { useAccount } from "wagmi";

// Virtualized orderbook row component for better performance
const OrderbookRow = React.memo(
  ({ entry, isAsk }: { entry: OrderbookEntry; isAsk: boolean }) => {
    return (
      <article className="grid grid-cols-3 text-xs sm:text-sm gap-x-2 sm:gap-x-4 py-1 sm:py-0.5 hover:bg-gray-50 cursor-pointer">
        <span
          className={`font-mono text-xs sm:text-sm ${isAsk ? "text-red-500" : "text-green-500"}`}
        >
          {formatDecimalConsistent(entry.price)}
        </span>
        <span className="text-right text-gray-700 text-xs sm:text-sm">
          {formatDecimalConsistent(entry.quantity)}
        </span>
        <span className="text-right text-gray-700 text-xs sm:text-sm">
          {formatDecimalConsistent(
            Number(entry.price) * Number(entry.quantity),
          )}
        </span>
      </article>
    );
  },
);

OrderbookRow.displayName = "OrderbookRow";

const VerticalOrderBook = React.memo(
  ({
    tradingPair,
    selectedPair,
    onPairChange,
    tradingPairs,
  }: VerticalOrderBookProps): JSX.Element => {
    // Get current user's wallet address for filtering
    const { address } = useAccount();

    // State for "Mine" filter toggle
    const [showOnlyMine, setShowOnlyMine] = useState(false);

    // Determine the filter to use - if "Mine" is selected and user is connected, filter by their address
    const filterByTrader = showOnlyMine && address ? address : undefined;

    const { orderbook, initialLoading, error, refresh } = useMarketOrderbook(
      tradingPair?.id || "",
      filterByTrader,
    );

    // Extract orderbook data
    const { asks, bids, spread, spreadPercentage } = orderbook || {
      asks: [],
      bids: [],
      spread: 0,
      spreadPercentage: 0,
    };

    // Create trading pair options
    const tradingPairOptions = tradingPairs.map((pair: TradingPair) => (
      <option key={pair.id} value={pair.id}>
        {pair.displayName}
      </option>
    ));

    // Create header component
    const headerComponent = (
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
          <nav className="flex items-center gap-2">
            {/* Mine filter toggle */}
            {address && (
              <button
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  showOnlyMine
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                title={showOnlyMine ? "Show all orders" : "Show only my orders"}
              >
                {showOnlyMine ? "Mine" : "All"}
              </button>
            )}
            <button
              onClick={() => refresh()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
        </nav>
      </header>
    );

    // Create orderbook content
    const orderbookContent = (() => {
      // Show loading state until we have actual data
      if (initialLoading) {
        return (
          <section className="p-4 h-full flex items-center justify-center">
            <article className="text-center">
              <span className="text-gray-500">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></span>
                Loading orderbook...
                {showOnlyMine && (
                  <span className="text-sm text-blue-600 mt-1 block">
                    Filtering by your orders
                  </span>
                )}
              </span>
            </article>
          </section>
        );
      }

      // Show error state
      if (error) {
        return (
          <section className="p-4 h-full flex items-center justify-center">
            <span className="text-red-500">
              Error loading orderbook: {error}
            </span>
          </section>
        );
      }

      // Show no data state only when we're not loading and have no data
      if (!orderbook || (asks.length === 0 && bids.length === 0)) {
        return (
          <section className="p-4 h-full flex items-center justify-center">
            <article className="text-center">
              <span className="text-gray-500">
                <span className="text-lg mb-2">📊</span>
                {showOnlyMine
                  ? "No orders found for your wallet"
                  : "No orderbook data available"}
                <span className="text-sm mt-1">
                  {showOnlyMine
                    ? "You may not have any active orders in this market"
                    : "This market may not have active orders yet"}
                </span>
              </span>
            </article>
          </section>
        );
      }

      // Additional validation to ensure we have proper data
      if (!Array.isArray(asks) || !Array.isArray(bids)) {
        return (
          <span className="text-red-500">Invalid orderbook data format</span>
        );
      }

      // Return the actual orderbook content
      return (
        <>
          {/* Header */}
          <header className="grid grid-cols-3 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 gap-x-2 sm:gap-x-4 font-medium">
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
                isAsk={true}
              />
            ))}
          </section>

          {/* Spread */}
          <article className="flex items-center justify-center py-2 sm:py-3 my-2 sm:my-3 bg-gray-50 rounded text-xs sm:text-sm">
            <span className="text-gray-600 mr-1 sm:mr-2">Spread:</span>
            <span className="text-gray-700 font-mono text-xs sm:text-sm">
              {formatDecimalConsistent(spread)}
            </span>
            <span className="text-gray-600 ml-1 sm:ml-2 text-xs sm:text-sm">
              ({formatDecimalConsistent(spreadPercentage)}%)
            </span>
          </article>

          {/* Bids (Buy orders) - Green */}
          <section className="space-y-1">
            {bids.map((bid, i: number) => (
              <OrderbookRow
                key={`bid-${i}-${bid.orderId}`}
                entry={bid}
                isAsk={false}
              />
            ))}
          </section>
        </>
      );
    })();

    // Always return the component - no early returns to violate Rules of Hooks
    return (
      <main className="h-full bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
        {headerComponent}
        <section className="p-2 sm:p-3 lg:p-4 flex-1 overflow-auto">
          {orderbookContent}
        </section>
      </main>
    );
  },
);

VerticalOrderBook.displayName = "VerticalOrderBook";

export default VerticalOrderBook;
