import { Link } from "react-router-dom";
import { WalletButton } from "@/components/WalletButton";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useConfig } from "@/hooks/useConfig";

const Docs = () => {
  const { currentChainId, isSupported } = useChainMonitor();
  const { config } = useConfig();

  // Helper to get the chain network from config by chainId
  const getChainNetwork = (chainId: number | null) => {
    if (!config || !chainId) return null;
    const chain = config.chains?.find((c: any) => c.chainId === chainId || c.chain_id === chainId);
    return chain ? chain.network || chain.canonicalName || null : null;
  };

  return (
    <div className="min-h-screen bg-neutral-soft/30 relative pb-12">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/trade" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Trade
            </Link>
            <Link to="/bridge" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Bridge
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

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs; 