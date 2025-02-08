
import OrderBook from "@/components/OrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-neutral-soft/30">
      <div className="container py-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Left side - OrderBook (75%) */}
          <div className="col-span-3 space-y-6">
            <OrderBook />
          </div>

          {/* Right side - Trade Form (25%) */}
          <div className="space-y-6">
            <TradeForm />
          </div>

          {/* Activity Panel (Full width) */}
          <div className="col-span-4">
            <ActivityPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
