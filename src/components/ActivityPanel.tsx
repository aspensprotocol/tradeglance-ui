import { useState } from "react";
import { cn } from "@/lib/utils";
import DepositWithdrawModal from "./DepositWithdrawModal";
import { useTradingBalance } from "@/hooks/useTokenBalance";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTokenBalance } from "@/hooks/useTokenBalance";

interface Trade {
  id: number;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  time: string;
}

interface ActivityPanelProps {
  tradingPair?: any;
}

const mockTrades: Trade[] = Array(5).fill(null).map((_, i) => ({
  id: i,
  type: Math.random() > 0.5 ? "buy" : "sell",
  price: 50000 - Math.random() * 1000,
  amount: Math.random() * 2,
  total: Math.random() * 100000,
  time: new Date(Date.now() - i * 60000).toLocaleTimeString()
}));

const ActivityPanel = ({ tradingPair }: ActivityPanelProps) => {
  const { currentChainId } = useChainMonitor();
  const [activeTab, setActiveTab] = useState<"trades" | "orders" | "balances" | "deposits">("trades");
  const [trades] = useState<Trade[]>(mockTrades);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");

  // Get trading balances for the current trading pair
  const { depositedBalance, lockedBalance, loading: balanceLoading } = useTradingBalance(
    tradingPair?.baseSymbol || "ATOM", 
    currentChainId || 0
  );

  // Get wallet token balance (balanceOf)
  const { balance: walletBalance, loading: walletLoading } = useTokenBalance(
    tradingPair?.baseSymbol || "ATOM",
    currentChainId || 0
  );

  const handleDepositClick = () => {
    setModalType("deposit");
    setModalOpen(true);
  };

  const handleWithdrawClick = () => {
    setModalType("withdraw");
    setModalOpen(true);
  };

  const BalanceRow = ({ label, base, quote }: { label: string; base: string | number; quote: number }) => (
    <div className="py-2 border-b last:border-0">
      <div className="space-y-1">
        <span className="text-sm text-neutral">{label}</span>
        <p className="font-medium">
          {typeof base === 'string' ? parseFloat(base) || 0 : base} {tradingPair?.baseSymbol || "ATOM"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 h-full flex flex-col">
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

        <div className="animate-fade-in flex-1 overflow-auto">
          {activeTab === "trades" ? (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-4 text-xs text-gray-500 py-2 border-b">
                <span>Type</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Time</span>
              </div>
              
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
            <div className="space-y-4">
              {/* Locked Balance */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-2">In Order Book</div>
                <div className="text-sm font-medium text-gray-900">
                  {balanceLoading ? (
                    <span className="text-blue-500">Loading...</span>
                  ) : (
                    <span className="text-orange-600">
                      {lockedBalance} {tradingPair?.baseSymbol || "ATOM"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Funds in active orders
                </div>
              </div>

              {/* Open Orders List */}
              <div className="text-center py-8 text-neutral">
                No open orders
              </div>
            </div>
          ) : activeTab === "deposits" ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-4 px-12">
                <button 
                  onClick={handleDepositClick}
                  className="w-32 bg-neutral-soft hover:bg-neutral-soft/80 text-neutral-dark font-medium py-2 rounded-lg transition-colors"
                >
                  Deposit
                </button>
                <button 
                  onClick={handleWithdrawClick}
                  className="w-32 bg-neutral-soft hover:bg-neutral-soft/80 text-neutral-dark font-medium py-2 rounded-lg transition-colors"
                >
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
                base={walletLoading ? "Loading..." : (walletBalance || "0")}
                quote={1} // Placeholder - would need actual quote price
              />
              <BalanceRow 
                label="Deposited Balance"
                base={balanceLoading ? "Loading..." : (depositedBalance || "0")}
                quote={1} // Placeholder - would need actual quote price
              />
              <BalanceRow 
                label="In Order Book"
                base={balanceLoading ? "Loading..." : (lockedBalance || "0")}
                quote={1} // Placeholder - would need actual quote price
              />
            </div>
          )}
        </div>
      </div>
      
      <DepositWithdrawModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </div>
  );
};

export default ActivityPanel;
