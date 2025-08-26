import { useEffect } from "react";
import SimpleForm from "@/components/SimpleForm";
import type { TradingPair } from "@/lib/shared-types";

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
  pairsLoading,
}: SimpleProps): JSX.Element => {
  // Use the current trading pair from props
  const defaultPair = currentTradingPair;

  // Component lifecycle tracking
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  return (
    <>
      <main className="flex items-center justify-center h-full min-h-0 overflow-hidden p-3 relative">
        {/* Floating decorative elements matching Pro view aesthetic */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="floating-blue top-1/4 left-1/4 w-24 h-24 delay-300"></section>
          <section className="floating-emerald bottom-1/4 right-1/4 w-32 h-32 delay-700"></section>
          <section className="floating-purple top-1/2 right-1/3 w-16 h-16 delay-1000"></section>
        </section>

        {pairsLoading ? (
          <section className="text-center relative z-10">
            <section className="card-base p-8 max-w-md relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <section className="overlay-blue"></section>

              <section className="loading-spinner loading-spinner-blue h-12 w-12 mx-auto mb-4 relative z-10"></section>
              <p className="text-lg font-semibold text-gray-700 mb-2 relative z-10">
                Loading trading pairs...
              </p>
              <p className="text-sm text-gray-500 relative z-10">
                Please wait while we fetch the latest market data
              </p>
            </section>
          </section>
        ) : defaultPair ? (
          <section className="flex flex-col items-center gap-6 w-full max-w-2xl relative z-10">
            <section className="w-full card-gradient-emerald p-6 relative overflow-hidden">
              {/* Subtle gradient overlay matching Pro view */}
              <section className="overlay-emerald"></section>

              <SimpleForm
                selectedPair={selectedPair}
                setSelectedPair={setSelectedPair}
                tradingPair={defaultPair}
                tradingPairs={tradingPairs}
              />
            </section>
          </section>
        ) : (
          <section className="text-center relative z-10">
            <section className="card-base p-8 max-w-md relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <section className="overlay-blue"></section>

              <section className="text-gray-400 mb-4 relative z-10">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 relative z-10">
                No trading pairs available
              </h3>
              <p className="text-sm text-gray-600 relative z-10">
                Please check back later or contact support
              </p>
            </section>
          </section>
        )}
      </main>
    </>
  );
};

export default Simple;
