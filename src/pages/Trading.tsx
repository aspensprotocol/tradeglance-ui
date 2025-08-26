import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useViewContext } from "@/hooks/useViewContext";
import { Layout } from "@/components/Layout";
import Pro from "@/pages/Index";
import Simple from "@/pages/Simple";
import { useTradingPairs } from "@/hooks/useTradingPairs";

const Trading = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const { viewMode, setViewMode } = useViewContext();
  const { tradingPairs } = useTradingPairs();

  // Set default selected pair to first available pair, or empty string if none available
  const [selectedPair, setSelectedPair] = useState<string>("");

  // Update selected pair when trading pairs load
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0].id);
    }
  }, [tradingPairs, selectedPair]);

  // Get the current trading pair object
  const currentTradingPair = tradingPairs.find(
    (pair) => pair.id === selectedPair,
  );

  // Determine view mode from URL params or context
  const currentViewMode = searchParams.get("view") || viewMode;

  // Update context if URL param is different
  useEffect(() => {
    if (currentViewMode !== viewMode) {
      setViewMode(currentViewMode as "pro" | "simple");
    }
  }, [currentViewMode, viewMode, setViewMode]);

  return (
    <Layout>
      <main className="flex-1 overflow-hidden relative">
        {/* Floating decorative elements for extra eye candy */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse delay-300"></section>
          <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse delay-700"></section>
          <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg blur-lg animate-pulse delay-1000"></section>
        </section>

        {currentViewMode === "pro" ? (
          <Pro
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            currentTradingPair={currentTradingPair}
            tradingPairs={tradingPairs}
            pairsLoading={false}
          />
        ) : (
          <Simple
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            currentTradingPair={currentTradingPair}
            tradingPairs={tradingPairs}
            pairsLoading={false}
          />
        )}
      </main>
    </Layout>
  );
};

export default Trading;
