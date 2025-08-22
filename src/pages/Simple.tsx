import { useEffect } from "react";
import SimpleForm from "@/components/SimpleForm";
import type { TradingPair } from "@/lib/shared-types";
import { useToast } from "@/hooks/use-toast";

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
  const { toast, errorToast } = useToast();

  // Use the current trading pair from props
  const defaultPair = currentTradingPair;

  // Component lifecycle tracking
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  const testToasts = () => {
    // Test regular toast with long text
    toast({
      title: "Test Toast",
      description:
        "This is a very long toast message that should wrap to multiple lines instead of being cut off. It should also be selectable so you can copy the text. Try selecting this text to see if it works!",
    });

    // Test error toast with long text
    setTimeout(() => {
      errorToast(
        "This is a very long error message that should also wrap properly and be selectable. Error messages often contain important information that users need to copy, so this functionality is crucial for debugging and support purposes.",
      );
    }, 1000);
  };

  return (
    <>
      <main className="flex items-center justify-center h-full min-h-0 overflow-hidden">
        {pairsLoading ? (
          <section className="text-center">
            <p>Loading trading pairs...</p>
          </section>
        ) : defaultPair ? (
          <section className="flex flex-col items-center gap-4">
            <button
              onClick={testToasts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
            >
              Test Toast Improvements
            </button>
            <SimpleForm
              selectedPair={selectedPair}
              setSelectedPair={setSelectedPair}
              tradingPair={defaultPair}
              tradingPairs={tradingPairs}
            />
          </section>
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
