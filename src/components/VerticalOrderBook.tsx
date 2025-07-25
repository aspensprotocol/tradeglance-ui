
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TradingPair } from "@/hooks/useTradingPairs";

interface Order {
  price: number;
  amount: number;
  total: number;
}

interface VerticalOrderBookProps {
  tradingPair?: any;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
}

const VerticalOrderBook = ({ tradingPair, selectedPair, onPairChange, tradingPairs }: VerticalOrderBookProps) => {
  // Mock data based on the screenshot
  const [asks] = useState<Order[]>([
    { price: 109.172, amount: 73348, total: 3080740 },
    { price: 109.171, amount: 5011, total: 3007392 },
    { price: 109.170, amount: 106112, total: 3002381 },
    { price: 109.169, amount: 111168, total: 2896269 },
    { price: 109.168, amount: 12, total: 2785101 },
    { price: 109.167, amount: 28770, total: 2785089 },
    { price: 109.166, amount: 539096, total: 2756319 },
    { price: 109.165, amount: 1297654, total: 2217223 },
    { price: 109.164, amount: 558633, total: 919569 },
    { price: 109.161, amount: 360936, total: 360936 },
  ]);

  const [bids] = useState<Order[]>([
    { price: 109.160, amount: 142577, total: 142577 },
    { price: 109.159, amount: 12, total: 142589 },
    { price: 109.158, amount: 12, total: 142601 },
    { price: 109.157, amount: 12, total: 142613 },
    { price: 109.156, amount: 6561, total: 149175 },
    { price: 109.155, amount: 50651, total: 199826 },
    { price: 109.154, amount: 59442, total: 259268 },
    { price: 109.153, amount: 50, total: 259318 },
    { price: 109.152, amount: 4053, total: 263371 },
    { price: 109.151, amount: 12, total: 263383 },
  ]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const spreadValue = asks[0]?.price - bids[0]?.price || 0;
  const spreadPercentage = ((spreadValue / asks[0]?.price) * 100) || 0;

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
          {asks.reverse().map((ask, i) => (
            <div key={i} className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer">
              <span className="text-red-500 font-mono">{ask.price.toFixed(3)}</span>
              <span className="text-right text-gray-700">{formatNumber(ask.amount)}</span>
              <span className="text-right text-gray-700">{formatNumber(ask.total)}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-center py-2 my-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-600 mr-2">Spread:</span>
          <span className="text-gray-700 font-mono">{spreadValue.toFixed(3)}</span>
          <span className="text-gray-600 ml-2">({spreadPercentage.toFixed(3)}%)</span>
        </div>

        {/* Bids (Buy orders) - Green */}
        <div className="space-y-1">
          {bids.map((bid, i) => (
            <div key={i} className="grid grid-cols-3 text-xs gap-x-4 py-0.5 hover:bg-gray-50 cursor-pointer">
              <span className="text-green-500 font-mono">{bid.price.toFixed(3)}</span>
              <span className="text-right text-gray-700">{formatNumber(bid.amount)}</span>
              <span className="text-right text-gray-700">{formatNumber(bid.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerticalOrderBook;
