
import { useState } from "react";
import { TradingPair } from "@/hooks/useTradingPairs";
import { useOrderbook, OrderbookOrder } from "@/hooks/useOrderbook";
import { formatDecimal, formatLargeNumber } from "../lib/number-utils";

interface VerticalOrderBookProps {
  tradingPair?: any;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
}

const VerticalOrderBook = ({ tradingPair, selectedPair, onPairChange, tradingPairs }: VerticalOrderBookProps) => {
  // Get the market ID from the selected trading pair
  const selectedTradingPair = tradingPairs.find(pair => pair.id === selectedPair);
  const marketId = selectedTradingPair?.marketId;
  
  // Use the orderbook hook to fetch real data
  const { orderbook, loading, initialLoading, error } = useOrderbook(marketId);

  // Use real orderbook data
  const asks = orderbook?.asks || [];
  const bids = orderbook?.bids || [];
  const spreadValue = orderbook?.spread || 0;
  const spreadPercentage = orderbook?.spreadPercentage || 0;

  const formatNumber = (num: number) => formatLargeNumber(num);
  const formatPrice = (price: string) => formatDecimal(price);

  // Show loading state only on initial load
  if (initialLoading) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <select
            value={selectedPair}
            onChange={(e) => onPairChange(e.target.value)}
            className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
          >
            <option value="">Select a trading pair</option>
            {tradingPairs.map((pair) => (
              <option key={pair.id} value={pair.id}>
                {pair.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="p-4 h-full flex items-center justify-center">
          <div className="text-gray-500">Loading orderbook...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <select
            value={selectedPair}
            onChange={(e) => onPairChange(e.target.value)}
            className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
          >
            <option value="">Select a trading pair</option>
            {tradingPairs.map((pair) => (
              <option key={pair.id} value={pair.id}>
                {pair.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="p-4 h-full flex items-center justify-center">
          <div className="text-red-500">Error loading orderbook: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <select
          value={selectedPair}
          onChange={(e) => onPairChange(e.target.value)}
          className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
        >
          <option value="">Select a trading pair</option>
          {tradingPairs.map((pair) => (
            <option key={pair.id} value={pair.id}>
              {pair.displayName}
            </option>
          ))}
        </select>
      </div>
      
      <div className="p-4 h-full overflow-auto">
        {/* Header */}
        <div className="grid grid-cols-3 text-xs text-gray-500 mb-2 gap-x-4">
          <span className="text-left">Price</span>
          <span className="text-right">Amount (USD)</span>
          <span className="text-right">Total (USD)</span>
        </div>

        {/* Asks (Sell orders) - Red */}
        <div className="space-y-1">
          {asks.slice().reverse().map((ask, i) => (
            <div key={i} className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer">
              <span className="text-red-500 font-mono">{formatPrice(ask.price)}</span>
              <span className="text-right text-gray-700">{formatNumber(parseFloat(ask.quantity))}</span>
              <span className="text-right text-gray-700">{formatNumber(parseFloat(ask.total))}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-center py-2 my-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-600 mr-2">Spread:</span>
          <span className="text-gray-700 font-mono">{formatPrice(spreadValue.toString())}</span>
          <span className="text-gray-600 ml-2">({spreadPercentage.toFixed(3)}%)</span>
        </div>

        {/* Bids (Buy orders) - Green */}
        <div className="space-y-1">
          {bids.map((bid, i) => (
            <div key={i} className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer">
              <span className="text-green-500 font-mono">{formatPrice(bid.price)}</span>
              <span className="text-right text-gray-700">{formatNumber(parseFloat(bid.quantity))}</span>
              <span className="text-right text-gray-700">{formatNumber(parseFloat(bid.total))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerticalOrderBook;
