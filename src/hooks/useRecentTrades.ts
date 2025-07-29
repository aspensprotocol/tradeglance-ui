import { useState, useEffect, useCallback } from 'react';
import { arborterService } from '@/lib/grpc-client';

export interface RecentTrade {
  id: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: Date;
  txHash?: string;
}

export interface UseRecentTradesReturn {
  trades: RecentTrade[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecentTrades(marketId: string | undefined): UseRecentTradesReturn {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentTrades = useCallback(async () => {
    if (!marketId) {
      setTrades([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching recent trades for market:', marketId);
      // For now, we'll use the same orderbook endpoint since it might include recent trades
      // In the future, there might be a dedicated recent trades endpoint
      const response = await arborterService.getOrderbook(marketId);
      
      if (response.success && response.data) {
        // Parse the recent trades data from the gRPC response
        const data = response.data;
        
        // Extract recent trades from the response
        // The exact structure depends on the protobuf definition
        const recentTrades: any[] = data.recent_trades || data.trades || [];
        
        const parsedTrades: RecentTrade[] = recentTrades.map(trade => ({
          id: trade.id || trade.trade_id || '',
          price: trade.price || '0',
          quantity: trade.quantity || '0',
          side: (trade.side === 'buy' || trade.side === 1) ? 'buy' : 'sell',
          timestamp: new Date(trade.timestamp || Date.now()),
          txHash: trade.tx_hash || trade.transaction_hash
        }));

        setTrades(parsedTrades);
        console.log('Recent trades data updated:', parsedTrades);
      } else {
        throw new Error('Failed to fetch recent trades data');
      }
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent trades');
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  // Initial fetch
  useEffect(() => {
    fetchRecentTrades();
  }, [fetchRecentTrades]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!marketId) return;

    const interval = setInterval(() => {
      fetchRecentTrades();
    }, 10000); // Poll every 10 seconds for trades

    return () => clearInterval(interval);
  }, [marketId, fetchRecentTrades]);

  return {
    trades,
    loading,
    error,
    refresh: fetchRecentTrades
  };
} 