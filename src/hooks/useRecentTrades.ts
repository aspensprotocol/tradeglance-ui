import { useState, useEffect, useCallback, useRef } from "react";
import { arborterService } from "../lib/grpc-client";
import type { Trade } from "../protos/gen/arborter_pb";
import { useTradingPairs } from "./useTradingPairs";
import { formatDecimalConsistent } from "../lib/number-utils";
import type { RecentTrade, SharedTradesData } from "../lib/shared-types";
import { useGlobalTradesCache } from "./useGlobalTradesCache";

export function useRecentTrades(
  marketId: string,
  filterByTrader?: string,
): {
  trades: RecentTrade[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  // Get trading pairs to extract token decimals
  const { tradingPairs } = useTradingPairs();

  // Get global trades cache
  const globalTradesCache = useGlobalTradesCache();

  // Find the current trading pair to get token decimals
  const currentTradingPair = tradingPairs.find((pair) => pair.id === marketId);

  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs instead of state for retry logic to prevent re-render loops
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum interval between fetches (3 seconds)
  const minFetchInterval = 3000;

  // Process trades data into the expected format
  const processTradesData = useCallback(
    (tradesData: Trade[]): RecentTrade[] => {
      if (!tradesData || tradesData.length === 0) return [];

      // Convert protobuf Trade objects to RecentTrade interface
      const processedTrades: RecentTrade[] = tradesData.map((trade: Trade) => {
        // The backend sends values in pair decimal format, not wei format
        // So we need to divide by 10^pairDecimals, not 10^tokenDecimals
        const pairDecimals = currentTradingPair?.pairDecimals || 8;

        // Convert from pair decimal format to human-readable format
        const priceDecimal = parseFloat(
          formatDecimalConsistent(
            (
              parseFloat(trade.price?.toString() || "0") /
              Math.pow(10, pairDecimals)
            ).toString(),
          ),
        );

        const quantityDecimal = parseFloat(
          formatDecimalConsistent(
            (
              parseFloat(trade.qty?.toString() || "0") /
              Math.pow(10, pairDecimals)
            ).toString(),
          ),
        );

        return {
          id: trade.orderHit?.toString() || `trade-${Date.now()}`,
          side: trade.buyerIs === 1 ? "buy" : "sell", // 1 = MAKER, 2 = TAKER
          price: priceDecimal,
          quantity: quantityDecimal,
          timestamp: new Date(Number(trade.timestamp) || Date.now()),
          trader: trade.makerBaseAddress || "", // For backwards compatibility
          makerAddress: trade.makerBaseAddress || "",
          takerAddress: trade.takerBaseAddress || "",
          marketId, // Use the marketId parameter instead of makerBaseAddress
          // Add proper address fields for each chain
          makerBaseAddress: trade.makerBaseAddress || "",
          makerQuoteAddress: trade.makerQuoteAddress || "",
          takerBaseAddress: trade.takerBaseAddress || "",
          takerQuoteAddress: trade.takerQuoteAddress || "",
        };
      });

      // Remove duplicates based on trade ID and timestamp
      const uniqueTrades: RecentTrade[] = processedTrades.filter(
        (trade: RecentTrade, index: number, self: RecentTrade[]) => {
          const tradeUniqueId = `${trade.id}-${trade.timestamp.getTime()}`;

          const firstIndex: number = self.findIndex((t: RecentTrade) => {
            const otherUniqueId = `${t.id}-${t.timestamp.getTime()}`;
            return otherUniqueId === tradeUniqueId;
          });

          return firstIndex === index;
        },
      );

      // Sort by timestamp (newest first)
      uniqueTrades.sort(
        (a: RecentTrade, b: RecentTrade) =>
          b.timestamp.getTime() - a.timestamp.getTime(),
      );

      return uniqueTrades;
    },
    [currentTradingPair, marketId],
  );

  // Fetch trades data
  const fetchTradesData = useCallback(
    async (
      marketIdParam: string,
      filterByTraderParam?: string,
      signal?: AbortSignal,
    ): Promise<RecentTrade[]> => {
      // Check if aborted before starting
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }

      const tradesData: Trade[] = await arborterService.getTrades(
        marketIdParam,
        false, // continueStream - DISABLED to prevent resource exhaustion
        true,  // historicalClosedTrades
        filterByTraderParam,
      );

      // Check if aborted after fetch
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }

      if (!tradesData || tradesData.length === 0) {
        return [];
      }

      const processedTrades: RecentTrade[] = processTradesData(tradesData);
      return processedTrades;
    },
    [processTradesData],
  );

  // Main fetch function with throttling and abort support
  const fetchData = useCallback(
    async (isRetry = false): Promise<void> => {
      if (!marketId || marketId.trim() === "") {
        setInitialLoading(false);
        setTrades([]);
        return;
      }

      // Throttle: prevent requests that are too frequent
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      if (timeSinceLastFetch < minFetchInterval && !isRetry) {
        console.log(
          `🚫 Throttling trades request (${timeSinceLastFetch}ms < ${minFetchInterval}ms)`,
        );
        return;
      }

      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        console.log("🚫 Trades fetch already in progress, skipping");
        return;
      }

      // Check cache first (only on non-retry)
      if (!isRetry) {
        const cachedData = globalTradesCache.getCachedData(
          marketId,
          filterByTrader,
        );
        if (
          cachedData &&
          !globalTradesCache.isDataStale(marketId, 5 * 60 * 1000, filterByTrader)
        ) {
          setTrades(cachedData.trades);
          setInitialLoading(false);
          setLoading(false);
          setError(null);
          return;
        }
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Fetching trades for market:", marketId);

        const tradesData: RecentTrade[] = await fetchTradesData(
          marketId,
          filterByTrader,
          signal,
        );

        // Check if aborted
        if (signal.aborted) {
          return;
        }

        if (tradesData && tradesData.length > 0) {
          setTrades(tradesData);

          // Cache the trades data
          const sharedTradesData: SharedTradesData = {
            trades: tradesData,
            lastUpdate: new Date(),
          };
          globalTradesCache.setCachedData(
            marketId,
            sharedTradesData,
            filterByTrader,
          );
        } else {
          setTrades([]);

          // Cache empty state too
          const sharedTradesData: SharedTradesData = {
            trades: [],
            lastUpdate: new Date(),
          };
          globalTradesCache.setCachedData(
            marketId,
            sharedTradesData,
            filterByTrader,
          );
        }

        setInitialLoading(false);
        retryCountRef.current = 0; // Reset retry count on success
        console.log("✅ Trades fetched successfully");
      } catch (err: unknown) {
        // Ignore abort errors
        if (err instanceof Error && err.message === "Request aborted") {
          return;
        }

        const errorMessage: string =
          err instanceof Error ? err.message : "Unknown error occurred";

        console.error("❌ Trades fetch error:", errorMessage);

        // Check if this is a streaming/network error
        const isStreamingError =
          errorMessage.includes("network error") ||
          errorMessage.includes("ERR_INCOMPLETE_CHUNKED_ENCODING") ||
          errorMessage.includes("ERR_INSUFFICIENT_RESOURCES") ||
          errorMessage.includes("Request timeout");

        if (isStreamingError && retryCountRef.current < maxRetries) {
          // Schedule retry with exponential backoff
          const delay = Math.min(3000 * Math.pow(2, retryCountRef.current), 15000);
          console.log(
            `🔄 Scheduling retry ${retryCountRef.current + 1}/${maxRetries} in ${delay}ms`,
          );

          retryCountRef.current += 1;

          // Clear any existing retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }

          retryTimeoutRef.current = setTimeout(() => {
            fetchData(true);
          }, delay);
        } else if (retryCountRef.current >= maxRetries) {
          setError("Connection issues - please refresh to retry");
          setInitialLoading(false);
          setTrades([]);
        } else {
          setError(errorMessage);
          setInitialLoading(false);
          setTrades([]);
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    },
    [marketId, filterByTrader, fetchTradesData, globalTradesCache],
  );

  // Fetch data effect - only depends on marketId and filterByTrader
  useEffect(() => {
    // Reset state when market changes
    retryCountRef.current = 0;
    lastFetchTimeRef.current = 0;

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (!marketId || marketId.trim() === "") {
      setInitialLoading(false);
      setTrades([]);
      return;
    }

    // Start fetch
    fetchData();

    // Cleanup function
    return () => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      isFetchingRef.current = false;
    };
  }, [marketId, filterByTrader, fetchData]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    if (!marketId || marketId.trim() === "") {
      return;
    }

    // Reset retry count on manual refresh
    retryCountRef.current = 0;
    // Reset last fetch time to allow immediate fetch
    lastFetchTimeRef.current = 0;

    await fetchData();
  }, [marketId, fetchData]);

  // Determine loading states
  const isInitialLoading: boolean = initialLoading && retryCountRef.current === 0;
  const isLoading: boolean = loading && retryCountRef.current === 0;

  return {
    trades,
    loading: isLoading,
    initialLoading: isInitialLoading,
    error,
    refresh,
  };
}
