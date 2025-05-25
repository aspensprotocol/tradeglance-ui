import OrderBook from "@/components/OrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tradingPairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT"];

const Index = () => {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);

  return (
    <div className="min-h-screen bg-neutral-soft/30 relative pb-12">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/portfolio" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Portfolio
            </Link>
            <Link to="/trade" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Trade
            </Link>
            <Link to="/bridge" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Bridge
            </Link>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white bg-[#f8fcf4]"
            >
              Wallet 1
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#7E69AB] text-[#7E69AB] hover:bg-[#7E69AB] hover:text-white bg-[#fff5f6]"
            >
              Wallet 2
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3 space-y-6">
            <OrderBook selectedPair={selectedPair} onPairChange={setSelectedPair} tradingPairs={tradingPairs} />
          </div>
          <div className="space-y-6">
            <TradeForm selectedPair={selectedPair} />
          </div>
          <div className="col-span-4">
            <ActivityPanel />
          </div>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 text-xs">
        <div className="container mx-auto flex justify-between items-center">
          <div className="ml-2 flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-[#0FA0CE] text-white hover:bg-[#1EAEDB] border-none text-xs px-3 py-1 h-auto"
            >
              online
            </Button>
            <span className="text-gray-400 text-xs">version 1.0.0</span>
          </div>
          <div className="flex gap-6 text-[#8E9196]">
            <a href="#" className="hover:text-[#1EAEDB]">Terms</a>
            <a href="#" className="hover:text-[#1EAEDB]">Privacy</a>
            <a href="#" className="hover:text-[#1EAEDB]">Support</a>
            <a href="#" className="hover:text-[#1EAEDB]">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
