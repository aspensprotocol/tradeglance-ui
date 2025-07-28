import { useState } from "react";
import { cn } from "@/lib/utils";
import DepositWithdrawModal from "./DepositWithdrawModal";
import { useTradingBalance } from "@/hooks/useTokenBalance";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTradingPairs } from "@/hooks/useTradingPairs";

interface SimpleTransaction {
  id: number;
  type: "simple" | "deposit" | "withdraw";
  fromNetwork: string;
  toNetwork: string;
  fromToken: string;
  toToken: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  time: string;
}

interface SimpleActivityPanelProps {
  tradingPair?: any;
}

const mockSimpleTransactions: SimpleTransaction[] = Array(3).fill(null).map((_, i) => ({
  id: i,
  type: "simple",
  fromNetwork: "ethereum",
  toNetwork: "polygon",
  fromToken: "ETH",
  toToken: "USDT",
  amount: Math.random() * 10,
  status: Math.random() > 0.3 ? "completed" : "pending",
  time: new Date(Date.now() - i * 3600000).toLocaleTimeString()
}));

const SimpleActivityPanel = ({ tradingPair }: SimpleActivityPanelProps) => {
  const { currentChainId } = useChainMonitor();
  const [activeTab, setActiveTab] = useState<"simples" | "balances" | "deposits">("simples");
  const [transactions] = useState<SimpleTransaction[]>(mockSimpleTransactions);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");
  const { tradingPairs } = useTradingPairs();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "pending":
        return "⏳";
      case "failed":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 h-full flex flex-col">
        <div className="flex space-x-4 border-b mb-4">
          <button
                            onClick={() => setActiveTab("simples")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors relative",
                              activeTab === "simples"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark"
            )}
          >
            Simple History
            {activeTab === "simples" && (
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
          {activeTab === "simples" ? (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-5 text-xs text-gray-500 py-2 border-b">
                <span>Type</span>
                <span>From</span>
                <span>To</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Status</span>
              </div>
              
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-5 text-sm py-2 border-b last:border-0"
                >
                  <span className="text-blue-600 font-medium">
                    {tx.type.toUpperCase()}
                  </span>
                  <span className="text-gray-700">
                    {tx.fromToken} ({tx.fromNetwork})
                  </span>
                  <span className="text-gray-700">
                    {tx.toToken} ({tx.toNetwork})
                  </span>
                  <span className="text-right">{tx.amount.toFixed(4)}</span>
                  <span className={cn("text-right", getStatusColor(tx.status))}>
                    {getStatusIcon(tx.status)} {tx.status}
                  </span>
                </div>
              ))}
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

export default SimpleActivityPanel; 