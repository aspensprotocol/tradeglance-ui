
import { useState } from "react";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Order {
  price: number;
  amount: number;
  total: number;
  address: string;
}

// Updated mock data to include addresses
const mockOrders: Order[] = Array(8).fill(null).map((_, i) => ({
  price: 50000 - i * 100,
  amount: Math.random() * 2,
  total: Math.random() * 100000,
  address: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`
}));

const OrderBook = () => {
  const [bids] = useState<Order[]>(mockOrders);
  const [asks] = useState<Order[]>(mockOrders.map(order => ({ ...order, price: order.price + 1000 })));

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast("Address copied to clipboard");
  };

  const OrderRow = ({ order, type }: { order: Order, type: 'bid' | 'ask' }) => (
    <div className={cn(
      "grid grid-cols-4 py-1 px-2 text-sm transition-colors gap-x-6",
      "hover:bg-neutral-soft cursor-pointer",
      type === 'bid' ? "text-bid-dark" : "text-ask-dark"
    )}>
      <span className="text-right">{order.price.toLocaleString()}</span>
      <span className="text-right">{order.amount.toFixed(4)}</span>
      <span className="text-right">{order.total.toLocaleString()}</span>
      <div className="text-right font-mono text-neutral-dark flex items-center justify-end gap-2">
        <span>{order.address}</span>
        <Copy 
          className="h-4 w-4 cursor-pointer hover:text-neutral" 
          onClick={() => handleCopyAddress(order.address)}
        />
      </div>
    </div>
  );

  const TableHeader = () => (
    <div className="grid grid-cols-4 text-xs text-neutral-dark mb-2 gap-x-6">
      <span className="text-right">Price</span>
      <span className="text-right">Amount</span>
      <span className="text-right">Total</span>
      <span className="text-right">Address</span>
    </div>
  );

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">      
      <div className="flex gap-4 p-4">
        <div className="flex-1 space-y-1">
          {/* Bids Logo */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#9b87f5] flex items-center justify-center text-white font-bold mb-2">
              B
            </div>
            <span className="text-sm text-[#8E9196]">on Base</span>
          </div>
          
          <TableHeader />
          {bids.map((bid, i) => (
            <OrderRow key={i} order={bid} type="bid" />
          ))}
        </div>

        <div className="flex-1 space-y-1">
          {/* Asks Logo */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#7E69AB] flex items-center justify-center text-white font-bold mb-2">
              A
            </div>
            <span className="text-sm text-[#8E9196]">on Optimism</span>
          </div>
          
          <TableHeader />
          {asks.map((ask, i) => (
            <OrderRow key={i} order={ask} type="ask" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
