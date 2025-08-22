import React, { useEffect } from "react";
import SimpleForm from "@/components/SimpleForm";
import type { TradingPair } from "@/hooks/useTradingPairs";

interface SimpleProps {
  currentTradingPair?: TradingPair;
  pairsLoading: boolean;
}

const Simple = ({ 
  currentTradingPair, 
  pairsLoading 
}: SimpleProps): JSX.Element => {
  // Use the current trading pair from props
  const defaultPair = currentTradingPair;

  // Debug: Track component mounting/unmounting
  useEffect(() => {
    console.log("🚀 Simple component MOUNTED");
    return () => {
      console.log("💀 Simple component UNMOUNTED");
    };
  }, []);

  return (
    <>
      <main className="flex items-center justify-center h-full px-3 sm:px-4 lg:px-6 pb-0">
        {pairsLoading ? (
          <div className="text-center">
            <p>Loading trading pairs...</p>
          </div>
        ) : defaultPair ? (
          <SimpleForm tradingPair={defaultPair} />
        ) : (
          <div className="text-center">
            <p>No trading pairs available</p>
          </div>
        )}
      </main>
    </>
  );
};

export default Simple;
