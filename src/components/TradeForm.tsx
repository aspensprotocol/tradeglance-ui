
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface TradeFormProps {
  selectedPair: string;
}

const TradeForm = ({ selectedPair }: TradeFormProps) => {
  const [activeOrderType, setActiveOrderType] = useState<"market" | "limit" | "stop">("market");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0,0");
  const [price, setPrice] = useState("");
  const [percentageValue, setPercentageValue] = useState(0);

  const handlePercentageClick = (percentage: number) => {
    setPercentageValue(percentage);
  };

  return (
    <div className="h-full bg-[#1a1d29] rounded-lg shadow-sm border border-gray-700 animate-fade-in text-white">
      <div className="p-4 space-y-4">
        {/* Order Type Tabs */}
        <div className="flex rounded-lg bg-[#2a2d3a] p-1">
          {["market", "limit", "stop"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveOrderType(type as any)}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors capitalize",
                activeOrderType === type
                  ? "bg-[#1a1d29] text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex rounded-lg border border-gray-600 overflow-hidden">
          <button
            onClick={() => setActiveTab("buy")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "buy"
                ? "bg-[#00b8a9] text-white border-2 border-[#00b8a9]"
                : "text-gray-400 hover:text-white"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "sell"
                ? "bg-gray-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            Sell
          </button>
        </div>

        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white">Price</label>
            {activeOrderType === "market" && (
              <span className="text-xs text-gray-400">(Price determined by market)</span>
            )}
          </div>
          <div className="relative">
            <Info className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={activeOrderType === "market"}
              className={cn(
                "w-full pl-10 pr-20 py-3 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500",
                activeOrderType === "market" 
                  ? "bg-gray-700 cursor-not-allowed opacity-50" 
                  : "bg-[#2a2d3a]"
              )}
              placeholder=""
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-xs text-white font-bold">₿</span>
              </div>
              <span className="text-sm text-gray-300">UST2</span>
            </div>
          </div>
        </div>

        {/* Order Amount */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white">Order Amount</label>
            <span className="text-xs text-gray-400">(Set Size Order)</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pr-32 py-3 rounded-lg bg-[#2a2d3a] border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="0,0"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xs text-white">⚛</span>
                </div>
                <span className="text-sm text-gray-300">ATOM</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">₿</span>
                </div>
                <span className="text-sm text-gray-300">UST2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Percentage Buttons */}
        <div className="flex gap-2">
          {[10, 25, 50, 75, 100].map((percentage) => (
            <button
              key={percentage}
              onClick={() => handlePercentageClick(percentage)}
              className={cn(
                "flex-1 py-2 text-sm rounded-lg transition-colors",
                percentageValue === percentage
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2d3a] text-gray-400 hover:text-white hover:bg-[#3a3d4a]"
              )}
            >
              {percentage}%
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-2 py-3 border-t border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Amount</span>
            <span className="text-white">NaN ATOM</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Order Price</span>
            <span className="text-white">NaN UST2</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Estimated Fee</span>
            <span className="text-white">0.00 UST2</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total</span>
            <span className="text-white">NaN UST2</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Purchase price</span>
            <span className="text-white">NaN UST2</span>
          </div>
        </div>

        {/* Wallet Button */}
        <button className="w-full py-3 px-4 rounded-lg bg-[#00b8a9] text-white font-medium transition-colors hover:bg-[#00a695]">
          Wallet Not Connected
        </button>
      </div>
    </div>
  );
};

export default TradeForm;
