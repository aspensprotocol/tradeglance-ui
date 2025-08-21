import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { OrderbookProvider } from "@/contexts/OrderbookContext";

const Index = (): JSX.Element => {
  // Get dynamic trading pairs from config
  const {
    tradingPairs,
    loading: pairsLoading,
    getTradingPairById,
  } = useTradingPairs();

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

  return (
    <Layout footerPosition="absolute">
      {/* Mobile-first responsive grid layout */}
      <main
        className="
        grid gap-3 h-full
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-4 
        xl:gap-4
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
          <OrderbookProvider marketId={currentTradingPair.id}>
            {/* Activity Panel - Full width on mobile, bottom on tablet, top on desktop */}
            <section
              className="
              col-span-1 
              sm:col-span-2 
              lg:col-span-2 
              order-1
              sm:order-3
              lg:order-1
            "
            >
              <ActivityPanel
                key={currentTradingPair?.id || "no-market"}
                tradingPair={currentTradingPair || undefined}
              />
            </section>

            {/* Trade Form - Full width on mobile, first column on tablet, last column on desktop */}
            <section
              className="
              col-span-1 
              sm:col-span-1 
              lg:col-span-1 
              order-2 sm:order-1 lg:order-3
            "
            >
              <TradeForm
                key={`tradeform-${currentTradingPair?.id || "no-market"}`}
                selectedPair={selectedPair}
                tradingPair={currentTradingPair || undefined}
              />
            </section>

            {/* Orderbook - Full width on mobile, second column on tablet, third column on desktop */}
            <aside
              className="
              col-span-1 
              sm:col-span-1 
              lg:col-span-1 
              order-3 sm:order-2 lg:order-2
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
          </OrderbookProvider>
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
    </Layout>
  );
};

export default Index;
