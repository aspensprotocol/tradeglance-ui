
import OrderBook from "@/components/OrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const tradingPairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT"];

const Index = () => {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);

  return (
    <div className="min-h-screen bg-neutral-soft/30">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="px-3 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm"
          >
            {tradingPairs.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white"
            >
              Wallet 1
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#7E69AB] text-[#7E69AB] hover:bg-[#7E69AB] hover:text-white"
            >
              Wallet 2
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {/* Left side - OrderBook (75%) */}
          <div className="col-span-3 space-y-6">
            <OrderBook />
          </div>

          {/* Right side - Trade Form (25%) */}
          <div className="space-y-6">
            <TradeForm selectedPair={selectedPair} />
          </div>

          {/* Activity Panel (Full width) */}
          <div className="col-span-4">
            <ActivityPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
