import { useRecentTrades } from "@/hooks/useRecentTrades";
import { TradingPair } from "@/hooks/useTradingPairs";

interface RecentTradesProps {
  tradingPair?: any;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: TradingPair[];
}

const RecentTrades = ({ tradingPair, selectedPair, onPairChange, tradingPairs }: RecentTradesProps) => {
  // Get the market ID from the selected trading pair
  const selectedTradingPair = tradingPairs.find(pair => pair.id === selectedPair);
  const marketId = selectedTradingPair?.marketId;
  
  // Use the recent trades hook to fetch real data
  const { trades, loading, error } = useRecentTrades(marketId);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
        </div>
        <div className="p-4 h-full flex items-center justify-center">
          <div className="text-gray-500">Loading recent trades...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
        </div>
        <div className="p-4 h-full flex items-center justify-center">
          <div className="text-red-500">Error loading recent trades: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
      </div>
      
      <div className="p-4 h-full overflow-auto">
        {/* Header */}
        <div className="grid grid-cols-4 text-xs text-gray-500 mb-2 gap-x-4">
          <span className="text-left">Price</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Side</span>
          <span className="text-right">Time</span>
        </div>

        {/* Trades */}
        <div className="space-y-1">
          {trades.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No recent trades
            </div>
          ) : (
            trades.map((trade, i) => (
              <div key={trade.id || i} className="grid grid-cols-4 text-xs gap-x-4 py-1 hover:bg-gray-50">
                <span className={`font-mono ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(trade.price).toFixed(3)}
                </span>
                <span className="text-right text-gray-700">
                  {formatNumber(parseFloat(trade.quantity))}
                </span>
                <span className={`text-right font-medium ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.side.toUpperCase()}
                </span>
                <span className="text-right text-gray-500">
                  {formatTime(trade.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentTrades; 