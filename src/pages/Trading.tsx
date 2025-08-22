import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useViewContext } from "@/hooks/useViewContext";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import Index from "./Index";
import Simple from "./Simple";

const Trading = (): JSX.Element => {
  const { viewMode, setViewMode } = useViewContext();
  const [searchParams] = useSearchParams();
  
  // Get trading pairs at the Trading component level to persist across view switches
  const { tradingPairs, loading: pairsLoading } = useTradingPairs();
  
  // Set default selected pair to first available pair, or empty string if none available
  const [selectedPair, setSelectedPair] = useState<string>("");

  // Handle URL query parameters for view mode
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "pro" || viewParam === "simple") {
      setViewMode(viewParam);
    }
  }, [searchParams, setViewMode]);

  // Update selected pair when trading pairs load
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0].id);
    }
  }, [tradingPairs, selectedPair]);

  // Get the current trading pair object
  const currentTradingPair = tradingPairs.find(pair => pair.id === selectedPair);

  // Debug logging to track view switches and state persistence
  console.log("🔍 Trading component render:", {
    viewMode,
    selectedPair,
    currentTradingPairId: currentTradingPair?.id,
    tradingPairsCount: tradingPairs.length,
    pairsLoading,
    timestamp: new Date().toISOString(),
  });

  return (
    <Layout footerPosition="absolute">
      <main className="flex-1">
        <section className={viewMode === "pro" ? "block" : "hidden"}>
          <Index 
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            currentTradingPair={currentTradingPair}
            tradingPairs={tradingPairs}
            pairsLoading={pairsLoading}
          />
        </section>
        <section className={viewMode === "simple" ? "block" : "hidden"}>
          <Simple 
            currentTradingPair={currentTradingPair}
            pairsLoading={pairsLoading}
          />
        </section>
      </main>
    </Layout>
  );
};

export default Trading;
