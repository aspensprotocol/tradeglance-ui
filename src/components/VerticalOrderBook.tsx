import React from "react";
import type { TradingPair } from "@/lib/shared-types";
import { formatDecimalConsistent } from "../lib/number-utils";
import { useMarketOrderbook } from "../hooks/useMarketOrderbook";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";
import type { VerticalOrderBookProps } from "../lib/shared-types";
import { PERFORMANCE_CONFIG } from "../lib/optimization-config";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins } from "lucide-react";

// Virtualized orderbook row component for better performance
const OrderbookRow = React.memo(
  ({
    entry,
    isAsk,
    cumulativeVolume,
    maxVolume,
  }: {
    entry: OrderbookEntry;
    isAsk: boolean;
    cumulativeVolume: number;
    maxVolume: number;
  }) => {
    // Calculate the width percentage for the volume bar
    const volumePercentage =
      maxVolume > 0 ? (cumulativeVolume / maxVolume) * 100 : 0;

    return (
      <article className="grid grid-cols-3 text-xs gap-x-2 sm:gap-x-4 py-0.5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 cursor-pointer transition-all duration-200 rounded px-2 relative group">
        {/* Volume bar background */}
        <section
          className={`absolute inset-0 rounded-lg transition-all duration-300 ${
            isAsk
              ? "bg-gradient-to-r from-red-500/5 to-red-400/5 shadow-sm shadow-red-400/5"
              : "bg-gradient-to-r from-emerald-500/5 to-emerald-400/5 shadow-sm shadow-emerald-400/5"
          }`}
          style={{
            width: `${volumePercentage}%`,
            right: isAsk ? "auto" : "0",
            left: isAsk ? "0" : "auto",
          }}
        />

        {/* Volume bar border for better definition */}
        <section
          className={`absolute inset-0 rounded-lg border-r-2 transition-all duration-300 ${
            isAsk ? "border-red-400/30" : "border-emerald-400/30"
          }`}
          style={{
            width: `${volumePercentage}%`,
            right: isAsk ? "auto" : "0",
            left: isAsk ? "0" : "auto",
          }}
        />

        {/* Subtle hover effect overlay */}
        <section className="absolute inset-0 bg-gradient-to-r from-purple-400/2 to-pink-400/2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></section>

        <span
          className={`font-mono text-xs font-semibold relative z-10 whitespace-nowrap ${isAsk ? "text-red-500" : "text-emerald-500"}`}
        >
          {formatDecimalConsistent(entry.price)}
          <span className="opacity-60 ml-1">({volumePercentage.toFixed(1)}%)</span>
        </span>
        <span className="text-right text-neutral-800 text-xs font-medium relative z-10">
          {formatDecimalConsistent(entry.quantity)}
        </span>
        <span className="text-right text-neutral-800 text-xs font-medium relative z-10">
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
    maxOrders,
  }: VerticalOrderBookProps): JSX.Element => {
    // No filtering - show all orders
    const filterByTrader = undefined;

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

    // Function to limit orders based on price priority
    const limitOrdersByPrice = (
      orders: OrderbookEntry[],
      isAsk: boolean,
      maxEntries: number = maxOrders ||
        PERFORMANCE_CONFIG.orderbook.maxEntriesToRender,
    ): OrderbookEntry[] => {
      if (!orders || orders.length === 0) return [];

      // Sort orders by price
      // For asks: lowest price first (best ask) - we want to show the cheapest sell orders
      // For bids: highest price first (best bid) - we want to show the most expensive buy orders
      const sortedOrders = [...orders].sort((a, b) => {
        const priceA = parseFloat(a.price || "0");
        const priceB = parseFloat(b.price || "0");
        return isAsk ? priceA - priceB : priceB - priceA;
      });

      // Take only the top N orders (best prices)
      // This ensures we only show the most competitive orders and prevents
      // the orderbook from becoming cluttered with orders that are unlikely to execute
      return sortedOrders.slice(0, maxEntries);
    };

    // Limit orders to configured maximum
    const limitedAsks = limitOrdersByPrice(asks, true);
    const limitedBids = limitOrdersByPrice(bids, false);

    // Calculate cumulative volumes for volume bars
    const calculateCumulativeVolumes = (
      orders: OrderbookEntry[],
      isAsk: boolean,
    ) => {
      const volumes: number[] = [];
      let cumulative = 0;

      // For asks, we go from lowest to highest price (ascending)
      // For bids, we go from highest to lowest price (descending)
      const sortedOrders = isAsk
        ? [...orders].sort((a, b) => Number(a.price) - Number(b.price))
        : [...orders].sort((a, b) => Number(b.price) - Number(a.price));

      sortedOrders.forEach((order) => {
        const volume = Number(order.price) * Number(order.quantity);
        cumulative += volume;
        volumes.push(cumulative);
      });

      return volumes;
    };

    const askVolumes = calculateCumulativeVolumes(limitedAsks, true);
    const bidVolumes = calculateCumulativeVolumes(limitedBids, false);

    // Find the maximum volume for scaling
    const maxVolume = Math.max(
      ...askVolumes,
      ...bidVolumes,
      1, // Prevent division by zero
    );

    // Create header component
    const headerComponent = (
      <header className="p-4 border-b border-purple-200 header-purple relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <section className="overlay-purple"></section>

        <nav className="flex items-center justify-between relative z-10">
          <Select value={selectedPair} onValueChange={onPairChange}>
            <SelectTrigger className="w-48 px-4 py-3 rounded-xl border-2 border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-gradient-to-r from-white via-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 transform  group">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-purple-500 group-hover:text-purple-600 transition-colors duration-300" />
                <SelectValue placeholder="Select trading pair" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-gradient-to-br from-white via-purple-50 to-pink-50 border-2 border-purple-200 shadow-2xl rounded-xl">
              {tradingPairs.map((pair: TradingPair) => (
                <SelectItem
                  key={pair.id}
                  value={pair.id}
                  className="hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 cursor-pointer transition-all duration-200"
                >
                  {pair.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <nav className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              className="p-2.5 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md  transform"
              title="Refresh orderbook"
            >
              <svg
                className="w-5 h-5"
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
          <section className="p-6 h-full flex items-center justify-center">
            <article className="text-center">
              <span className="text-gray-600">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></span>
                <p className="text-sm font-medium">Loading orderbook...</p>
              </span>
            </article>
          </section>
        );
      }

      // Show error state
      if (error) {
        return (
          <section className="p-6 h-full flex items-center justify-center">
            <span className="text-red-500 font-medium">
              Error loading orderbook: {error}
            </span>
          </section>
        );
      }

      // Show no data state only when we're not loading and have no data
      if (
        !orderbook ||
        (limitedAsks.length === 0 && limitedBids.length === 0)
      ) {
        return (
          <section className="p-6 h-full flex items-center justify-center">
            <article className="text-center">
              <span className="text-gray-500">
                <span className="text-2xl mb-3 block">📊</span>
                <p className="font-medium mb-2">No orderbook data available</p>
                <span className="text-sm text-gray-400">
                  This market may not have active orders yet
                </span>
              </span>
            </article>
          </section>
        );
      }

      // Additional validation to ensure we have proper data
      if (!Array.isArray(asks) || !Array.isArray(bids)) {
        return (
          <span className="text-red-500 font-medium">
            Invalid orderbook data format
          </span>
        );
      }

      // Return the actual orderbook content
      return (
        <>
          {/* Header */}
          <header className="grid grid-cols-3 text-xs text-neutral-700 mb-3 sm:mb-4 gap-x-2 sm:gap-x-4 font-semibold px-3 py-2 bg-gradient-to-r from-gray-50 via-purple-50 to-pink-50 rounded-lg relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <section className="absolute inset-0 bg-gradient-to-r from-purple-400/2 to-pink-400/2 pointer-events-none"></section>

            <span className="text-left relative z-10">Price</span>
            <span className="text-right relative z-10">
              Amount ({tradingPair?.baseSymbol || "TOKEN"})
            </span>
            <span className="text-right relative z-10">
              Total ({tradingPair?.quoteSymbol || "TOKEN"})
            </span>
          </header>

          {/* Order count indicator */}
          {(asks.length > limitedAsks.length ||
            bids.length > limitedBids.length) && (
            <article className="text-center py-2 mb-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-blue-200 text-xs text-blue-700">
              <span className="font-medium">
                Showing top{" "}
                {maxOrders || PERFORMANCE_CONFIG.orderbook.maxEntriesToRender}{" "}
                orders by price
              </span>
              <span className="text-blue-600">
                ({limitedAsks.length + limitedBids.length} of{" "}
                {asks.length + bids.length} total)
              </span>
              {limitedAsks.length > 0 && limitedBids.length > 0 && (
                <div className="mt-1 text-blue-600 text-xs">
                  Price range:{" "}
                  {formatDecimalConsistent(limitedAsks[0]?.price || 0)} -{" "}
                  {formatDecimalConsistent(limitedBids[0]?.price || 0)}
                </div>
              )}
            </article>
          )}

          {/* Asks (Sell orders) - Red */}
          <section className="space-y-1 mb-4">
            {limitedAsks.map((ask, i: number) => (
              <OrderbookRow
                key={`ask-${i}-${ask.orderId}`}
                entry={ask}
                isAsk={true}
                cumulativeVolume={askVolumes[i] || 0}
                maxVolume={maxVolume}
              />
            ))}
          </section>

          {/* Spread */}
          <article className="flex items-center justify-center py-3 sm:py-4 my-3 sm:my-4 bg-gradient-to-r from-gray-100 via-purple-100 to-pink-100 rounded-xl text-xs sm:text-sm border border-purple-200 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <section className="absolute inset-0 bg-gradient-to-r from-purple-400/2 to-pink-400/2 pointer-events-none"></section>

            <span className="text-neutral-700 mr-2 font-medium relative z-10">
              Spread:
            </span>
            <span className="text-neutral-900 font-mono text-xs font-semibold relative z-10">
              {formatDecimalConsistent(spread)}
            </span>
            <span className="text-neutral-700 ml-2 text-xs font-medium relative z-10">
              ({formatDecimalConsistent(spreadPercentage)}%)
            </span>
          </article>

          {/* Bids (Buy orders) - Green */}
          <section className="space-y-1">
            {limitedBids.map((bid, i: number) => (
              <OrderbookRow
                key={`bid-${i}-${bid.orderId}`}
                entry={bid}
                isAsk={false}
                cumulativeVolume={bidVolumes[i] || 0}
                maxVolume={maxVolume}
              />
            ))}
          </section>
        </>
      );
    })();

    // Always return the component - no early returns to violate Rules of Hooks
    return (
      <main className="h-full bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-100 overflow-hidden flex flex-col relative">
        {headerComponent}
        <section className="p-3 sm:p-4 lg:p-5 flex-1 overflow-auto relative z-10">
          {orderbookContent}
        </section>
      </main>
    );
  },
);

VerticalOrderBook.displayName = "VerticalOrderBook";

export default VerticalOrderBook;
