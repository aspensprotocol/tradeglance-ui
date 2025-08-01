import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import SimpleForm from "@/components/SimpleForm";

const Simple = () => {
  // Get dynamic trading pairs from config
  const { tradingPairs, loading: pairsLoading, getTradingPairById } = useTradingPairs();
  
  // Monitor chain changes
  const { currentChainId } = useChainMonitor();

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

  return (
    <Layout footerPosition="fixed">
      <div className="flex items-center justify-center h-full">
        {pairsLoading || !currentChainId ? (
          <LoadingSpinner 
            message={pairsLoading ? "Loading trading pairs..." : "Detecting network..."} 
          />
        ) : (
          <SimpleForm selectedPair={selectedPair} tradingPair={currentTradingPair} />
        )}
      </div>
    </Layout>
  );
};

export default Simple;
