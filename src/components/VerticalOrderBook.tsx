import React, { useMemo } from "react";
import type { TradingPair } from "@/hooks/useTradingPairs";
import { formatDecimalConsistent } from "../lib/number-utils";
import { useMarketOrderbook } from "../hooks/useMarketOrderbook";
import type { OrderbookEntry } from "../protos/gen/arborter_pb";

interface VerticalOrderBookProps {
  tradingPair?: TradingPair;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
}

// Virtualized orderbook row component for better performance
const OrderbookRow = React.memo(
  ({
    entry,
    index,
    isAsk,
    tradingPair,
  }: {
    entry: OrderbookEntry;
    index: number;
    isAsk: boolean;
    baseSymbol: string;
    quoteSymbol: string;
    tradingPair?: TradingPair;
  }) => {
    // Debug logging for first few entries
    React.useEffect(() => {
      if (index < 3 && tradingPair) {
        console.log(`🔍 OrderbookRow[${index}]:`, {
          price: entry.price,
          quantity: entry.quantity,
          side: entry.side,
          priceType: typeof entry.price,
          quantityType: typeof entry.quantity,
          priceLength:
            typeof entry.price === "string" ? entry.price.length : "N/A",
          quantityLength:
            typeof entry.quantity === "string" ? entry.quantity.length : "N/A",
          priceValue: entry.price,
          quantityValue: entry.quantity,
          orderId: entry.orderId,
          isAsk,
        });
      }
    }, [entry, tradingPair, index, isAsk]);

    return (
      <article className="grid grid-cols-3 text-xs sm:text-sm gap-x-2 sm:gap-x-4 py-1 sm:py-0.5 hover:bg-gray-50 cursor-pointer">
        <span
          className={`font-mono text-xs sm:text-sm ${isAsk ? "text-red-500" : "text-green-500"}`}
        >
          {entry.price}
        </span>
        <span className="text-right text-gray-700 text-xs sm:text-sm">
          {entry.quantity}
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
    // Use market-specific orderbook hook
    const { orderbook, initialLoading, error, refresh } = useMarketOrderbook(
      tradingPair?.id || "",
      undefined
    );

    // Debug logging for trading pair configuration
    React.useEffect(() => {
      if (tradingPair) {
        const pairDecimalsType = typeof tradingPair.pairDecimals;
        console.log("🔍 VerticalOrderBook: Trading pair config:", {
          id: tradingPair.id,
          displayName: tradingPair.displayName,
          baseSymbol: tradingPair.baseSymbol,
          quoteSymbol: tradingPair.quoteSymbol,
          baseChainTokenDecimals: tradingPair.baseChainTokenDecimals,
          quoteChainTokenDecimals: tradingPair.quoteChainTokenDecimals,
          pairDecimals: tradingPair.pairDecimals,
          pairDecimalsType,
          pairDecimalsValue: tradingPair.pairDecimals,
        });
      }
    }, [tradingPair]);

    // Memoize the orderbook data to prevent unnecessary re-renders
    const { asks, bids, spreadValue, spreadPercentage } = useMemo(() => {
      // DEBUGGING: Log the orderbook data being processed
      console.log("🔍 VerticalOrderBook: Processing orderbook data:", {
        hasOrderbook: !!orderbook,
        orderbookKeys: orderbook ? Object.keys(orderbook) : [],
        asksCount: orderbook?.asks?.length || 0,
        bidsCount: orderbook?.bids?.length || 0,
        sampleAsk: orderbook?.asks?.[0]
          ? {
              price: orderbook.asks[0].price,
              quantity: orderbook.asks[0].quantity,
              priceType: typeof orderbook.asks[0].price,
              quantityType: typeof orderbook.asks[0].quantity,
              priceLength:
                typeof orderbook.asks[0].price === "string"
                  ? orderbook.asks[0].price.length
                  : "N/A",
              quantityLength:
                typeof orderbook.asks[0].quantity === "string"
                  ? orderbook.asks[0].quantity.length
                  : "N/A",
            }
          : null,
        sampleBid: orderbook?.bids?.[0]
          ? {
              price: orderbook.bids[0].price,
              quantity: orderbook.bids[0].quantity,
              priceType: typeof orderbook.bids[0].price,
              quantityType: typeof orderbook.bids[0].quantity,
              priceLength:
                typeof orderbook.bids[0].price === "string"
                  ? orderbook.bids[0].price.length
                  : "N/A",
              quantityLength:
                typeof orderbook.bids[0].quantity === "string"
                  ? orderbook.bids[0].quantity.length
                  : "N/A",
            }
          : null,
      });

      return {
        asks: orderbook?.asks || [],
        bids: orderbook?.bids || [],
        spreadValue: orderbook?.spread || 0,
        spreadPercentage: orderbook?.spreadPercentage || 0,
      };
    }, [orderbook]);

    // Memoize the trading pair options to prevent recreation
    const tradingPairOptions = useMemo(
      () =>
        tradingPairs.map((pair: TradingPair) => (
          <option key={pair.id} value={pair.id}>
            {pair.displayName}
          </option>
        )),
      [tradingPairs],
    );

    // Memoize the header component to prevent recreation
    const headerComponent = useMemo(
      () => (
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
      ),
      [selectedPair, onPairChange, tradingPairOptions, refresh],
    );

    // Memoize the orderbook content to prevent unnecessary re-renders
    const orderbookContent = useMemo(() => {
      // Show loading state until we have actual data
      if (initialLoading) {
        return (
          <section className="p-4 h-full flex items-center justify-center">
            <article className="text-center">
              <span className="text-gray-500">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></span>
                Loading orderbook...
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
                  No orderbook data available
                  <span className="text-sm mt-1">
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
                index={i}
                isAsk={true}
                baseSymbol={tradingPair?.baseSymbol || "TOKEN"}
                quoteSymbol={tradingPair?.quoteSymbol || "TOKEN"}
                tradingPair={tradingPair}
              />
            ))}
          </section>

          {/* Spread */}
          <article className="flex items-center justify-center py-2 sm:py-3 my-2 sm:my-3 bg-gray-50 rounded text-xs sm:text-sm">
            <span className="text-gray-600 mr-1 sm:mr-2">Spread:</span>
            <span className="text-gray-700 font-mono text-xs sm:text-sm">
              {spreadValue.toString()}
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
                index={i}
                isAsk={false}
                baseSymbol={tradingPair?.baseSymbol || "TOKEN"}
                quoteSymbol={tradingPair?.quoteSymbol || "TOKEN"}
                tradingPair={tradingPair}
              />
            ))}
          </section>
        </>
      );
    }, [
      initialLoading,
      error,
      orderbook,
      asks,
      bids,
      spreadValue,
      spreadPercentage,
      tradingPair,
    ]);

    // Always return the component - no early returns to violate Rules of Hooks
    return (
      <main className="h-full bg-white rounded-lg shadow-sm border">
        {headerComponent}
        <section className="p-2 sm:p-3 lg:p-4 h-full overflow-auto">
          {orderbookContent}
        </section>
      </main>
    );
  },
);

VerticalOrderBook.displayName = "VerticalOrderBook";

export default VerticalOrderBook;
