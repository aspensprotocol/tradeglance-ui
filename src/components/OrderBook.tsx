
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Order {
  price: number;
  amount: number;
  total: number;
  address: string;
}

interface OrderBookProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  tradingPairs: string[];
}

// Updated mock data to include addresses
const mockOrders: Order[] = Array(8).fill(null).map((_, i) => ({
  price: 50000 - i * 100,
  amount: Math.random() * 2,
  total: Math.random() * 100000,
  address: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`
}));

const OrderBook = ({ selectedPair, onPairChange, tradingPairs }: OrderBookProps) => {
  const [bids] = useState<Order[]>(mockOrders);
  const [asks] = useState<Order[]>(mockOrders.map(order => ({ ...order, price: order.price + 1000 })));

  const BidRow = ({ order }: { order: Order }) => (
    <div className={cn(
      "grid grid-cols-3 py-1 px-2 text-sm transition-colors gap-x-6",
      "hover:bg-neutral-soft cursor-pointer text-bid-dark"
    )}>
      <span className="text-right">{order.amount.toFixed(4)}</span>
      <span className="text-right">{order.total.toLocaleString()}</span>
      <span className="text-right">{order.price.toLocaleString()}</span>
    </div>
  );

  const AskRow = ({ order }: { order: Order }) => (
    <div className={cn(
      "grid grid-cols-3 py-1 px-2 text-sm transition-colors gap-x-6",
      "hover:bg-neutral-soft cursor-pointer text-ask-dark"
    )}>
      <span className="text-right">{order.price.toLocaleString()}</span>
      <span className="text-right">{order.amount.toFixed(4)}</span>
      <span className="text-right">{order.total.toLocaleString()}</span>
    </div>
  );

  const BidsTableHeader = () => (
    <div className="grid grid-cols-3 text-xs text-neutral-dark mb-2 gap-x-6">
      <span className="text-right">Amount</span>
      <span className="text-right">Total</span>
      <span className="text-right">Price</span>
    </div>
  );

  const AsksTableHeader = () => (
    <div className="grid grid-cols-3 text-xs text-neutral-dark mb-2 gap-x-6">
      <span className="text-right">Price</span>
      <span className="text-right">Amount</span>
      <span className="text-right">Total</span>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 border-b">
        <select
          value={selectedPair}
          onChange={(e) => onPairChange(e.target.value)}
          className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral text-sm bg-white"
        >
          {tradingPairs.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
      </div>      
      <div className="flex gap-4 p-4">
        <div className="flex-1 space-y-1 p-4 rounded-lg bg-[#fcfffe]">
          {/* Bids Logo */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#9b87f5] flex items-center justify-center text-white font-bold mb-2">
              B
            </div>
            <span className="text-sm text-[#8E9196]">on XRPL</span>
          </div>
          
          <BidsTableHeader />
          {bids.map((bid, i) => (
            <BidRow key={i} order={bid} />
          ))}
        </div>

        <div className="flex-1 space-y-1 p-4 rounded-lg bg-[#fffeff]">
          {/* Asks Logo */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#7E69AB] flex items-center justify-center text-white font-bold mb-2">
              A
            </div>
            <span className="text-sm text-[#8E9196]">on Flare</span>
          </div>
          
          <AsksTableHeader />
          {asks.map((ask, i) => (
            <AskRow key={i} order={ask} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
