import { Link } from "react-router-dom";
import { WalletButton } from "./WalletButton";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useChainNetwork } from "@/hooks/useChainNetwork";

interface NavigationProps {
  className?: string;
}

export const Navigation = ({ className = "" }: NavigationProps) => {
  const { currentChainId, isSupported } = useChainMonitor();
  const { getChainNetwork } = useChainNetwork();

  return (
    <div className={`flex justify-between items-center ${className}`}>
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
  );
}; 