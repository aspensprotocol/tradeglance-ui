
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Trade {
  id: number;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  time: string;
}

const mockTrades: Trade[] = Array(5).fill(null).map((_, i) => ({
  id: i,
  type: Math.random() > 0.5 ? "buy" : "sell",
  price: 50000 - Math.random() * 1000,
  amount: Math.random() * 2,
  total: Math.random() * 100000,
  time: new Date(Date.now() - i * 60000).toLocaleTimeString()
}));

const ActivityPanel = () => {
  const [activeTab, setActiveTab] = useState<"trades" | "orders">("trades");
  const [trades] = useState<Trade[]>(mockTrades);

  return (
    <div className="bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Activity</h2>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          <button
            onClick={() => setActiveTab("trades")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors relative",
              activeTab === "trades"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark"
            )}
          >
            Recent Trades
            {activeTab === "trades" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors relative",
              activeTab === "orders"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark"
            )}
          >
            Open Orders
            {activeTab === "orders" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === "trades" ? (
            <div className="space-y-2">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid grid-cols-4 text-sm py-2 border-b last:border-0"
                >
                  <span className={cn(
                    trade.type === "buy" ? "text-bid-dark" : "text-ask-dark"
                  )}>
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="text-right">{trade.price.toLocaleString()}</span>
                  <span className="text-right">{trade.amount.toFixed(4)}</span>
                  <span className="text-right text-neutral">{trade.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral">
              No open orders
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
