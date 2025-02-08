
import { useState } from "react";
import { Check, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  price: number;
  amount: number;
  total: number;
}

const mockOrders: Order[] = Array(8).fill(null).map((_, i) => ({
  price: 50000 - i * 100,
  amount: Math.random() * 2,
  total: Math.random() * 100000
}));

const OrderBook = () => {
  const [bids] = useState<Order[]>(mockOrders);
  const [asks] = useState<Order[]>(mockOrders.map(order => ({ ...order, price: order.price + 1000 })));

  const OrderRow = ({ order, type }: { order: Order, type: 'bid' | 'ask' }) => (
    <div className={cn(
      "grid grid-cols-3 py-1 px-2 text-sm transition-colors",
      "hover:bg-neutral-soft cursor-pointer",
      type === 'bid' ? "text-bid-dark" : "text-ask-dark"
    )}>
      <span className="text-right">{order.price.toLocaleString()}</span>
      <span className="text-right">{order.amount.toFixed(4)}</span>
      <span className="text-right">{order.total.toLocaleString()}</span>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Order Book</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="space-y-1">
          <div className="grid grid-cols-3 text-xs text-neutral-dark mb-2">
            <span className="text-right">Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
          {bids.map((bid, i) => (
            <OrderRow key={i} order={bid} type="bid" />
          ))}
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-3 text-xs text-neutral-dark mb-2">
            <span className="text-right">Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
          {asks.map((ask, i) => (
            <OrderRow key={i} order={ask} type="ask" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
