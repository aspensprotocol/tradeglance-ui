import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useViewContext } from "@/hooks/useViewContext";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import Index from "./Index";
import Simple from "./Simple";

const Trading = (): JSX.Element => {
  const { viewMode } = useViewContext();
  
  // Get trading pairs at the Trading component level to persist across view switches
  const { tradingPairs, loading: pairsLoading } = useTradingPairs();
  
  // Set default selected pair to first available pair, or empty string if none available
  const [selectedPair, setSelectedPair] = useState<string>("");

  // Keep track of which components have been mounted
  const proMountedRef = useRef(false);
  const simpleMountedRef = useRef(false);

  // Update selected pair when trading pairs load
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0].id);
    }
  }, [tradingPairs, selectedPair]);

  // Mark components as mounted when they first render
  useEffect(() => {
    if (viewMode === "pro") {
      proMountedRef.current = true;
    } else if (viewMode === "simple") {
      simpleMountedRef.current = true;
    }
  }, [viewMode]);

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
      {/* Render components based on what has been mounted - prevents remounting */}
      <main className="flex-1">
        {proMountedRef.current && (
          <div className={viewMode === "pro" ? "block" : "hidden"}>
            <Index 
              selectedPair={selectedPair}
              setSelectedPair={setSelectedPair}
              currentTradingPair={currentTradingPair}
              tradingPairs={tradingPairs}
              pairsLoading={pairsLoading}
            />
          </div>
        )}
        {simpleMountedRef.current && (
          <div className={viewMode === "simple" ? "block" : "hidden"}>
            <Simple 
              currentTradingPair={currentTradingPair}
              pairsLoading={pairsLoading}
            />
          </div>
        )}
      </main>
    </Layout>
  );
};

export default Trading;
