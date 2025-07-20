import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import TransactionTable from "@/components/TransactionTable";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTradingPairs } from "@/hooks/useTradingPairs";

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

const Index = () => {
  // Get dynamic trading pairs from config
  const { tradingPairs, loading: pairsLoading, getTradingPairById } = useTradingPairs();
  
  // Monitor chain changes and log trade contract info
  const { currentChainId, isSupported } = useChainMonitor();
  
  // Set default selected pair to first available pair, or empty string if none available
  const [selectedPair, setSelectedPair] = useState<string>("");
  
  // Update selected pair when trading pairs load
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0].id);
    }
  }, [tradingPairs, selectedPair]);
  
  // Get the current trading pair object
  const currentTradingPair = getTradingPairById(selectedPair);

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
          
          <div className="flex gap-3 items-center">
            {currentChainId && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isSupported 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {isSupported ? '✅' : '❌'} Chain {currentChainId}
              </div>
            )}
            <WalletButton />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {pairsLoading ? (
            <div className="col-span-4 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trading pairs...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="col-span-2 space-y-6">
                <TransactionTable selectedPair={selectedPair} onPairChange={setSelectedPair} tradingPairs={tradingPairs} />
              </div>
              <div className="col-span-1 space-y-6">
                <VerticalOrderBook />
              </div>
              <div className="col-span-1 space-y-6">
                <TradeForm selectedPair={selectedPair} tradingPair={currentTradingPair} />
              </div>
              <div className="col-span-4">
                <ActivityPanel />
              </div>
            </>
          )}
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

export default Index;
