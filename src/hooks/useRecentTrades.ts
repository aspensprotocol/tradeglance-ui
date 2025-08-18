import { useState, useEffect, useCallback } from 'react';
import { arborterService } from '../lib/grpc-client';
import { weiToDecimal } from '../lib/number-utils';
import { Trade, TradeRole } from '../protos/gen/arborter_pb';
import { useDataFetching } from './useDataFetching';

export interface RecentTrade {
  id: string;
  price: string;
  quantity: string;
  side: string;
  timestamp: Date;
  makerId: string;
  takerId: string;
  makerBaseAddress: string;
  makerQuoteAddress: string;
  takerBaseAddress: string;
  takerQuoteAddress: string;
  buyerIs: number;
  sellerIs: number;
}

export function useRecentTrades(marketId: string, filterByTrader?: string) {
  // Process trades data into the expected format using proper protobuf types
  const processTradesData = useCallback((tradesData: Trade[]): RecentTrade[] => {
    console.log('\n=== PROCESSING TRADES DATA ===');
    console.log('Number of trades to process:', tradesData.length);
    console.log('Raw trades data received:', tradesData);
    
    return tradesData.map((trade, index) => {
      console.log(`\n--- Processing Trade ${index} ---`);
      console.log('Full trade object:', trade);
      
      // Log all available fields
      console.log('All trade fields:');
      console.log('  timestamp:', trade.timestamp, 'type:', typeof trade.timestamp);
      console.log('  price:', trade.price, 'type:', typeof trade.price);
      console.log('  qty:', trade.qty, 'type:', typeof trade.qty);
      console.log('  makerId:', trade.makerId, 'type:', typeof trade.makerId);
      console.log('  takerId:', trade.takerId, 'type:', typeof trade.takerId);
      console.log('  makerBaseAddress:', trade.makerBaseAddress, 'type:', typeof trade.makerBaseAddress);
      console.log('  makerQuoteAddress:', trade.makerQuoteAddress, 'type:', typeof trade.makerQuoteAddress);
      console.log('  takerBaseAddress:', trade.takerBaseAddress, 'type:', typeof trade.takerBaseAddress);
      console.log('  takerQuoteAddress:', trade.takerQuoteAddress, 'type:', typeof trade.takerQuoteAddress);
      console.log('  buyerIs:', trade.buyerIs, 'type:', typeof trade.buyerIs);
      console.log('  sellerIs:', trade.sellerIs, 'type:', typeof trade.sellerIs);
      console.log('  orderHit:', trade.orderHit, 'type:', typeof trade.orderHit);
      
      console.log('\nTrade timestamp details:');
      console.log('  Raw value:', trade.timestamp);
      console.log('  Type:', typeof trade.timestamp);
      console.log('  Constructor:', trade.timestamp?.constructor?.name);
      console.log('  Is bigint:', typeof trade.timestamp === 'bigint');
      console.log('  Is number:', typeof trade.timestamp === 'number');
      console.log('  Is string:', typeof trade.timestamp === 'string');
      
      console.log('\nTrade side determination fields:');
      console.log('  buyerIs:', trade.buyerIs, 'type:', typeof trade.buyerIs);
      console.log('  sellerIs:', trade.sellerIs, 'type:', typeof trade.sellerIs);
      console.log('  orderHit:', trade.orderHit, 'type:', typeof trade.orderHit);
      
      // Parse timestamp correctly - use the same approach as Open Orders tab
      let timestamp: Date;
      if (trade.timestamp) {
        // Use the same timestamp parsing logic as Open Orders tab
        // Just treat the timestamp as milliseconds directly
        timestamp = new Date(Number(trade.timestamp));
        console.log('  Timestamp parsed as milliseconds:', timestamp, 'ISO:', timestamp.toISOString());
      } else {
        // No timestamp provided, use current time
        timestamp = new Date();
        console.log('  No timestamp provided, using current time:', timestamp, 'ISO:', timestamp.toISOString());
      }

      // Determine side based on TradeRole enum values
      // TradeRole.MAKER = 1, TradeRole.TAKER = 2
      // buyerIs indicates who is the buyer (MAKER or TAKER)
      console.log('\nTrade side determination:');
      console.log('  buyerIs:', trade.buyerIs, 'type:', typeof trade.buyerIs);
      console.log('  sellerIs:', trade.sellerIs, 'type:', typeof trade.sellerIs);
      console.log('  orderHit:', trade.orderHit, 'type:', typeof trade.orderHit);
      
      let side: string;
      // The side should be determined by the order that was hit, not by buyerIs/sellerIs
      // For now, use a simple heuristic: if we have orderHit, it's a valid trade
      if (trade.orderHit) {
        // This is a completed trade, determine side based on the order that was hit
        // We'll use a placeholder side for now since the actual side logic needs more context
        side = 'buy'; // Placeholder - this should be determined by the order details
        console.log('  -> Side: BUY (placeholder - orderHit present)');
      } else {
        side = 'buy'; // Default to buy if no orderHit
        console.log('  -> Side: BUY (default - no orderHit)');
      }

      const processedTrade: RecentTrade = {
        id: trade.orderHit?.toString() || `trade-${Date.now()}-${index}`, // Fallback ID if no orderHit
        price: weiToDecimal(trade.price || '0'),
        quantity: weiToDecimal(trade.qty || '0'),
        side: side,
        timestamp: timestamp,
        makerId: trade.makerId || '',
        takerId: trade.takerId || '',
        makerBaseAddress: trade.makerBaseAddress || '',
        makerQuoteAddress: trade.makerQuoteAddress || '',
        takerBaseAddress: trade.takerBaseAddress || '',
        takerQuoteAddress: trade.takerQuoteAddress || '',
        buyerIs: trade.buyerIs || 0,
        sellerIs: trade.sellerIs || 0
      };
      
      console.log('\nProcessed trade result:');
      console.log('  ID:', processedTrade.id);
      console.log('  Price:', processedTrade.price);
      console.log('  Quantity:', processedTrade.quantity);
      console.log('  Side:', processedTrade.side);
      console.log('  Timestamp:', processedTrade.timestamp.toISOString());
      console.log('  Timestamp raw:', processedTrade.timestamp.getTime());
      console.log('  Full processed trade:', processedTrade);
      
      return processedTrade;
    });
  }, []);

  // Fetch function for the common hook - now uses snapshot instead of streaming
  const fetchTradesData = useCallback(async (marketId: string, filterByTrader?: string): Promise<RecentTrade[]> => {
    try {
      console.log('=== FETCHING RECENT TRADES ===');
      console.log('Market ID:', marketId);
      console.log('Filter by trader:', filterByTrader);
      
      // Use snapshot endpoint instead of streaming
      const tradesData = await arborterService.getTradesSnapshot(marketId, true, filterByTrader);
      
      console.log('=== RAW TRADES RESPONSE FROM SERVER ===');
      console.log('Response type:', typeof tradesData);
      console.log('Response constructor:', tradesData?.constructor?.name);
      console.log('Is array:', Array.isArray(tradesData));
      console.log('Response length:', tradesData?.length);
      console.log('Full response:', tradesData);
      
      // Log the first trade in detail if available
      if (tradesData && Array.isArray(tradesData) && tradesData.length > 0) {
        console.log('\n=== FIRST TRADE DETAILS ===');
        const firstTrade = tradesData[0];
        console.log('First trade:', firstTrade);
        console.log('First trade keys:', Object.keys(firstTrade));
        console.log('First trade prototype:', Object.getPrototypeOf(firstTrade));
        console.log('First trade constructor:', firstTrade.constructor);
        console.log('First trade toString:', firstTrade.toString());
      }
      
      if (tradesData && Array.isArray(tradesData)) {
        const processedTrades = processTradesData(tradesData as Trade[]);
        
        // Better deduplication - use orderHit + timestamp to create unique IDs
        // Multiple trades can have the same orderHit, so we need to make them unique
        const uniqueTrades = processedTrades.filter((trade, index, self) => {
          // Create a unique identifier combining orderHit and timestamp
          const tradeUniqueId = `${trade.id}-${trade.timestamp.getTime()}`;
          
          const firstIndex = self.findIndex(t => {
            const otherUniqueId = `${t.id}-${t.timestamp.getTime()}`;
            return otherUniqueId === tradeUniqueId;
          });
          
          const isDuplicate = firstIndex !== index;
          if (isDuplicate) {
            console.log('Removing duplicate trade:', {
              id: trade.id,
              timestamp: trade.timestamp.toISOString(),
              uniqueId: tradeUniqueId,
              firstIndex,
              currentIndex: index
            });
          }
          return !isDuplicate;
        });
        
        if (uniqueTrades.length !== processedTrades.length) {
          console.log('Trade deduplication:', {
            original: processedTrades.length,
            unique: uniqueTrades.length,
            duplicates: processedTrades.length - uniqueTrades.length
          });
        }
        
        console.log('Recent trades fetched successfully:', uniqueTrades.length);
        return uniqueTrades;
      } else {
        console.warn('No trades data in response:', tradesData);
        return [];
      }
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      throw error;
    }
  }, [processTradesData]);

  // Use the common data fetching hook with polling for real-time updates
  const { data: trades, loading, initialLoading, error, refetch } = useDataFetching({
    marketId: marketId || '', // Ensure marketId is always a string
    filterByTrader,
    fetchFunction: fetchTradesData,
    pollingInterval: marketId ? 5000 : 0, // Only poll when marketId is available
    debounceMs: 300
  });

  // Log when trades data changes to help debug duplication
  useEffect(() => {
    if (trades && trades.length > 0) {
      console.log('Recent trades data updated:', {
        count: trades.length,
        firstTrade: trades[0],
        lastTrade: trades[trades.length - 1],
        allIds: trades.map(t => t.id)
      });
    }
  }, [trades]);

  // Only show loading on initial load, not during polling updates
  // This prevents the spinning wheel from appearing every 5 seconds
  const isInitialLoading = initialLoading;
  const isLoading = initialLoading; // Only show loading on first load

  return { 
    trades: trades || [], 
    loading: isLoading, 
    initialLoading: isInitialLoading,
    error, 
    refresh: refetch 
  };
} 