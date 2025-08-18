import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTradingPairs } from "@/hooks/useTradingPairs";

const Index = () => {
  // Get dynamic trading pairs from config
  const { tradingPairs, loading: pairsLoading, getTradingPairById } = useTradingPairs();

  // Set default selected pair to first available pair, or empty string if none available
  const [selectedPair, setSelectedPair] = useState<string>("");
  
  // Update selected pair when trading pairs load
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0].id);
    }
  }, [tradingPairs, selectedPair]);
  
  // Get the current trading pair object
  const currentTradingPair = getTradingPairById(selectedPair);

  // Debug logging
  console.log('Index page render:', {
    tradingPairs: tradingPairs.map(p => ({ 
      id: p.id, 
      marketId: p.marketId, 
      displayName: p.displayName,
      marketIdType: typeof p.marketId,
      marketIdTruthy: !!p.marketId
    })),
    selectedPair,
    currentTradingPair,
    currentTradingPairMarketId: currentTradingPair?.marketId,
    currentTradingPairMarketIdType: typeof currentTradingPair?.marketId,
    pairsLoading
  });

  return (
    <Layout footerPosition="fixed">
      <div className="grid grid-cols-4 gap-4 h-full">
        {pairsLoading ? (
          <div className="col-span-4">
            <LoadingSpinner message="Loading trading pairs..." />
          </div>
        ) : (
          <>
            <div className="col-span-2">
              <ActivityPanel 
                key={currentTradingPair?.marketId || 'no-market'} 
                tradingPair={currentTradingPair} 
              />
            </div>
            <div className="col-span-1">
              <VerticalOrderBook 
                key={`orderbook-${currentTradingPair?.marketId || 'no-market'}`}
                tradingPair={currentTradingPair} 
                selectedPair={selectedPair} 
                onPairChange={setSelectedPair} 
                tradingPairs={tradingPairs} 
              />
            </div>
            <div className="col-span-1">
              <TradeForm 
                key={`tradeform-${currentTradingPair?.marketId || 'no-market'}`}
                selectedPair={selectedPair} 
                tradingPair={currentTradingPair} 
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Index;
