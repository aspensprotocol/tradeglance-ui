import { useEffect, useState } from "react";
import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { TradingPair } from "@/lib/shared-types";
import { BaseOrQuote } from "@/protos/gen/arborter_config_pb";

interface IndexProps {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  currentTradingPair?: TradingPair;
  tradingPairs: TradingPair[];
  pairsLoading: boolean;
}

const Index = ({
  selectedPair,
  setSelectedPair,
  currentTradingPair,
  tradingPairs,
  pairsLoading,
}: IndexProps): JSX.Element => {
  // Manage trading side state at the Index level to share between TradeForm and ActivityPanel
  const [currentTradingSide, setCurrentTradingSide] = useState<
    BaseOrQuote.BASE | BaseOrQuote.QUOTE
  >(BaseOrQuote.BASE);

  // Debug logging
  // Debug: Track component mounting/unmounting
  useEffect(() => {
    // Debug: Track component mounting/unmounting
  }, []);

  return (
    <>
      {/* Mobile-first responsive grid layout */}
      <main
        className="
        grid gap-4 h-full p-4
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-4 
        lg:gap-6
        xl:gap-8
        min-h-0
        overflow-hidden
        relative
      "
      >
        {/* Floating decorative elements inspired by modern DeFi platforms */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="floating-blue top-1/4 left-1/4 w-16 h-16 delay-300"></section>
          <section className="floating-emerald bottom-1/4 right-1/4 w-20 h-20 delay-700"></section>
          <section className="floating-purple top-1/2 right-1/3 w-12 h-12 delay-1000"></section>
        </section>

        {pairsLoading ? (
          <section
            className="
            col-span-1 
            sm:col-span-2 
            lg:col-span-4
            flex items-center justify-center
            relative z-10
          "
          >
            <LoadingSpinner message="Loading trading pairs..." />
          </section>
        ) : currentTradingPair?.id ? (
          <>
            {/* Activity Panel - Full width on mobile, bottom on tablet, top on desktop */}
            <section
              className="
              col-span-1 
              sm:col-span-2 
              lg:col-span-2 
              order-1
              sm:order-3
              lg:order-1
              h-full
              min-h-0
              transform transition-all duration-300 hover:scale-[1.02] relative z-10
            "
            >
              <section className="h-full card-gradient-blue card-hover relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <section className="overlay-blue"></section>
                <ActivityPanel
                  key={currentTradingPair?.id || "no-market"}
                  tradingPair={currentTradingPair || undefined}
                  currentTradingSide={currentTradingSide}
                />
              </section>
            </section>

            {/* Trade Form - Full width on mobile, first column on tablet, last column on desktop */}
            <section
              className="
              col-span-1 
              sm:col-span-1 
              lg:col-span-1 
              order-2 sm:order-1 lg:order-3
              h-full
              min-h-0
              transform transition-all duration-300 hover:scale-[1.02] relative z-10
            "
            >
              <section className="h-full bg-gradient-to-br from-white via-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <section className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 pointer-events-none"></section>
                <TradeForm
                  key={`tradeform-${currentTradingPair?.id || "no-market"}`}
                  tradingPair={currentTradingPair || undefined}
                  onTradingSideChange={setCurrentTradingSide}
                />
              </section>
            </section>

            {/* Orderbook - Full width on mobile, second column on tablet, third column on desktop */}
            <aside
              className="
              col-span-1 
              sm:col-span-1 
              lg:col-span-1 
              order-3 sm:order-2 lg:order-2
              h-full
              min-h-0
              transform transition-all duration-300 hover:scale-[1.02] relative z-10
            "
            >
              <section className="h-full bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <section className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-pink-400/5 pointer-events-none"></section>
                <VerticalOrderBook
                  key={`orderbook-${currentTradingPair?.id || "no-market"}`}
                  tradingPair={currentTradingPair || undefined}
                  selectedPair={selectedPair}
                  onPairChange={setSelectedPair}
                  tradingPairs={tradingPairs}
                />
              </section>
            </aside>
          </>
        ) : (
          <section
            className="
            col-span-1 
            sm:col-span-2 
            lg:col-span-4
            flex items-center justify-center
            relative z-10
          "
          >
            <LoadingSpinner message="No trading pairs available..." />
          </section>
        )}
      </main>
    </>
  );
};

export default Index;
