import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface TradeFormProps {
  selectedPair: string;
}

const TradeForm = ({ selectedPair }: TradeFormProps) => {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [isMarket, setIsMarket] = useState(false);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    // Assuming max amount is 100 for this example
    setAmount((value[0]).toString());
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setActiveTab("buy")}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === "buy"
                ? "bg-bid text-white"
                : "hover:bg-neutral-soft"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === "sell"
                ? "bg-ask text-white"
                : "hover:bg-neutral-soft"
            )}
          >
            Sell
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-dark">Available to trade</span>
              <span className="font-medium">1,000.00 USDT</span>
            </div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral"
              placeholder="0.00"
            />
            <div className="pt-4">
              <Slider
                defaultValue={[0]}
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-neutral">
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Price</label>
              <button
                onClick={() => setIsMarket(!isMarket)}
                className="flex items-center space-x-1 text-sm text-neutral hover:text-neutral-dark"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                  isMarket && "bg-neutral border-neutral"
                )}>
                  {isMarket && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>Market</span>
              </button>
            </div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral",
                isMarket && "bg-neutral-soft cursor-not-allowed"
              )}
              placeholder="0.00"
              disabled={isMarket}
            />
          </div>

          <button
            className={cn(
              "w-full py-2 px-4 rounded-lg text-white font-medium transition-colors",
              activeTab === "buy"
                ? "bg-bid hover:bg-bid-dark"
                : "bg-ask hover:bg-ask-dark"
            )}
          >
            {activeTab === "buy" ? "Buy" : "Sell"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeForm;
