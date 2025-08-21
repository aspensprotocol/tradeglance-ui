import { useState, useEffect } from 'react';

/**
 * Utility for creating and managing web workers for heavy computations
 */

interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  data: T;
}

interface WorkerResponse<T = unknown> {
  id: string;
  type: string;
  data: T;
  error?: string;
}

class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private messageHandlers: Map<string, (response: WorkerResponse<unknown>) => void> = new Map();
  private messageId = 0;

  /**
   * Create a new web worker with the given script
   */
  createWorker(name: string, script: string): Worker {
    if (this.workers.has(name)) {
      this.workers.get(name)?.terminate();
    }

    const blob = new Blob([script], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.onmessage = (event) => {
      const response: WorkerResponse = event.data;
      const handler = this.messageHandlers.get(response.id);
      
      if (handler) {
        handler(response);
        this.messageHandlers.delete(response.id);
      }
    };

    worker.onerror = (error) => {
      console.error(`Worker ${name} error:`, error);
    };

    this.workers.set(name, worker);
    return worker;
  }

  /**
   * Send a message to a worker and wait for response
   */
  sendMessage<T, R>(
    workerName: string,
    type: string,
    data: T
  ): Promise<R> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker ${workerName} not found`);
    }

    const messageId = `msg_${++this.messageId}`;
    
    return new Promise((resolve, reject) => {
      this.messageHandlers.set(messageId, (response: WorkerResponse<unknown>) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data as R);
        }
      });

      const message: WorkerMessage<T> = {
        id: messageId,
        type,
        data,
      };

      worker.postMessage(message);
    });
  }

  /**
   * Terminate a specific worker
   */
  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  /**
   * Terminate all workers
   */
  terminateAll(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();
    this.messageHandlers.clear();
  }

  /**
   * Get the number of active workers
   */
  getWorkerCount(): number {
    return this.workers.size;
  }
}

// Create a singleton instance
export const workerManager = new WorkerManager();

/**
 * Create a worker for orderbook data processing
 */
export function createOrderbookWorker(): Worker {
  const script = `
    // Orderbook processing worker
    self.onmessage = function(event) {
      const { id, type, data } = event.data;
      
      try {
        let result;
        
        switch (type) {
          case 'processOrderbook':
            result = processOrderbookData(data);
            break;
          case 'calculateSpread':
            result = calculateSpread(data);
            break;
          case 'aggregateOrders':
            result = aggregateOrders(data);
            break;
          default:
            throw new Error(\`Unknown message type: \${type}\`);
        }
        
        self.postMessage({
          id,
          type,
          data: result,
        });
      } catch (error) {
        self.postMessage({
          id,
          type,
          error: error.message,
        });
      }
    };

    function processOrderbookData(entries) {
      // Process orderbook entries (price/quantity formatting, validation, etc.)
      return entries.map(entry => ({
        ...entry,
        price: parseFloat(entry.price).toFixed(6),
        quantity: parseFloat(entry.quantity).toFixed(6),
      }));
    }

    function calculateSpread(orderbook) {
      const { bids, asks } = orderbook;
      if (bids.length === 0 || asks.length === 0) return { spread: 0, spreadPercentage: 0 };
      
      const bestBid = Math.max(...bids.map(b => parseFloat(b.price)));
      const bestAsk = Math.min(...asks.map(a => parseFloat(a.price)));
      const spread = bestAsk - bestBid;
      const spreadPercentage = (spread / bestBid) * 100;
      
      return { spread, spreadPercentage };
    }

    function aggregateOrders(orders) {
      // Aggregate orders by price level
      const priceMap = new Map();
      
      orders.forEach(order => {
        const price = order.price;
        if (priceMap.has(price)) {
          priceMap.get(price).quantity += parseFloat(order.quantity);
        } else {
          priceMap.set(price, {
            price: order.price,
            quantity: parseFloat(order.quantity),
            side: order.side,
          });
        }
      });
      
      return Array.from(priceMap.values());
    }
  `;

  return workerManager.createWorker('orderbook', script);
}

/**
 * Create a worker for trade data processing
 */
export function createTradeWorker(): Worker {
  const script = `
    // Trade processing worker
    self.onmessage = function(event) {
      const { id, type, data } = event.data;
      
      try {
        let result;
        
        switch (type) {
          case 'processTrades':
            result = processTradeData(data);
            break;
          case 'calculateVolume':
            result = calculateVolume(data);
            break;
          case 'filterTrades':
            result = filterTrades(data);
            break;
          default:
            throw new Error(\`Unknown message type: \${type}\`);
        }
        
        self.postMessage({
          id,
          type,
          data: result,
        });
      } catch (error) {
        self.postMessage({
          id,
          type,
          error: error.message,
        });
      }
    };

    function processTradeData(trades) {
      return trades.map(trade => ({
        ...trade,
        price: parseFloat(trade.price).toFixed(6),
        qty: parseFloat(trade.qty).toFixed(6),
        timestamp: new Date(parseInt(trade.timestamp)).toISOString(),
      }));
    }

    function calculateVolume(trades) {
      return trades.reduce((total, trade) => total + parseFloat(trade.qty), 0);
    }

    function filterTrades({ trades, filterByTrader }) {
      if (!filterByTrader) return trades;
      return trades.filter(trade => 
        trade.makerBaseAddress === filterByTrader || 
        trade.takerBaseAddress === filterByTrader
      );
    }
  `;

  return workerManager.createWorker('trade', script);
}

/**
 * Hook for using workers in React components
 */
export function useWorker<T, R>(
  workerName: string,
  type: string,
  data: T
): { result: R | null; loading: boolean; error: string | null } {
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;

    setLoading(true);
    setError(null);

    workerManager
      .sendMessage<T, R>(workerName, type, data)
      .then((response) => {
        setResult(response);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [workerName, type, data]);

  return { result, loading, error };
}

export default workerManager;
