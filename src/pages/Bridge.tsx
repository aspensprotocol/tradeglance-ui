
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

const Bridge = () => {
  const [amount, setAmount] = useState("0");
  const [fromNetwork, setFromNetwork] = useState("ethereum");
  const [toNetwork, setToNetwork] = useState("arbitrum");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("ETH");

  const handleMaxClick = () => {
    setAmount("1000"); // Placeholder max amount
  };

  const handleSwapNetworks = () => {
    const tempNetwork = fromNetwork;
    setFromNetwork(toNetwork);
    setToNetwork(tempNetwork);
  };

  return (
    <div className="min-h-screen bg-neutral-soft/30 relative pb-12">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/portfolio" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Portfolio
            </Link>
            <Link to="/trade" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Trade
            </Link>
            <Link to="/bridge" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Bridge
            </Link>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white bg-[#f8fcf4]"
            >
              Wallet 1
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-2 border-[#7E69AB] text-[#7E69AB] hover:bg-[#7E69AB] hover:text-white bg-[#fff5f6]"
            >
              Wallet 2
            </Button>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-white">Bridge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Send Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Send</span>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-16"
                    />
                    <Button
                      onClick={handleMaxClick}
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 h-6"
                    >
                      MAX
                    </Button>
                  </div>
                  
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="ETH" className="text-white hover:bg-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          ETH
                        </div>
                      </SelectItem>
                      <SelectItem value="USDT" className="text-white hover:bg-gray-600">USDT</SelectItem>
                      <SelectItem value="BTC" className="text-white hover:bg-gray-600">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* From Network */}
              <div className="space-y-2">
                <span className="text-sm text-gray-400">From</span>
                <Select value={fromNetwork} onValueChange={setFromNetwork}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="ethereum" className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        Ethereum Mainnet
                      </div>
                    </SelectItem>
                    <SelectItem value="arbitrum" className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                        Arbitrum One
                      </div>
                    </SelectItem>
                    <SelectItem value="polygon" className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        Polygon
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSwapNetworks}
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-gray-600 hover:bg-gray-700 p-2"
                >
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </Button>
              </div>

              {/* To Network */}
              <div className="space-y-2">
                <span className="text-sm text-gray-400">To</span>
                <div className="flex gap-2">
                  <Select value={toNetwork} onValueChange={setToNetwork}>
                    <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="arbitrum" className="text-white hover:bg-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                          Arbitrum One
                        </div>
                      </SelectItem>
                      <SelectItem value="ethereum" className="text-white hover:bg-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          Ethereum Mainnet
                        </div>
                      </SelectItem>
                      <SelectItem value="polygon" className="text-white hover:bg-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          Polygon
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="ETH" className="text-white hover:bg-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          ETH
                        </div>
                      </SelectItem>
                      <SelectItem value="USDT" className="text-white hover:bg-gray-600">USDT</SelectItem>
                      <SelectItem value="BTC" className="text-white hover:bg-gray-600">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Connect Wallet Button */}
              <Button className="w-full bg-transparent border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-gray-900 font-medium py-3">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 text-xs">
        <div className="container mx-auto flex justify-between items-center">
          <div className="ml-2 flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-[#0FA0CE] text-white hover:bg-[#1EAEDB] border-none text-xs px-3 py-1 h-auto"
            >
              online
            </Button>
            <span className="text-gray-400 text-xs">version 1.0.0</span>
          </div>
          <div className="flex gap-6 text-[#8E9196]">
            <a href="#" className="hover:text-[#1EAEDB]">Terms</a>
            <a href="#" className="hover:text-[#1EAEDB]">Privacy</a>
            <a href="#" className="hover:text-[#1EAEDB]">Support</a>
            <a href="#" className="hover:text-[#1EAEDB]">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Bridge;
