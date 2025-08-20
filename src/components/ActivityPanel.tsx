import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import DepositWithdrawModal from "./DepositWithdrawModal";
import { useBalanceManager } from "@/hooks/useBalanceManager";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useRecentTrades } from "@/hooks/useRecentTrades";
import { formatDecimal } from "../lib/number-utils";
import { useOrderbookContext } from "../contexts/OrderbookContext";

import { useAllBalances } from "@/hooks/useAllBalances";
import { triggerBalanceRefresh } from "../lib/utils";
import { TradingPair } from "@/hooks/useTradingPairs";
import { Side } from "@/protos/gen/arborter_pb";

interface ActivityPanelProps {
  tradingPair?: TradingPair;
}

const ActivityPanel = ({ tradingPair }: ActivityPanelProps) => {
  const [activeTab, setActiveTab] = useState<"trades" | "orders" | "balances">(
    "trades",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");
  const [showMineOnly, setShowMineOnly] = useState(false);

  // Get wallet address
  const { address } = useAccount();

  // Get all balances across all tokens and chains
  const {
    balances,
    loading: balancesLoading,
    error: balancesError,
    hasAnyBalances,
    refreshBalances,
  } = useAllBalances();

  // Get the market ID from the trading pair
  const marketId = tradingPair?.id;

  // Use shared orderbook context for open orders
  const {
    openOrders,
    loading: ordersLoading,
    error: ordersError,
  } = useOrderbookContext();

  // Only call hooks when their corresponding tab is active to prevent data accumulation
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useRecentTrades(
    activeTab === "trades" && marketId ? marketId : "", // Only fetch when trades tab is active and marketId exists
    showMineOnly ? address : undefined,
  );

  // Filter open orders by trader if needed
  const orders =
    showMineOnly && address
      ? openOrders.filter((order) => order.makerBaseAddress === address)
      : openOrders;

  // Debug logging
  console.log("ActivityPanel render:", {
    tradingPair,
    marketId,
    marketIdType: typeof marketId,
    marketIdTruthy: !!marketId,
    activeTab,
    tradesCount: trades?.length || 0,
    ordersCount: orders?.length || 0,
    tradesLoading,
    ordersLoading,
  });

  // Log when data changes to help debug accumulation
  useEffect(() => {
    console.log("ActivityPanel data updated:", {
      activeTab,
      tradesCount: trades?.length || 0,
      ordersCount: orders?.length || 0,
      tradesLoading,
      ordersLoading,
      marketId,
      timestamp: new Date().toISOString(),
    });
  }, [activeTab, trades, orders, tradesLoading, ordersLoading, marketId]);

  // Log when activeTab changes to track tab switching
  useEffect(() => {
    console.log("ActivityPanel tab changed:", {
      newTab: activeTab,
      marketId,
      timestamp: new Date().toISOString(),
    });
  }, [activeTab, marketId]);

  // Get trading balances for the current trading pair
  useBalanceManager(tradingPair);

  // Get wallet token balance (balanceOf)
  useTokenBalance(
    tradingPair?.baseSymbol || "ATOM",
    tradingPair?.baseChainId || 0,
  );

  const handleDepositClick = () => {
    setModalType("deposit");
    setModalOpen(true);
  };

  const handleWithdrawClick = () => {
    setModalType("withdraw");
    setModalOpen(true);
  };

  const handleTabChange = (newTab: "trades" | "orders" | "balances") => {
    if (newTab !== activeTab) {
      console.log("ActivityPanel: Switching tabs, clearing data", {
        from: activeTab,
        to: newTab,
        marketId,
        timestamp: new Date().toISOString(),
      });

      // Force clear any accumulated data by changing the key
      // This will force React to re-mount the components
      setActiveTab(newTab);
      // Reset the filter when switching tabs to ensure consistent behavior
      setShowMineOnly(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    // Force CET timezone for display
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
      timeZone: "Europe/Berlin", // Force CET timezone
    });
  };

  const formatTradeTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
      timeZone: "Europe/Berlin", // Force CET timezone
    });
  };

  return (
    <main className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <section className="p-4 h-full flex flex-col min-w-0">
        <nav className="flex border-b mb-4 overflow-x-auto">
          <button
            onClick={() => handleTabChange("trades")}
            className={cn(
              "flex-1 pb-2 text-xs font-medium transition-colors relative whitespace-nowrap",
              activeTab === "trades"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark",
            )}
          >
            Recent Trades
            {activeTab === "trades" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("orders")}
            className={cn(
              "flex-1 pb-2 text-xs font-medium transition-colors relative whitespace-nowrap",
              activeTab === "orders"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark",
            )}
          >
            Open Orders
            {activeTab === "orders" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("balances")}
            className={cn(
              "flex-1 pb-2 text-xs font-medium transition-colors relative whitespace-nowrap",
              activeTab === "balances"
                ? "text-neutral-dark"
                : "text-neutral hover:text-neutral-dark",
            )}
          >
            Balances
            {activeTab === "balances" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-dark" />
            )}
          </button>
        </nav>

        <section className="animate-fade-in flex-1 overflow-auto min-w-0">
          {activeTab === "trades" ? (
            <section
              key={`trades-tab-${marketId}-${showMineOnly}`}
              className="space-y-2 min-w-0"
            >
              {/* Filter toggle */}
              <header className="flex justify-end mb-2">
                <nav className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setShowMineOnly(false)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      !showMineOnly
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900",
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
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    Mine
                  </button>
                </nav>
              </header>

              {/* Header row */}
              <header className="grid grid-cols-5 text-xs text-gray-500 py-2 border-b gap-2">
                <span className="text-right truncate">Price</span>
                <span className="text-right truncate">Amount</span>
                <span className="text-right truncate">Maker</span>
                <span className="text-right truncate">Taker</span>
                <span className="text-right truncate">Time</span>
              </header>

              {tradesLoading && trades.length === 0 ? (
                <article className="text-center py-8 text-neutral">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></span>
                  <p className="text-sm text-gray-500">
                    Fetching trade data...
                  </p>
                </article>
              ) : tradesError ? (
                <article className="text-center py-8 text-red-500">
                  Error loading recent trades: {tradesError}
                </article>
              ) : trades.length === 0 ? (
                <article className="text-center py-8 text-neutral">
                  <span className="text-gray-400 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
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
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No trades yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    This market hasn't seen any trading activity yet.
                  </p>
                </article>
              ) : (
                <section className="space-y-1">
                  {trades.map((trade, index) => (
                    <article
                      key={`${trade.timestamp}-${index}`}
                      className="grid grid-cols-5 text-xs py-2 border-b border-gray-100 gap-2 hover:bg-gray-50"
                    >
                      <span className="text-right truncate font-medium">
                        {trade.price} {tradingPair?.quoteSymbol || "TTK"}
                      </span>
                      <span className="text-right truncate">
                        {trade.quantity} {tradingPair?.baseSymbol || "ATOM"}
                      </span>
                      <span className="text-right truncate text-gray-500">
                        {trade.trader
                          ? `${trade.trader.slice(0, 6)}...${trade.trader.slice(-4)}`
                          : "Unknown"}
                      </span>
                      <span className="text-right truncate text-gray-500">
                        {trade.trader
                          ? `${trade.trader.slice(0, 6)}...${trade.trader.slice(-4)}`
                          : "Unknown"}
                      </span>
                      <span className="text-right truncate text-gray-500">
                        {formatTradeTime(trade.timestamp)}
                      </span>
                    </article>
                  ))}
                </section>
              )}
            </section>
          ) : activeTab === "orders" ? (
            <section
              key={`orders-tab-${marketId}-${showMineOnly}`}
              className="space-y-2 min-w-0"
            >
              {/* Filter toggle */}
              <header className="flex justify-end mb-2">
                <nav className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setShowMineOnly(false)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      !showMineOnly
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900",
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
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    Mine
                  </button>
                </nav>
              </header>

              {/* Header row */}
              <header className="grid grid-cols-4 text-xs text-gray-500 py-2 border-b gap-2">
                <span className="truncate">Type</span>
                <span className="text-right truncate">Price</span>
                <span className="text-right truncate">Amount</span>
                <span className="text-right truncate">Time</span>
              </header>

              {ordersLoading && orders.length === 0 ? (
                <article className="text-center py-8 text-neutral">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></span>
                  <p className="text-sm text-gray-500">
                    Fetching order data...
                  </p>
                </article>
              ) : ordersError ? (
                <article className="text-center py-8 text-red-500">
                  Error loading open orders: {ordersError}
                </article>
              ) : orders.length === 0 ? (
                <article className="text-center py-8 text-neutral">
                  <span className="text-gray-400 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
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
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    This market doesn't have any open orders yet.
                  </p>
                </article>
              ) : (
                <section className="space-y-1">
                  {orders.map((order) => (
                    <article
                      key={
                        order.orderId?.toString() || `order-${Math.random()}`
                      }
                      className="grid grid-cols-4 text-sm py-2 border-b last:border-0 gap-2 min-w-0"
                      style={{ minHeight: "2.5rem" }} // Prevent height changes during updates
                    >
                      <span
                        className={cn(
                          order.side === Side.BID
                            ? "text-bid-dark"
                            : "text-ask-dark",
                          "truncate font-medium",
                        )}
                      >
                        {order.side === Side.BID ? "BID" : "ASK"}
                      </span>
                      <span className="text-right truncate font-mono">
                        {order.price}
                      </span>
                      <span className="text-right truncate font-mono">
                        {order.quantity}
                      </span>
                      <span className="text-right text-neutral truncate text-xs">
                        {formatTime(new Date(Number(order.timestamp)))}
                      </span>
                    </article>
                  ))}
                </section>
              )}
            </section>
          ) : (
            <section key={`balances-tab-${marketId}`} className="space-y-4">
              {balancesLoading ? (
                <article className="text-center py-8 text-neutral">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></span>
                  Loading balances...
                </article>
              ) : balancesError ? (
                <article className="text-center py-8 text-red-500">
                  Error loading balances: {balancesError}
                </article>
              ) : !hasAnyBalances ? (
                <article className="text-center py-8">
                  <span className="text-gray-400 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No balances yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    You haven't deposited any tokens yet.
                  </p>
                  <button
                    onClick={handleDepositClick}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Make your first deposit
                  </button>
                </article>
              ) : (
                <>
                  {/* Summary */}
                  <article className="bg-gray-50 rounded-lg p-3">
                    <header className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Summary
                      </span>
                      <button
                        onClick={refreshBalances}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Refresh
                      </button>
                    </header>
                    <section className="grid grid-cols-2 gap-4 text-xs">
                      <span>
                        <span className="text-gray-500">
                          Tokens with Balances:
                        </span>
                        <span className="ml-2 font-medium">
                          {balances.length}
                        </span>
                      </span>
                      <span>
                        <span className="text-gray-500">Total Chains:</span>
                        <span className="ml-2 font-medium">
                          {new Set(balances.map((b) => b.chainId)).size}
                        </span>
                      </span>
                    </section>
                  </article>

                  {/* Token Balances */}
                  <section className="space-y-4">
                    {balances.map((balance) => {
                      // Get chain prefix for display
                      const getChainPrefix = (network: string): string => {
                        if (network.includes("flare")) return "f";
                        if (network.includes("base")) return "b";
                        if (network.includes("mainnet")) return "m";
                        if (network.includes("goerli")) return "g";
                        if (network.includes("sepolia")) return "s";
                        return network.charAt(0).toLowerCase();
                      };

                      const prefix = getChainPrefix(balance.network);
                      const prefixedSymbol = `${prefix}${balance.symbol}`;

                      return (
                        <article
                          key={`${balance.chainId}-${balance.symbol}`}
                          className="border rounded-lg p-3"
                        >
                          <header className="flex items-center justify-between mb-3">
                            <span className="flex items-center space-x-3">
                              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs font-bold">
                                  {balance.symbol.charAt(0)}
                                </span>
                              </span>
                              <span>
                                <span className="font-medium text-gray-900">
                                  {prefixedSymbol}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {balance.network}
                                </span>
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">
                              Chain ID: {balance.chainId}
                            </span>
                          </header>

                          <section className="space-y-2">
                            {parseFloat(balance.walletBalance) > 0 && (
                              <span className="flex justify-between py-1">
                                <span className="text-sm text-gray-600">
                                  Wallet Balance:
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {balance.walletBalance} {balance.symbol}
                                </span>
                              </span>
                            )}

                            {parseFloat(balance.depositedBalance) > 0 && (
                              <span className="flex justify-between py-1">
                                <span className="text-sm text-gray-600">
                                  Deposited (Available):
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {balance.depositedBalance} {balance.symbol}
                                </span>
                              </span>
                            )}

                            {parseFloat(balance.lockedBalance) > 0 && (
                              <span className="flex justify-between py-1">
                                <span className="text-sm text-gray-600">
                                  Locked in Orders:
                                </span>
                                <span className="text-sm font-medium text-orange-600">
                                  {balance.lockedBalance} {balance.symbol}
                                </span>
                              </span>
                            )}
                          </section>
                        </article>
                      );
                    })}
                  </section>

                  {/* Action Buttons */}
                  <nav className="flex space-x-2 pt-2">
                    <button
                      onClick={handleDepositClick}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={handleWithdrawClick}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Withdraw
                    </button>
                  </nav>
                </>
              )}
            </section>
          )}
        </section>
      </section>

      <DepositWithdrawModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          // Trigger global balance refresh immediately
          triggerBalanceRefresh();
          // Refresh local balances after modal closes
          setTimeout(() => {
            console.log("ActivityPanel: Refreshing balances after modal close");
            refreshBalances();
            // Trigger another global refresh to ensure all components update
            triggerBalanceRefresh();
          }, 1000);
        }}
        type={modalType}
        onSuccess={() => {
          console.log(
            "ActivityPanel: Deposit/withdraw successful, triggering balance refresh",
          );
          // Trigger immediate global refresh
          triggerBalanceRefresh();
          // Refresh local balances
          refreshBalances();
          // Add delayed refresh to catch blockchain updates
          setTimeout(() => {
            console.log("ActivityPanel: Delayed balance refresh after success");
            refreshBalances();
            triggerBalanceRefresh();
          }, 2000);
        }}
      />
    </main>
  );
};

export default ActivityPanel;
