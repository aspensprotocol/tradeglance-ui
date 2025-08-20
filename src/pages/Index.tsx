import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { OrderbookProvider } from "@/contexts/OrderbookContext";

const Index = (): JSX.Element => {
  console.log("🔍 Index component: Component function called");

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
    console.log("🔄 Index: useEffect for selectedPair triggered:", {
      tradingPairsCount: tradingPairs.length,
      selectedPair,
      firstPairId: tradingPairs[0]?.id,
      firstPairDisplay: tradingPairs[0]?.displayName,
    });

    if (tradingPairs.length > 0 && !selectedPair) {
      const firstPairId = tradingPairs[0].id;
      console.log(
        "✅ Index: Setting selectedPair to first available pair:",
        firstPairId,
      );
      setSelectedPair(firstPairId);
    }
  }, [tradingPairs, selectedPair]);

  // Get the current trading pair object
  const currentTradingPair = getTradingPairById(selectedPair);

  // Debug logging
  console.log("🔍 Index page render:", {
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
    hasTradingPair: !!currentTradingPair,
    tradingPairKeys: currentTradingPair ? Object.keys(currentTradingPair) : [],
  });

  // Log when components will be rendered
  console.log("🔍 Index: Component rendering decision:", {
    pairsLoading,
    willShowLoading: pairsLoading,
    willShowComponents: !pairsLoading,
    componentsToRender: !pairsLoading
      ? {
          activityPanel: !!currentTradingPair,
          orderbook: !!currentTradingPair,
          tradeForm: !!currentTradingPair,
        }
      : null,
  });

  // Add a fallback display for debugging
  if (!pairsLoading && tradingPairs.length === 0) {
    return (
      <Layout footerPosition="fixed">
        <main className="flex items-center justify-center h-full">
          <article className="text-center p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Debug: No Trading Pairs
            </h2>
            <p className="text-gray-600 mb-4">
              The useTradingPairs hook returned no trading pairs.
            </p>
            <section className="bg-gray-100 p-4 rounded text-left text-sm space-y-2">
              <p>
                <strong>Config Loading:</strong> {pairsLoading ? "Yes" : "No"}
              </p>
              <p>
                <strong>Trading Pairs Count:</strong> {tradingPairs.length}
              </p>
              <p>
                <strong>Selected Pair:</strong> {selectedPair || "None"}
              </p>
              <p>
                <strong>Current Trading Pair:</strong>{" "}
                {currentTradingPair ? "Yes" : "No"}
              </p>
              <p>
                <strong>Window Location:</strong> {window.location.href}
              </p>
              <p>
                <strong>Environment:</strong> {import.meta.env.MODE}
              </p>
              <p>
                <strong>gRPC URL:</strong>{" "}
                {import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api"}
              </p>
            </section>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </article>
        </main>
      </Layout>
    );
  }

  return (
    <Layout footerPosition="fixed">
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 h-full">
        {pairsLoading ? (
          <section className="col-span-1 sm:col-span-2 lg:grid-cols-4">
            <LoadingSpinner message="Loading trading pairs..." />
          </section>
        ) : (
          <>
            <OrderbookProvider
              marketId={currentTradingPair?.id || ""}
              filterByTrader={undefined}
            >
              <section className="col-span-1 sm:col-span-2 lg:col-span-2">
                <ActivityPanel
                  key={currentTradingPair?.id || "no-market"}
                  tradingPair={currentTradingPair || undefined}
                />
              </section>
              <section className="col-span-1 lg:col-span-1">
                <VerticalOrderBook
                  key={`orderbook-${currentTradingPair?.id || "no-market"}`}
                  tradingPair={currentTradingPair || undefined}
                  selectedPair={selectedPair}
                  onPairChange={setSelectedPair}
                  tradingPairs={tradingPairs}
                />
              </section>
            </OrderbookProvider>
            <section className="col-span-1 lg:col-span-1">
              <TradeForm
                key={`tradeform-${currentTradingPair?.id || "no-market"}`}
                selectedPair={selectedPair}
                tradingPair={currentTradingPair || undefined}
              />
            </section>
          </>
        )}
      </main>
    </Layout>
  );
};

export default Index;
