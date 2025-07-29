import VerticalOrderBook from "@/components/VerticalOrderBook";
import TradeForm from "@/components/TradeForm";
import ActivityPanel from "@/components/ActivityPanel";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { WalletButton } from "@/components/WalletButton";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { useConfig } from "@/hooks/useConfig";
import { Footer } from "@/components/Footer";

const Index = () => {
  // Get dynamic trading pairs from config
  const { tradingPairs, loading: pairsLoading, getTradingPairById } = useTradingPairs();
  
  // Monitor chain changes and log trade contract info
  const { currentChainId, isSupported } = useChainMonitor();
  const { config } = useConfig();

  // Helper to get the chain network from config by chainId
  const getChainNetwork = (chainId: number | null) => {
    if (!config || !chainId) return null;
    const chain = config.chains?.find((c: any) => c.chainId === chainId || c.chain_id === chainId);
    return chain ? chain.network || chain.canonicalName || null : null;
  };

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

  // Log network analysis with chain network
  useEffect(() => {
    if (currentChainId && config) {
      const network = getChainNetwork(currentChainId);
      console.log('Network analysis:', {
        chainId: currentChainId,
        chainNetwork: network,
        isSupported
      });
    }
  }, [currentChainId, config, isSupported]);

  return (
    <div className="h-screen bg-neutral-soft/30 relative overflow-hidden">
      <div className="container h-full flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/pro" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Pro
            </Link>
            <Link to="/simple" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Simple
            </Link>
            <Link to="/docs" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Docs
            </Link>
          </div>
          
          <div className="flex gap-3 items-center">
            {currentChainId && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isSupported 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {isSupported ? '✅' : '❌'} {getChainNetwork(currentChainId) || currentChainId}
              </div>
            )}
            <WalletButton />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1 px-4 pb-16">
          {pairsLoading ? (
            <div className="col-span-4 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trading pairs...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="col-span-2">
                <ActivityPanel tradingPair={currentTradingPair} />
              </div>
              <div className="col-span-1">
                <VerticalOrderBook 
                  tradingPair={currentTradingPair} 
                  selectedPair={selectedPair} 
                  onPairChange={setSelectedPair} 
                  tradingPairs={tradingPairs} 
                />
              </div>
              <div className="col-span-1">
                <TradeForm selectedPair={selectedPair} tradingPair={currentTradingPair} />
              </div>
            </>
          )}
        </div>
      </div>
      <Footer className="absolute bottom-0 left-0 right-0" />
    </div>
  );
};

export default Index;
