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

interface Balance {
  walletBalance: number;
  availableMargin: number;
  lockedBalance: number;
}

const mockTrades: Trade[] = Array(5).fill(null).map((_, i) => ({
  id: i,
  type: Math.random() > 0.5 ? "buy" : "sell",
  price: 50000 - Math.random() * 1000,
  amount: Math.random() * 2,
  total: Math.random() * 100000,
  time: new Date(Date.now() - i * 60000).toLocaleTimeString()
}));

const mockBalances = {
  base: {
    walletBalance: 1.2345,
    availableMargin: 0.9876,
    lockedBalance: 0.2469
  },
  quote: {
    walletBalance: 50000,
    availableMargin: 42000,
    lockedBalance: 8000
  }
};

const ActivityPanel = () => {
  const [activeTab, setActiveTab] = useState<"trades" | "orders" | "balances" | "deposits">("trades");
  const [trades] = useState<Trade[]>(mockTrades);

  const BalanceRow = ({ label, base, quote }: { label: string; base: number; quote: number }) => (
    <div className="grid grid-cols-2 gap-4 py-2 border-b last:border-0">
      <div className="space-y-1">
        <span className="text-sm text-neutral">{label} (BTC)</span>
        <p className="font-medium">{base.toFixed(8)}</p>
      </div>
      <div className="space-y-1">
        <span className="text-sm text-neutral">{label} (USD)</span>
        <p className="font-medium">{quote.toLocaleString()}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4">
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
          <button
            onClick={() => setActiveTab("balances")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors relative",
              activeTab === "balances"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark"
            )}
          >
            Balances
            {activeTab === "balances" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("deposits")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors relative",
              activeTab === "deposits"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark"
            )}
          >
            Deposits & Withdrawals
            {activeTab === "deposits" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
        </div>

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
          ) : activeTab === "orders" ? (
            <div className="text-center py-8 text-neutral">
              No open orders
            </div>
          ) : activeTab === "deposits" ? (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button className="flex-1 bg-neutral-soft hover:bg-neutral-soft/80 text-neutral-dark font-medium py-2 rounded-lg transition-colors">
                  Deposit
                </button>
                <button className="flex-1 bg-neutral-soft hover:bg-neutral-soft/80 text-neutral-dark font-medium py-2 rounded-lg transition-colors">
                  Withdraw
                </button>
              </div>
              <div className="text-center py-8 text-neutral">
                No recent transactions
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <BalanceRow 
                label="Wallet Balance"
                base={mockBalances.base.walletBalance}
                quote={mockBalances.quote.walletBalance}
              />
              <BalanceRow 
                label="Available Margin"
                base={mockBalances.base.availableMargin}
                quote={mockBalances.quote.availableMargin}
              />
              <BalanceRow 
                label="Locked Balance"
                base={mockBalances.base.lockedBalance}
                quote={mockBalances.quote.lockedBalance}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
