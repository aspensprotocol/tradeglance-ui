import { useState, useEffect, useCallback } from "react";
import { arborterService } from "../lib/grpc-client";
import { Trade } from "../protos/gen/arborter_pb";
import { weiToDecimal } from "../lib/number-utils";
import { useTradingPairs } from "./useTradingPairs";

export interface RecentTrade {
  id: string;
  side: string;
  price: number;
  quantity: number;
  timestamp: Date;
  trader: string;
  marketId: string;
}

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

  // Find the current trading pair to get token decimals
  const currentTradingPair = tradingPairs.find((pair) => pair.id === marketId);

  // Extract token decimals from the trading pair
  const baseTokenDecimals = currentTradingPair?.baseChainTokenDecimals || 18;
  const quoteTokenDecimals = currentTradingPair?.quoteChainTokenDecimals || 18;

  console.log("🔍 useRecentTrades: Token decimals:", {
    marketId,
    currentTradingPair: currentTradingPair?.displayName,
    baseTokenDecimals,
    quoteTokenDecimals,
    baseSymbol: currentTradingPair?.baseSymbol,
    quoteSymbol: currentTradingPair?.quoteSymbol,
  });
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries: number = 5; // Increased to 5 for better reliability with streaming
  const requestTimeout = 15000; // Increased to 15 seconds for streaming data

  // Process trades data into the expected format
  const processTradesData = useCallback(
    (tradesData: Trade[]): RecentTrade[] => {
      if (!tradesData || tradesData.length === 0) {
        return [];
      }

      console.log("Processing trades data:", tradesData.length, "trades");

      // Convert protobuf Trade objects to RecentTrade interface
      const processedTrades: RecentTrade[] = tradesData.map((trade: Trade) => ({
        id: trade.orderHit?.toString() || `trade-${Date.now()}`,
        side: trade.buyerIs === 1 ? "buy" : "sell", // 1 = MAKER, 2 = TAKER
        price: parseFloat(
          weiToDecimal(trade.price?.toString() || "0", quoteTokenDecimals),
        ),
        quantity: parseFloat(
          weiToDecimal(trade.qty?.toString() || "0", baseTokenDecimals),
        ),
        timestamp: new Date(Number(trade.timestamp) || Date.now()),
        trader: trade.makerId?.toString() || "",
        marketId: trade.makerBaseAddress || "",
      }));

      // Remove duplicates based on trade ID and timestamp
      const uniqueTrades: RecentTrade[] = processedTrades.filter(
        (trade: RecentTrade, index: number, self: RecentTrade[]) => {
          const tradeUniqueId: string = `${trade.id}-${trade.timestamp.getTime()}`;

          const firstIndex: number = self.findIndex((t: RecentTrade) => {
            const otherUniqueId: string = `${t.id}-${t.timestamp.getTime()}`;
            return otherUniqueId === tradeUniqueId;
          });

          const isDuplicate: boolean = firstIndex !== index;

          if (isDuplicate) {
            console.log("Removing duplicate trade:", {
              id: trade.id,
              timestamp: trade.timestamp,
              side: trade.side,
              price: trade.price,
            });
          }

          return !isDuplicate;
        },
      );

      if (uniqueTrades.length !== processedTrades.length) {
        console.log("Trades deduplication:", {
          original: processedTrades.length,
          unique: uniqueTrades.length,
          duplicates: processedTrades.length - uniqueTrades.length,
        });
      }

      // Sort by timestamp (newest first)
      uniqueTrades.sort(
        (a: RecentTrade, b: RecentTrade) =>
          b.timestamp.getTime() - a.timestamp.getTime(),
      );

      return uniqueTrades;
    },
    [],
  );

  // Fetch trades data with timeout
  const fetchTradesData = useCallback(
    async (
      marketId: string,
      filterByTrader?: string,
    ): Promise<RecentTrade[]> => {
      try {
        console.log("=== FETCHING RECENT TRADES ===");
        console.log("Market ID:", marketId);
        console.log("Filter by trader:", filterByTrader);

        // For continuous streaming, don't use timeout race - let the stream run
        const tradesData: Trade[] = await arborterService.getTrades(
          marketId,
          undefined,
          true,
          filterByTrader,
        );

        if (!tradesData || tradesData.length === 0) {
          console.log("No trades data received");
          return [];
        }

        console.log("Trades data received:", tradesData.length, "trades");

        // Get the first trade to check data structure
        const firstTrade: Trade = tradesData[0];
        console.log("First trade structure:", {
          orderHit: firstTrade.orderHit,
          price: firstTrade.price,
          qty: firstTrade.qty,
          timestamp: firstTrade.timestamp,
          makerId: firstTrade.makerId,
          makerBaseAddress: firstTrade.makerBaseAddress,
        });

        const processedTrades: RecentTrade[] = processTradesData(
          tradesData as Trade[],
        );

        // Remove duplicates
        const uniqueTrades: RecentTrade[] = processedTrades.filter(
          (trade: RecentTrade, index: number, self: RecentTrade[]) => {
            const tradeUniqueId: string = `${trade.id}-${trade.timestamp.getTime()}`;
            const firstIndex: number = self.findIndex((t: RecentTrade) => {
              const otherUniqueId: string = `${t.id}-${t.timestamp.getTime()}`;
              return otherUniqueId === tradeUniqueId;
            });
            const isDuplicate: boolean = firstIndex !== index;

            if (isDuplicate) {
              console.log("Removing duplicate trade in fetch:", {
                id: trade.id,
                timestamp: trade.timestamp,
                side: trade.side,
                price: trade.price,
              });
            }

            return !isDuplicate;
          },
        );

        console.log("Final unique trades:", uniqueTrades.length);
        return uniqueTrades;
      } catch (error: unknown) {
        console.error("Error fetching recent trades:", error);
        throw error;
      }
    },
    [processTradesData, requestTimeout],
  );

  // Fetch data effect
  useEffect(() => {
    if (!marketId || marketId.trim() === "") {
      console.log("useRecentTrades: No market ID, skipping fetch");
      setInitialLoading(false);
      setTrades([]);
      return;
    }

    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const tradesData: RecentTrade[] = await fetchTradesData(
          marketId,
          filterByTrader,
        );

        if (tradesData && tradesData.length > 0) {
          setTrades(tradesData);
          console.log(
            "✅ Recent trades loaded successfully:",
            tradesData.length,
            "trades",
          );
        } else {
          console.log("📭 No trades found, setting empty state");
          setTrades([]);
        }

        setInitialLoading(false);
        setRetryCount(0); // Reset retry count on successful fetch
      } catch (error: unknown) {
        const errorMessage: string =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching data:", errorMessage);

        // Check if this is a streaming error (network error, incomplete chunked encoding)
        const isStreamingError =
          errorMessage.includes("network error") ||
          errorMessage.includes("ERR_INCOMPLETE_CHUNKED_ENCODING") ||
          errorMessage.includes("Request timeout");

        if (isStreamingError && retryCount < maxRetries) {
          console.log(
            `🔄 Streaming error detected, will retry (${retryCount + 1}/${maxRetries})`,
          );
          // Don't set error state for streaming errors, just retry
          // Don't set initialLoading to false yet, keep trying
        } else if (isStreamingError && retryCount >= maxRetries) {
          console.log("⚠️ Max streaming retries exceeded, showing error");
          setError("Connection issues - please refresh to retry");
          setInitialLoading(false);
        } else {
          // Non-streaming error, show immediately
          setError(errorMessage);
          setInitialLoading(false);
        }

        // Set empty state on error to prevent UI from hanging
        setTrades([]);

        // Retry logic with shorter delays
        if (retryCount < maxRetries) {
          const delay: number = Math.min(1000 * (retryCount + 1), 3000); // Increased max delay to 3 seconds
          console.log(
            `Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`,
          );

          setTimeout(() => {
            setRetryCount((prev: number) => prev + 1);
          }, delay);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [marketId, filterByTrader, fetchTradesData, retryCount, maxRetries]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    if (!marketId || marketId.trim() === "") {
      console.log("useRecentTrades: No market ID, skipping refresh");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRetryCount(0); // Reset retry count on manual refresh

      const tradesData: RecentTrade[] = await fetchTradesData(
        marketId,
        filterByTrader,
      );

      if (tradesData && tradesData.length > 0) {
        setTrades(tradesData);
        console.log(
          "✅ Recent trades refreshed successfully:",
          tradesData.length,
          "trades",
        );
      } else {
        console.log("📭 No trades found on refresh, setting empty state");
        setTrades([]);
      }
    } catch (error: unknown) {
      const errorMessage: string =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error refreshing data:", errorMessage);
      setError(errorMessage);

      // Set empty state on error to prevent UI from hanging
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [marketId, filterByTrader, fetchTradesData]);

  // Determine loading states - be more aggressive about showing "no data"
  const isInitialLoading: boolean = initialLoading && retryCount === 0; // Only show initial loading on first attempt
  const isLoading: boolean = loading && retryCount === 0; // Only show loading on first attempt

  return {
    trades,
    loading: isLoading,
    initialLoading: isInitialLoading,
    error,
    refresh,
  };
}
