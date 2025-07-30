import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataFetching } from './useDataFetching';
import { arborterService } from '../lib/grpc-client';
import { OrderbookEntry, OrderbookResponse } from '../lib/grpc-client';
import { isActiveOrderbookEntry, getOrderbookSideString } from '../lib/grpc-client';
import { weiToDecimal, formatDecimal } from '../lib/number-utils';

export interface OrderbookOrder {
  price: string;
  quantity: string;
  total: string;
  orderId: string;
  side: 'bid' | 'ask';
}

export interface OrderbookData {
  bids: OrderbookOrder[];
  asks: OrderbookOrder[];
  spread: number;
  spreadPercentage: number;
  lastUpdate: Date;
}

export function useOrderbook(marketId: string, filterByTrader?: string) {
  // Process orderbook data into the expected format
  const processOrderbookData = useCallback((entries: OrderbookEntry[]): OrderbookData => {
    const bids: OrderbookOrder[] = [];
    const asks: OrderbookOrder[] = [];

    entries.forEach(entry => {
      // Convert wei values to decimal format
      const priceDecimal = weiToDecimal(entry.price || '0');
      const quantityDecimal = weiToDecimal(entry.quantity || '0');

      // Calculate total using raw decimal values (before formatting)
      const priceNum = parseFloat(priceDecimal);
      const quantityNum = parseFloat(quantityDecimal);
      const totalDecimal = (!isNaN(priceNum) && !isNaN(quantityNum)) ? (priceNum * quantityNum).toString() : '0';

      // Format the values for display
      const priceFormatted = formatDecimal(priceDecimal);
      const quantityFormatted = formatDecimal(quantityDecimal);
      const totalFormatted = formatDecimal(totalDecimal, 6); // Use 6 decimal places for total

      const order: OrderbookOrder = {
        price: priceFormatted,
        quantity: quantityFormatted,
        total: totalFormatted,
        orderId: entry.order_id?.toString() || '',
        side: getOrderbookSideString(entry.side)
      };

      if (order.side === 'bid') {
        bids.push(order);
      } else {
        asks.push(order);
      }
    });

    // Sort bids in descending order (highest first)
    bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

    // Sort asks in ascending order (lowest first)
    asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    // Calculate spread
    const lowestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
    const highestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
    const spread = lowestAsk - highestBid;
    const spreadPercentage = lowestAsk > 0 ? (spread / lowestAsk) * 100 : 0;

    return {
      bids,
      asks,
      spread,
      spreadPercentage,
      lastUpdate: new Date()
    };
  }, []);

  // Fetch function for the common hook
  const fetchOrderbookData = useCallback(async (marketId: string, filterByTrader?: string): Promise<OrderbookData> => {
    const response: OrderbookResponse = await arborterService.getOrderbookSnapshot(marketId, filterByTrader);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch orderbook');
    }
    
    // Handle different response formats
    let entries: OrderbookEntry[] = [];
    
    if (response.data && Array.isArray(response.data)) {
      entries = response.data;
    } else if (Array.isArray(response)) {
      entries = response;
    } else if (response && response.data) {
      entries = Array.isArray(response.data) ? response.data : [response.data];
    }
    
    return processOrderbookData(entries);
  }, [processOrderbookData]);

  // Use the common data fetching hook
  const { data: orderbook, loading, initialLoading, error, refetch } = useDataFetching({
    marketId,
    filterByTrader,
    fetchFunction: fetchOrderbookData,
    pollingInterval: 20000,
    debounceMs: 300
  });

  return { orderbook, loading, initialLoading, error, refetch };
} 