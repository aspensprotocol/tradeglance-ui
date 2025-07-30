import { useState } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import DepositWithdrawModal from "./DepositWithdrawModal";
import { useBalanceManager } from "@/hooks/useBalanceManager";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useRecentTrades, RecentTrade } from "@/hooks/useRecentTrades";
import { useOpenOrders, OpenOrder } from "@/hooks/useOpenOrders";
import { formatDecimal } from "../lib/number-utils";

interface ActivityPanelProps {
  tradingPair?: any;
}

const ActivityPanel = ({ tradingPair }: ActivityPanelProps) => {
  const [activeTab, setActiveTab] = useState<"trades" | "orders" | "balances">("trades");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");
  const [showMineOnly, setShowMineOnly] = useState(false);

  // Get wallet address
  const { address } = useAccount();

  // Get the market ID from the trading pair
  const marketId = tradingPair?.marketId;
  
  // Use real recent trades data with optional filtering
  const { trades, loading: tradesLoading, initialLoading: tradesInitialLoading, error: tradesError } = useRecentTrades(marketId, showMineOnly ? address : undefined);

  // Use real open orders data with optional filtering
  const { orders, loading: ordersLoading, initialLoading: ordersInitialLoading, error: ordersError } = useOpenOrders(marketId, showMineOnly ? address : undefined);

  // Get trading balances for the current trading pair
  const { 
    availableBalance: depositedBalance, 
    lockedBalance, 
    balanceLoading 
  } = useBalanceManager(tradingPair);

  // Get wallet token balance (balanceOf)
  const { balance: walletBalance, loading: walletLoading } = useTokenBalance(
    tradingPair?.baseSymbol || "ATOM",
    tradingPair?.baseChainId || 0
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

  const formatTime = (timestamp: Date) => {
    // Force CET timezone for display
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true, // Use 12-hour format with AM/PM
      timeZone: 'Europe/Berlin' // Force CET timezone
    });
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 h-full flex flex-col min-w-0">
        <div className="flex border-b mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("trades")}
            className={cn(
              "flex-1 pb-2 text-xs font-medium transition-colors relative whitespace-nowrap",
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
              "flex-1 pb-2 text-xs font-medium transition-colors relative whitespace-nowrap",
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
              "flex-1 pb-2 text-xs font-medium transition-colors relative whitespace-nowrap",
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
        </div>

        <div className="animate-fade-in flex-1 overflow-auto min-w-0">
          {activeTab === "trades" ? (
            <div className="space-y-2 min-w-0">
              {/* Filter toggle */}
              <div className="flex justify-end mb-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setShowMineOnly(false)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      !showMineOnly
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowMineOnly(true)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      showMineOnly
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Mine
                  </button>
                </div>
              </div>
              
              {/* Header row */}
              <div className="grid grid-cols-5 text-xs text-gray-500 py-2 border-b gap-2">
                <span className="text-right truncate">Price</span>
                <span className="text-right truncate">Amount</span>
                <span className="text-right truncate">Maker</span>
                <span className="text-right truncate">Taker</span>
                <span className="text-right truncate">Time</span>
              </div>
              
              {tradesInitialLoading ? (
                <div className="text-center py-8 text-neutral">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading recent trades...
                </div>
              ) : tradesError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading recent trades: {tradesError}
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8 text-neutral">
                  No recent trades
                </div>
              ) : (
                <div className="space-y-1">
                  {trades.map((trade) => (
                    <div
                      key={trade.id}
                      className="grid grid-cols-5 text-sm py-2 border-b last:border-0 gap-2 min-w-0"
                    >
                      <span className="text-right truncate font-mono">
                        {formatDecimal(trade.price)}
                      </span>
                      <span className="text-right truncate font-mono">
                        {formatDecimal(trade.quantity)}
                      </span>
                      <span className="text-right text-neutral truncate text-xs">
                        {trade.makerBaseAddress ? `${trade.makerBaseAddress.slice(0, 6)}...${trade.makerBaseAddress.slice(-4)}` : 'N/A'}
                      </span>
                      <span className="text-right text-neutral truncate text-xs">
                        {trade.seller ? `${trade.seller.slice(0, 6)}...${trade.seller.slice(-4)}` : 'N/A'}
                      </span>
                      <span className="text-right text-neutral truncate text-xs">
                        {formatTime(trade.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "orders" ? (
            <div className="space-y-2 min-w-0">
              {/* Filter toggle */}
              <div className="flex justify-end mb-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setShowMineOnly(false)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      !showMineOnly
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowMineOnly(true)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      showMineOnly
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Mine
                  </button>
                </div>
              </div>
              
              {/* Header row */}
              <div className="grid grid-cols-4 text-xs text-gray-500 py-2 border-b gap-2">
                <span className="truncate">Type</span>
                <span className="text-right truncate">Price</span>
                <span className="text-right truncate">Amount</span>
                <span className="text-right truncate">Time</span>
              </div>
              
              {ordersInitialLoading ? (
                <div className="text-center py-8 text-neutral">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading open orders...
                </div>
              ) : ordersError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading open orders: {ordersError}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-neutral">
                  No open orders
                </div>
              ) : (
                <div className="space-y-1">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-4 text-sm py-2 border-b last:border-0 gap-2 min-w-0"
                    >
                      <span className={cn(
                        order.side === "buy" ? "text-bid-dark" : "text-ask-dark",
                        "truncate font-medium"
                      )}>
                        {order.side.toUpperCase()}
                      </span>
                      <span className="text-right truncate font-mono">
                        {formatDecimal(order.price)}
                      </span>
                      <span className="text-right truncate font-mono">
                        {formatDecimal(order.quantity)}
                      </span>
                      <span className="text-right text-neutral truncate text-xs">
                        {formatTime(order.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
