import { useState, useMemo } from "react";

import { useUnifiedBalance } from "@/hooks/useUnifiedBalance";

import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTabOptimization } from "@/hooks/useTabOptimization";
import { triggerBalanceRefresh, getAddressExplorerLink, formatAddress, toChecksum } from "../lib/utils";
import { formatDecimalConsistent } from "@/lib/number-utils";
import type { TradingPair, RecentTrade } from "@/lib/shared-types";
import { cn } from "@/lib/utils";
import DepositWithdrawModal from "./DepositWithdrawModal";
import type { OrderbookEntry } from "@/protos/gen/arborter_pb";
import { Side } from "@/protos/gen/arborter_pb";
import type { BaseOrQuote } from "@/lib/shared-types";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ActivityPanelProps {
  tradingPair?: TradingPair;
  currentTradingSide?: BaseOrQuote.BASE | BaseOrQuote.QUOTE;
}

const ActivityPanel = ({
  tradingPair,
  currentTradingSide,
}: ActivityPanelProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit");
  const [showMineOnly, setShowMineOnly] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  // Use tab optimization to prevent unnecessary reloads
  const { activeTab, switchTab } = useTabOptimization<
    "trades" | "orders" | "balances"
  >({
    initialTab: "trades",
    dataFetchingEnabled: true,
    cacheTimeout: 30000, // 30 seconds
  });

  // Get all balances across all tokens and chains using unified hook
  const {
    allBalances: balances,
    allBalancesLoading: balancesLoading,
    error: balancesError,
    refreshAll: refreshBalances,
  } = useUnifiedBalance(tradingPair, currentTradingSide);

  // Get the market ID from the trading pair
  const marketId = tradingPair?.id;

  // TEMPORARILY DISABLED: Use market-specific orderbook hook for open orders
  // const {
  //   openOrders,
  //   loading: ordersLoading,
  //   error: ordersError,
  // } = useMarketOrderbook(marketId || "", showMineOnly ? address : undefined);

  // TEMPORARILY DISABLED: Only call hooks when their corresponding tab is active to prevent data accumulation
  // const {
  //   trades,
  //   loading: tradesLoading,
  //   error: tradesError,
  // } = useRecentTrades(
  //   activeTab === "trades" && marketId ? marketId : "", // Only fetch when trades tab is active and marketId exists
  //   showMineOnly ? address : undefined,
  // );

  // No mock data - using real data fetching
  const openOrders: OrderbookEntry[] = [];
  const ordersLoading = false;
  const ordersError: string | null = null;
  const trades = useMemo(() => [] as RecentTrade[], []);
  const tradesLoading = false;
  const tradesError: string | null = null;

  // No need for client-side filtering since we're using API-level filtering
  const orders = openOrders;

  // Sort data based on current sort state
  const sortedTrades = useMemo(() => {
    if (!sortField || !sortDirection) return trades;

    return [...trades].sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortField) {
        case "price":
          aValue = (a.price || 0) * (a.quantity || 0); // Sort by total value
          bValue = (b.price || 0) * (b.quantity || 0); // Sort by total value
          break;
        case "quantity":
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case "time":
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [trades, sortField, sortDirection]);

  const sortedOrders = useMemo(() => {
    if (!sortField || !sortDirection) return orders;

    return [...orders].sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortField) {
        case "price":
          aValue = parseFloat(a.price || "0");
          bValue = parseFloat(b.price || "0");
          break;
        case "quantity":
          aValue = parseFloat(a.quantity || "0");
          bValue = parseFloat(b.quantity || "0");
          break;
        case "time":
          aValue = Number(a.timestamp);
          bValue = Number(b.timestamp);
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [orders, sortField, sortDirection]);

  // Get trading balances for the current trading pair (using useUnifiedBalance instead)

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

  // Remove unused handleTabChange function since we're using switchTab directly

  // Sorting helper functions
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    if (sortDirection === "asc") return <ChevronUp className="h-3 w-3" />;
    if (sortDirection === "desc") return <ChevronDown className="h-3 w-3" />;
    return null;
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
    return timestamp.toLocaleString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
      // Use browser's local timezone (no timeZone specified)
    });
  };

  // Helper function to determine which chain an address traded from
  const getAddressChainId = (
    _address: string,
    isMaker: boolean,
    tradeSide: string,
  ): number => {
    if (!tradingPair) return 0;

    // Simple color-based logic:
    // - Green addresses (buyers) always link to quote chain
    // - Red addresses (sellers) always link to base chain

    // Determine if this address is a buyer (green) or seller (red)
    const isBuyer =
      (isMaker && tradeSide === "buy") || (!isMaker && tradeSide === "sell");

    return isBuyer ? tradingPair.quoteChainId : tradingPair.baseChainId;
  };

  return (
    <main className="h-full bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 rounded-2xl shadow-xl border-2 border-blue-200/50 animate-fade-in overflow-visible relative shadow-visible">
      {/* Floating decorative elements */}
      <section className="absolute inset-0 pointer-events-none overflow-hidden">
        <section className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-blue-300/5 to-indigo-300/5 rounded-full blur-md animate-pulse delay-300"></section>
        <section className="absolute bottom-4 right-4 w-6 h-6 bg-gradient-to-br from-emerald-300/5 to-teal-300/5 rounded-full blur-md animate-pulse delay-700"></section>
      </section>

      <section className="p-3 sm:p-4 lg:p-5 h-full flex flex-col min-w-0 relative z-10">
        <header className="flex items-center justify-between mb-4 min-w-0">
          <nav className="flex bg-gradient-to-r from-slate-100/10 to-blue-100/10 rounded-xl p-1 border border-blue-200/30 shadow-lg flex-1 max-w-md min-w-0">
            <button
              onClick={() => switchTab("trades")}
              className={cn(
                "flex-1 py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-all duration-300 relative whitespace-nowrap min-w-0 rounded-xl group overflow-hidden",
                activeTab === "trades"
                  ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-xl transform scale-105 animate-pulse-glow"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:shadow-md transform hover:scale-[1.02]",
              )}
            >
              {/* Floating sparkles for active tab */}
              {activeTab === "trades" && (
                <>
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
                </>
              )}
              <span className="hidden sm:inline">Recent </span>Trades
              {activeTab === "trades" && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-indigo-400/5 to-purple-400/5 rounded-xl blur-sm"></span>
              )}
            </button>
            <button
              onClick={() => switchTab("orders")}
              className={cn(
                "flex-1 py-2 px-3 text-xs sm:text-sm font-semibold transition-all duration-300 relative whitespace-nowrap min-w-0 rounded-xl group overflow-hidden",
                activeTab === "orders"
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl transform scale-105 animate-pulse-glow"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:shadow-md transform hover:scale-[1.02]",
              )}
            >
              {/* Floating sparkles for active tab */}
              {activeTab === "orders" && (
                <>
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
                </>
              )}
              <span className="hidden sm:inline">Open </span>Orders
              {activeTab === "orders" && (
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-teal-400/5 to-cyan-400/5 rounded-xl blur-sm"></span>
              )}
            </button>
            <button
              onClick={() => switchTab("balances")}
              className={cn(
                "flex-1 py-2 px-3 text-xs sm:text-sm font-semibold transition-all duration-300 relative whitespace-nowrap min-w-0 rounded-xl group overflow-hidden",
                activeTab === "balances"
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-xl transform scale-105 animate-pulse-glow"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:shadow-md transform hover:scale-[1.02]",
              )}
            >
              {/* Floating sparkles for active tab */}
              {activeTab === "balances" && (
                <>
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
                </>
              )}
              Balances
              {activeTab === "balances" && (
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400/5 via-pink-400/5 to-rose-400/5 rounded-xl blur-sm"></span>
              )}
            </button>
          </nav>

          {/* Filter toggle - only show for trades and orders tabs */}
          {(activeTab === "trades" || activeTab === "orders") && (
            <nav className="flex bg-gradient-to-r from-slate-100/10 to-blue-100/10 rounded-xl p-1 border border-blue-200/30 shadow-lg ml-2 sm:ml-3 min-w-0">
              <button
                onClick={() => setShowMineOnly(false)}
                className={cn(
                  "px-2 sm:px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] group overflow-hidden relative",
                  !showMineOnly
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg animate-pulse-glow"
                    : "text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:shadow-md",
                )}
              >
                {/* Floating sparkles for active state */}
                {!showMineOnly && (
                  <>
                    <span className="absolute -top-1 -left-1 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                    <span className="absolute -top-1 -right-1 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
                  </>
                )}

                {/* Glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-indigo-400/5 to-purple-400/5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10">All</span>
              </button>
              <button
                onClick={() => setShowMineOnly(true)}
                className={cn(
                  "px-2 sm:px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] group overflow-hidden relative",
                  showMineOnly
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg animate-pulse-glow"
                    : "text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:shadow-md",
                )}
              >
                {/* Floating sparkles for active state */}
                {showMineOnly && (
                  <>
                    <span className="absolute -top-1 -left-1 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                    <span className="absolute -top-1 -right-1 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
                  </>
                )}

                {/* Glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-teal-400/5 to-cyan-400/5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10">Mine</span>
              </button>
            </nav>
          )}
        </header>

        <section className="animate-fade-in flex-1 min-w-0 overflow-auto rounded-2xl">
          {activeTab === "trades" ? (
            <section
              key={`trades-tab-${marketId}-${showMineOnly}`}
              className="space-y-2 min-w-0 rounded-2xl"
            >
              {/* Header row */}
              <header className="grid grid-cols-4 sm:grid-cols-5 text-xs text-neutral-600 py-2 border-b border-gray-200 gap-1 sm:gap-2 rounded-t-xl min-w-0">
                <button
                  onClick={() => handleSort("price")}
                  className="text-right truncate hover:text-blue-600 hover:scale-105 transition-all duration-300 flex items-center justify-end gap-1 group cursor-pointer font-semibold min-w-0"
                >
                  💰 Price
                  {getSortIcon("price")}
                </button>
                <button
                  onClick={() => handleSort("quantity")}
                  className="text-right truncate hover:text-emerald-600 hover:scale-105 transition-all duration-300 flex items-center justify-end gap-1 group cursor-pointer font-semibold min-w-0"
                >
                  📊 Amount
                  {getSortIcon("quantity")}
                </button>
                <span className="text-right truncate hidden sm:block min-w-0">
                  👤 Maker
                </span>
                <span className="text-right truncate min-w-0">👤 Taker</span>
                <button
                  onClick={() => handleSort("time")}
                  className="text-right truncate hover:text-purple-600 hover:scale-105 transition-all duration-300 flex items-center justify-end gap-1 group cursor-pointer font-semibold min-w-0"
                >
                  ⏰ Time
                  {getSortIcon("time")}
                </button>
              </header>

              {tradesLoading && trades.length === 0 ? (
                <article className="text-center py-4 text-neutral">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></span>
                  <p className="text-sm text-neutral-600">
                    Fetching trade data...
                  </p>
                </article>
              ) : tradesError ? (
                <article className="text-center py-4 text-red-500">
                  Error loading recent trades: {tradesError}
                </article>
              ) : trades.length === 0 ? (
                <article className="text-center py-4 text-neutral">
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
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    No trades yet
                  </h3>
                  <p className="text-sm text-neutral-600">
                    This market hasn't seen any trading activity yet.
                  </p>
                </article>
              ) : (
                <section className="space-y-2 rounded-2xl">
                  {sortedTrades.map((trade, index) => (
                    <article
                      key={`${trade.timestamp}-${index}`}
                      className="grid grid-cols-4 sm:grid-cols-5 text-xs py-3 px-3 gap-1 sm:gap-2 bg-gradient-to-r from-white via-blue-50/10 to-indigo-50/10 rounded-xl border border-blue-100 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 cursor-pointer group relative overflow-hidden animate-pulse-glow min-w-0"
                    >
                      {/* Enhanced hover effect overlay */}
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></span>

                      {/* Floating sparkles on hover */}
                      <span className="absolute -top-1 -left-1 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping transition-all duration-300 pointer-events-none"></span>
                      <span className="absolute -top-1 -right-1 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping delay-300 transition-all duration-300 pointer-events-none"></span>

                      <span
                        className={cn(
                          "text-right truncate font-semibold relative z-10",
                          trade.side === "buy"
                            ? "text-red-600" // Red for buy (user pays)
                            : "text-green-600", // Green for sell (user receives)
                        )}
                      >
                        {formatDecimalConsistent(trade.price * trade.quantity)}{" "}
                        {tradingPair?.quoteSymbol || "TTK"}
                      </span>
                      <span
                        className={cn(
                          "text-right truncate font-semibold relative z-10",
                          trade.side === "buy"
                            ? "text-green-600" // Green for buy (user receives tokens)
                            : "text-red-600", // Red for sell (user gives tokens)
                        )}
                      >
                        {formatDecimalConsistent(trade.quantity)}{" "}
                        {tradingPair?.baseSymbol || "ATOM"}
                      </span>
                      <a
                        href={
                          trade.makerAddress || trade.trader
                            ? getAddressExplorerLink(
                                trade.makerAddress || trade.trader || "",
                                getAddressChainId(
                                  trade.makerAddress || trade.trader || "",
                                  true,
                                  trade.side || "",
                                ),
                              )
                            : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-right truncate hidden sm:block relative z-10 font-medium hover:underline cursor-pointer",
                          trade.side === "buy"
                            ? "text-green-600 hover:text-green-700" // Maker is buyer in buy trades
                            : "text-red-600 hover:text-red-700", // Maker is seller in sell trades
                        )}
                        title={`Maker: ${trade.makerAddress || trade.trader ? toChecksum(trade.makerAddress || trade.trader || "") : "Unknown"}\nTaker: ${trade.takerAddress ? toChecksum(trade.takerAddress) : "Unknown"}\nClick to view on ${
                          getAddressChainId(
                            trade.makerAddress || trade.trader || "",
                            true,
                            trade.side || "",
                          ) === tradingPair?.baseChainId
                            ? tradingPair?.baseChainNetwork === "base-sepolia"
                              ? "Base Sepolia Explorer"
                              : tradingPair?.baseChainNetwork === "base-mainnet"
                                ? "Base Explorer"
                                : tradingPair?.baseChainNetwork ===
                                    "flare-mainnet"
                                  ? "Flare Explorer"
                                  : tradingPair?.baseChainNetwork ===
                                      "flare-testnet"
                                    ? "Flare Testnet Explorer"
                                    : "Base Chain Explorer"
                            : tradingPair?.quoteChainNetwork === "base-sepolia"
                              ? "Base Sepolia Explorer"
                              : tradingPair?.quoteChainNetwork ===
                                  "base-mainnet"
                                ? "Base Explorer"
                                : tradingPair?.quoteChainNetwork ===
                                    "flare-mainnet"
                                  ? "Flare Explorer"
                                  : tradingPair?.quoteChainNetwork ===
                                      "flare-testnet"
                                    ? "Flare Testnet Explorer"
                                    : "Quote Chain Explorer"
                        }`}
                      >
                        {trade.makerAddress || trade.trader
                          ? formatAddress(trade.makerAddress || trade.trader || "")
                          : "Unknown"}
                      </a>
                      <a
                        href={
                          trade.takerAddress
                            ? getAddressExplorerLink(
                                trade.takerAddress,
                                getAddressChainId(
                                  trade.takerAddress,
                                  false,
                                  trade.side || "",
                                ),
                              )
                            : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-right truncate relative z-10 font-medium hover:underline cursor-pointer",
                          trade.side === "buy"
                            ? "text-red-600 hover:text-red-700" // Taker is seller in buy trades
                            : "text-green-600 hover:text-green-700", // Taker is buyer in sell trades
                        )}
                        title={`Maker: ${trade.makerAddress || trade.trader ? toChecksum(trade.makerAddress || trade.trader || "") : "Unknown"}\nTaker: ${trade.takerAddress ? toChecksum(trade.takerAddress) : "Unknown"}\nClick to view on ${
                          getAddressChainId(
                            trade.takerAddress || "",
                            false,
                            trade.side || "",
                          ) === tradingPair?.baseChainId
                            ? tradingPair?.baseChainNetwork === "base-sepolia"
                              ? "Base Sepolia Explorer"
                              : tradingPair?.baseChainNetwork === "base-mainnet"
                                ? "Base Explorer"
                                : tradingPair?.baseChainNetwork ===
                                    "flare-mainnet"
                                  ? "Flare Explorer"
                                  : tradingPair?.baseChainNetwork ===
                                      "flare-testnet"
                                    ? "Flare Testnet Explorer"
                                    : "Base Chain Explorer"
                            : tradingPair?.quoteChainNetwork === "base-sepolia"
                              ? "Base Sepolia Explorer"
                              : tradingPair?.quoteChainNetwork ===
                                  "base-mainnet"
                                ? "Base Explorer"
                                : tradingPair?.quoteChainNetwork ===
                                    "flare-mainnet"
                                  ? "Flare Explorer"
                                  : tradingPair?.quoteChainNetwork ===
                                      "flare-testnet"
                                    ? "Flare Testnet Explorer"
                                    : "Quote Chain Explorer"
                        }`}
                      >
                        {trade.takerAddress
                          ? formatAddress(trade.takerAddress)
                          : "Unknown"}
                      </a>
                      <span className="text-right truncate text-gray-600 font-medium relative z-10">
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
              className="space-y-2 min-w-0 rounded-2xl"
            >
              {/* Header row */}
              <header className="grid grid-cols-4 text-xs text-neutral-600 py-2 border-b border-gray-200 gap-2 rounded-t-xl min-w-0">
                <span className="truncate min-w-0">🎯 Type</span>
                <button
                  onClick={() => handleSort("price")}
                  className="text-right truncate hover:text-blue-600 hover:scale-105 transition-all duration-300 flex items-center justify-end gap-1 group cursor-pointer font-semibold min-w-0"
                >
                  💰 Price
                  {getSortIcon("price")}
                </button>
                <button
                  onClick={() => handleSort("quantity")}
                  className="text-right truncate hover:text-emerald-600 hover:scale-105 transition-all duration-300 flex items-center justify-end gap-1 group cursor-pointer font-semibold min-w-0"
                >
                  📊 Amount
                  {getSortIcon("quantity")}
                </button>
                <button
                  onClick={() => handleSort("time")}
                  className="text-right truncate hover:text-purple-600 hover:scale-105 transition-all duration-300 flex items-center justify-end gap-1 group cursor-pointer font-semibold min-w-0"
                >
                  ⏰ Time
                  {getSortIcon("time")}
                </button>
              </header>

              {ordersLoading && orders.length === 0 ? (
                <article className="text-center py-4 text-neutral">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></span>
                  <p className="text-sm text-neutral-600">
                    Fetching order data...
                  </p>
                </article>
              ) : ordersError ? (
                <article className="text-center py-4 text-red-500">
                  Error loading open orders: {ordersError}
                </article>
              ) : orders.length === 0 ? (
                <article className="text-center py-4 text-neutral">
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
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-sm text-neutral-600">
                    This market doesn't have any open orders yet.
                  </p>
                </article>
              ) : (
                <section className="space-y-1 rounded-2xl">
                  {sortedOrders.map((order: OrderbookEntry) => (
                    <article
                      key={
                        order.orderId?.toString() || `order-${Math.random()}`
                      }
                      className="grid grid-cols-4 text-sm py-3 px-3 gap-2 min-w-0 bg-gradient-to-r from-white via-emerald-50/10 to-teal-50/10 rounded-xl border border-emerald-100 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-gradient-to-r hover:from-emerald-50/50 hover:via-teal-50/50 hover:to-cyan-50/50 cursor-pointer group relative overflow-hidden animate-pulse-glow"
                      style={{ minHeight: "2.5rem" }} // Prevent height changes during updates
                    >
                      {/* Enhanced hover effect overlay */}
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></span>

                      {/* Floating sparkles on hover */}
                      <span className="absolute -top-1 -left-1 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping transition-all duration-300 pointer-events-none"></span>
                      <span className="absolute -top-1 -right-1 w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping delay-300 transition-all duration-300 pointer-events-none"></span>
                      <span
                        className={cn(
                          order.side === Side.BID
                            ? "text-bid-dark"
                            : "text-ask-dark",
                          "truncate font-medium relative z-10",
                        )}
                      >
                        {order.side === Side.BID ? "🟢 BID" : "🔴 ASK"}
                      </span>
                      <span className="text-right truncate font-mono relative z-10">
                        {formatDecimalConsistent(order.price)}
                      </span>
                      <span className="text-right truncate font-mono relative z-10">
                        {formatDecimalConsistent(order.quantity)}
                      </span>
                      <span className="text-right text-neutral truncate text-xs relative z-10">
                        {formatTime(new Date(Number(order.timestamp)))}
                      </span>
                    </article>
                  ))}
                </section>
              )}
            </section>
          ) : (
            <section
              key={`balances-tab-${marketId}`}
              className="space-y-4 rounded-2xl"
            >
              {balancesLoading ? (
                <article className="text-center py-4 text-neutral">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></span>
                  Loading balances...
                </article>
              ) : balancesError ? (
                <article className="text-center py-4 text-red-500">
                  Error loading balances: {balancesError}
                </article>
              ) : !balances || balances.length === 0 ? (
                <article className="text-center py-4">
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
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    No balances yet
                  </h3>
                  <p className="text-sm text-neutral-600">
                    You haven't deposited any tokens yet.
                  </p>
                  <button
                    onClick={handleDepositClick}
                    className="mt-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-pulse-glow relative overflow-hidden group"
                  >
                    {/* Floating sparkles */}
                    <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>

                    {/* Glowing effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-indigo-400/5 to-purple-400/5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

                    <span className="relative z-10">
                      💎 Make your first deposit
                    </span>
                  </button>
                </article>
              ) : (
                <>
                  {/* Summary */}
                  <article className="bg-gradient-to-r from-slate-50 via-blue-50/10 to-indigo-50/10 rounded-xl p-4 border border-blue-200/50 shadow-lg min-w-0">
                    <header className="flex items-center justify-between mb-3 min-w-0">
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        📊 Summary
                      </span>
                      <button
                        onClick={refreshBalances}
                        className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 animate-pulse-glow relative overflow-hidden group flex-shrink-0"
                      >
                        {/* Floating sparkle */}
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping opacity-75"></span>

                        <span className="relative z-10">🔄 Refresh</span>
                      </button>
                    </header>
                    <section className="grid grid-cols-2 gap-4 text-xs min-w-0">
                      <span className="truncate">
                        <span className="text-gray-500">
                          Tokens with Balances:
                        </span>
                        <span className="ml-2 font-medium">
                          {
                            balances.filter((balance) => {
                              const walletBalance = parseFloat(
                                balance.walletBalance,
                              );
                              const depositedBalance = parseFloat(
                                balance.depositedBalance,
                              );
                              const lockedBalance = parseFloat(
                                balance.lockedBalance,
                              );
                              return (
                                walletBalance > 0 ||
                                depositedBalance > 0 ||
                                lockedBalance > 0
                              );
                            }).length
                          }
                        </span>
                      </span>
                      <span className="truncate">
                        <span className="text-gray-500">Total Chains:</span>
                        <span className="ml-2 font-medium">
                          {new Set(balances.map((b) => b.chainId)).size}
                        </span>
                      </span>
                    </section>
                  </article>

                  {/* Token Balances */}
                  <section className="space-y-4 rounded-2xl">
                    {balances
                      .filter((balance) => {
                        // Only show tokens that have at least one non-zero balance
                        const walletBalance = parseFloat(balance.walletBalance);
                        const depositedBalance = parseFloat(
                          balance.depositedBalance,
                        );
                        const lockedBalance = parseFloat(balance.lockedBalance);
                        return (
                          walletBalance > 0 ||
                          depositedBalance > 0 ||
                          lockedBalance > 0
                        );
                      })
                      .map(
                        (balance: {
                          symbol: string;
                          chainId: number;
                          network: string;
                          walletBalance: string;
                          depositedBalance: string;
                          lockedBalance: string;
                        }) => {
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
                              className="bg-gradient-to-r from-white via-blue-50/10 to-indigo-50/10 border-2 border-blue-200/50 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden animate-pulse-glow h-48 flex flex-col min-w-0"
                            >
                              {/* Enhanced hover effect overlay */}
                              <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></span>

                              {/* Floating sparkles on hover */}
                              <span className="absolute -top-1 -left-1 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping transition-all duration-300 pointer-events-none"></span>
                              <span className="absolute -top-1 -right-1 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping delay-300 transition-all duration-300 pointer-events-none"></span>

                              {/* Fixed height header */}
                              <header className="flex items-center justify-between mb-3 relative z-10 flex-shrink-0 min-w-0">
                                <span className="flex items-center space-x-3 min-w-0 flex-1">
                                  <span className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                                    <span className="text-blue-600 text-xs font-bold">
                                      {balance.symbol.charAt(0)}
                                    </span>
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="font-semibold text-gray-900 truncate block">
                                      {prefixedSymbol}
                                    </span>
                                    <span className="text-xs text-gray-500 truncate block">
                                      {balance.network}
                                    </span>
                                  </span>
                                </span>
                                <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-lg flex-shrink-0 ml-2">
                                  Chain ID: {balance.chainId}
                                </span>
                              </header>

                              {/* Scrollable content section with fixed height */}
                              <section className="space-y-2 relative z-10 rounded-2xl flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
                                {parseFloat(balance.walletBalance) > 0 && (
                                  <span className="flex justify-between py-2 px-3 bg-gradient-to-r from-slate-50 to-blue-50/10 rounded-lg border border-blue-100/50">
                                    <span className="text-sm text-gray-700 font-medium">
                                      💼 Wallet Balance:
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {formatDecimalConsistent(
                                        balance.walletBalance,
                                      )}{" "}
                                      {balance.symbol}
                                    </span>
                                  </span>
                                )}

                                {parseFloat(balance.depositedBalance) > 0 && (
                                  <span className="flex justify-between py-2 px-3 bg-gradient-to-r from-emerald-50 to-teal-50/10 rounded-lg border border-emerald-100/50">
                                    <span className="text-sm text-gray-700 font-medium">
                                      💎 Deposited (Available):
                                    </span>
                                    <span className="text-sm font-semibold text-emerald-600">
                                      {formatDecimalConsistent(
                                        balance.depositedBalance,
                                      )}{" "}
                                      {balance.symbol}
                                    </span>
                                  </span>
                                )}

                                {parseFloat(balance.lockedBalance) > 0 && (
                                  <span className="flex justify-between py-2 px-3 bg-gradient-to-r from-orange-50 to-red-50/10 rounded-lg border border-orange-100/50">
                                    <span className="text-sm text-gray-700 font-medium">
                                      🔒 Locked in Orders:
                                    </span>
                                    <span className="text-sm font-semibold text-orange-600">
                                      {formatDecimalConsistent(
                                        balance.lockedBalance,
                                      )}{" "}
                                      {balance.symbol}
                                    </span>
                                  </span>
                                )}
                              </section>
                            </article>
                          );
                        },
                      )}
                  </section>

                  {/* Action Buttons */}
                  <nav className="flex gap-3 pt-3 min-w-0">
                    <button
                      onClick={handleDepositClick}
                      className="flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-pulse-glow relative overflow-hidden group min-w-0"
                    >
                      {/* Floating sparkles */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>

                      {/* Glowing effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-indigo-400/5 to-purple-400/5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

                      <span className="relative z-10">💎 Deposit</span>
                    </button>
                    <button
                      onClick={handleWithdrawClick}
                      className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-pulse-glow relative overflow-hidden group min-w-0"
                    >
                      {/* Floating sparkles */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>

                      {/* Glowing effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-teal-400/5 to-cyan-400/5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></span>

                      <span className="relative z-10">💸 Withdraw</span>
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
            refreshBalances();
            // Trigger another global refresh to ensure all components update
            triggerBalanceRefresh();
          }, 1000);
        }}
        type={modalType}
        onSuccess={() => {
          // Trigger immediate global refresh
          triggerBalanceRefresh();
          // Refresh local balances
          refreshBalances();
          // Add delayed refresh to catch blockchain updates
          setTimeout(() => {
            refreshBalances();
            triggerBalanceRefresh();
          }, 2000);
        }}
      />
    </main>
  );
};

export default ActivityPanel;
