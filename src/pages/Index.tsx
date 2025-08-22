import { useEffect, useState } from "react";
import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { TradingPair } from "@/hooks/useTradingPairs";
import { BaseOrQuote } from "@/protos/gen/arborter_config_pb";

interface IndexProps {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  currentTradingPair?: TradingPair;
  tradingPairs: TradingPair[];
  pairsLoading: boolean;
}

const Index = ({ 
  selectedPair, 
  setSelectedPair, 
  currentTradingPair, 
  tradingPairs, 
  pairsLoading 
}: IndexProps): JSX.Element => {

  // Manage trading side state at the Index level to share between TradeForm and ActivityPanel
  const [currentTradingSide, setCurrentTradingSide] = useState<BaseOrQuote.BASE | BaseOrQuote.QUOTE>(BaseOrQuote.BASE);

  // Debug logging
  console.log("Index page render:", {
    tradingPairs: tradingPairs.map((p) => ({
      id: p.id,
      marketId: p.id,
      displayName: p.displayName,
      marketIdType: typeof p.id,
      marketIdTruthy: !!p.id,
    })),
    selectedPair,
    currentTradingPair,
    currentTradingPairMarketId: currentTradingPair?.id,
    currentTradingPairMarketIdType: typeof currentTradingPair?.id,
    pairsLoading,
  });

  // Debug: Track component mounting/unmounting
  useEffect(() => {
    console.log("🚀 Index component MOUNTED");
    return () => {
      console.log("💀 Index component UNMOUNTED");
    };
  }, []);

  return (
    <>
      {/* Mobile-first responsive grid layout */}
      <main
        className="
        grid gap-3 h-full
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-4 
        lg:gap-4
        xl:gap-4
        min-h-0
        overflow-hidden
      "
      >
        {pairsLoading ? (
          <section
            className="
            col-span-1 
            sm:col-span-2 
            lg:col-span-4
          "
          >
            <LoadingSpinner message="Loading trading pairs..." />
          </section>
        ) : currentTradingPair?.id ? (
          <>
            {/* Activity Panel - Full width on mobile, bottom on tablet, top on desktop */}
            <section
              className="
              col-span-1 
              sm:col-span-2 
              lg:col-span-2 
              order-1
              sm:order-3
              lg:order-1
              h-full
              min-h-0
            "
            >
              <ActivityPanel
                key={currentTradingPair?.id || "no-market"}
                tradingPair={currentTradingPair || undefined}
                currentTradingSide={currentTradingSide}
              />
            </section>

            {/* Trade Form - Full width on mobile, first column on tablet, last column on desktop */}
            <section
              className="
              col-span-1 
              sm:col-span-1 
              lg:col-span-1 
              order-2 sm:order-1 lg:order-3
              h-full
              min-h-0
            "
            >
              <TradeForm
                key={`tradeform-${currentTradingPair?.id || "no-market"}`}
                tradingPair={currentTradingPair || undefined}
                onTradingSideChange={setCurrentTradingSide}
              />
            </section>

            {/* Orderbook - Full width on mobile, second column on tablet, third column on desktop */}
            <aside
              className="
              col-span-1 
              sm:col-span-1 
              lg:col-span-1 
              order-3 sm:order-2 lg:order-2
              h-full
              min-h-0
            "
            >
              <VerticalOrderBook
                key={`orderbook-${currentTradingPair?.id || "no-market"}`}
                tradingPair={currentTradingPair || undefined}
                selectedPair={selectedPair}
                onPairChange={setSelectedPair}
                tradingPairs={tradingPairs}
              />
            </aside>
          </>
        ) : (
          <section
            className="
            col-span-1 
            sm:col-span-2 
            lg:col-span-4
          "
          >
            <LoadingSpinner message="No trading pairs available..." />
          </section>
        )}
      </main>
    </>
  );
};

export default Index;
