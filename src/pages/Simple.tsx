import { useEffect } from "react";
import SimpleForm from "@/components/SimpleForm";
import type { TradingPair } from "@/hooks/useTradingPairs";

interface SimpleProps {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  currentTradingPair?: TradingPair;
  tradingPairs: TradingPair[];
  pairsLoading: boolean;
}

const Simple = ({ 
  selectedPair,
  setSelectedPair,
  currentTradingPair, 
  tradingPairs,
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
      <main className="flex items-center justify-center h-full min-h-0 overflow-hidden">
        {pairsLoading ? (
          <section className="text-center">
            <p>Loading trading pairs...</p>
          </section>
        ) : defaultPair ? (
          <SimpleForm 
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            tradingPair={defaultPair}
            tradingPairs={tradingPairs}
          />
        ) : (
          <section className="text-center">
            <p>No trading pairs available</p>
          </section>
        )}
      </main>
    </>
  );
};

export default Simple;
