import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowUpDown, Settings, History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";

const attestationData = {
  "tee_tcb_svn": "06010300000000000000000000000000",
  "mr_seam": "5b38e33a6487958b72c3c12a938eaa5e3fd4510c51aeeab58c7d5ecee41d7c436489d6c8e4f92f160b7cad34207b00c1",
  "mr_signer_seam": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "seam_attributes": "0000000000000000",
  "td_attributes": "0000001000000000",
  "xfam": "e702060000000000",
  "mr_td": "c68518a0ebb42136c12b2275164f8c72f25fa9a34392228687ed6e9caeb9c0f1dbd895e9cf475121c029dc47e70e91fd",
  "mr_config_id": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "mr_owner": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "mr_owner_config": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "rt_mr0": "85e0855a6384fa1c8a6ab36d0dcbfaa11a5753e5a070c08218ae5fe872fcb86967fd2449c29e22e59dc9fec998cb6547",
  "rt_mr1": "9b43f9f34a64bc7191352585be0da1774a1499e698ba77cbf6184547d53d1770d6524c1cfa00b86352f273fc272a8cfe",
  "rt_mr2": "7cc2dadd5849bad220ab122c4fbf25a74dc91cc12702447d3b5cac0f49b2b139994f5cd936b293e5f0f14dea4262d668",
  "rt_mr3": "2c482b5b34f6902293bc203696f407241bfa319d2410a04c604d1021888d6028bf4bd280ff859ee270a0429aac5f0d82",
  "report_data": "afab9790acb13c4c651c1933a22b5f0663ef22927120dd08cc8291d7e0912d8b1c36eb75cf661a64735042f8e81bbe42cb9ab310ca95bf8d36c44cb8835c901f"
};

const Bridge = () => {
  const [senderAmount, setSenderAmount] = useState("0");
  const [receiverAmount, setReceiverAmount] = useState("0.00");
  const [senderToken, setSenderToken] = useState("ETH");
  const [senderNetwork, setSenderNetwork] = useState("ethereum");
  const [receiverToken, setReceiverToken] = useState("1FLR");
  const [receiverNetwork, setReceiverNetwork] = useState("polygon");

  const handleMaxClick = () => {
    setSenderAmount("1000"); // Placeholder max amount
  };

  const handleSwapTokens = () => {
    const tempToken = senderToken;
    const tempNetwork = senderNetwork;
    setSenderToken(receiverToken);
    setSenderNetwork(receiverNetwork);
    setReceiverToken(tempToken);
    setReceiverNetwork(tempNetwork);
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
            <WalletButton />
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="bg-gray-900 text-white border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-medium text-white">Swap</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-blue-400 hover:bg-gray-800">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-blue-400 hover:bg-gray-800">
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-1">
              {/* Sender Section */}
              <div className="space-y-3 bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Sender: ...</span>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 min-w-0">
                    <span className="text-xs text-gray-400">Token</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">E</span>
                      </div>
                      <Select value={senderToken} onValueChange={setSenderToken}>
                        <SelectTrigger className="w-20 bg-transparent border-none text-white p-0 h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="ETH" className="text-white hover:bg-gray-600">ETH</SelectItem>
                          <SelectItem value="USDT" className="text-white hover:bg-gray-600">USDT</SelectItem>
                          <SelectItem value="BTC" className="text-white hover:bg-gray-600">BTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="w-px bg-gray-700 mx-1"></div>
                  
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-xs text-gray-400">Network</span>
                    <Select value={senderNetwork} onValueChange={setSenderNetwork}>
                      <SelectTrigger className="bg-transparent border-none text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="ethereum" className="text-white hover:bg-gray-600">Ethereum</SelectItem>
                        <SelectItem value="polygon" className="text-white hover:bg-gray-600">Polygon</SelectItem>
                        <SelectItem value="arbitrum" className="text-white hover:bg-gray-600">Arbitrum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={senderAmount}
                    onChange={(e) => setSenderAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent border-none text-2xl font-medium text-white p-0 h-auto focus:ring-0 focus-visible:ring-0"
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">$0.00</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Balance: ---</span>
                    <Button
                      onClick={handleMaxClick}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-400 hover:text-blue-300 h-auto p-1 bg-blue-500/20 rounded"
                    >
                      Max
                    </Button>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center py-2">
                <Button
                  onClick={handleSwapTokens}
                  variant="ghost"
                  size="sm"
                  className="rounded-lg border border-blue-500 bg-blue-500/20 hover:bg-blue-500/30 p-2"
                >
                  <ArrowUpDown className="h-4 w-4 text-blue-400" />
                </Button>
              </div>

              {/* Receiver Section */}
              <div className="space-y-3 bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Receiver: ...</span>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 min-w-0">
                    <span className="text-xs text-gray-400">Token</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">1F</span>
                      </div>
                      <Select value={receiverToken} onValueChange={setReceiverToken}>
                        <SelectTrigger className="w-20 bg-transparent border-none text-white p-0 h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="1FLR" className="text-white hover:bg-gray-600">1FLR</SelectItem>
                          <SelectItem value="USDT" className="text-white hover:bg-gray-600">USDT</SelectItem>
                          <SelectItem value="BTC" className="text-white hover:bg-gray-600">BTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="w-px bg-gray-700 mx-1"></div>
                  
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-xs text-gray-400">Network</span>
                    <Select value={receiverNetwork} onValueChange={setReceiverNetwork}>
                      <SelectTrigger className="bg-transparent border-none text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="polygon" className="text-white hover:bg-gray-600">Polygon</SelectItem>
                        <SelectItem value="ethereum" className="text-white hover:bg-gray-600">Ethereum</SelectItem>
                        <SelectItem value="arbitrum" className="text-white hover:bg-gray-600">Arbitrum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl font-medium text-blue-400">{receiverAmount}</span>
                </div>
                
                <div className="text-sm text-gray-500">$0.00</div>
              </div>

              {/* Fee Section */}
              <div className="bg-gray-800 rounded-lg p-3">
                <Select>
                  <SelectTrigger className="bg-transparent border-none text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                      <span>Fee: 0 ETH</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="standard" className="text-white hover:bg-gray-600">Standard: 0 ETH</SelectItem>
                    <SelectItem value="fast" className="text-white hover:bg-gray-600">Fast: 0.001 ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Connect Wallet Button */}
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 mt-4">
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
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-gray-400 text-xs hover:text-[#1EAEDB] ml-2">
                  attestation
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Attestation Data</DialogTitle>
                </DialogHeader>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                  <code>{JSON.stringify(attestationData, null, 2)}</code>
                </pre>
              </DialogContent>
            </Dialog>
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
