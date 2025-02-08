
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const tokens = ["BTC", "ETH", "SOL", "AVAX"];

const TradeForm = () => {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [isLimit, setIsLimit] = useState(true);
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    // Assuming max amount is 100 for this example
    setAmount((value[0]).toString());
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Trade</h2>
      </div>

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
          <div>
            <label className="block text-sm font-medium mb-1">Token</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral"
            >
              {tokens.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
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
                marks={[
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
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
                onClick={() => setIsLimit(!isLimit)}
                className="flex items-center space-x-1 text-sm text-neutral hover:text-neutral-dark"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                  isLimit && "bg-neutral border-neutral"
                )}>
                  {isLimit && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>Limit</span>
              </button>
            </div>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-neutral"
              placeholder="0.00"
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
