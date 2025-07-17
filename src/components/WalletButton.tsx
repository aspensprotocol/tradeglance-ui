import { Button } from "@/components/ui/button";
import { useMetaMask } from "@/hooks/useMetaMask";
import { Wallet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletButtonProps {
  walletNumber: 1 | 2;
  className?: string;
}

const WalletButton = ({ walletNumber, className }: WalletButtonProps) => {
  const { isConnected, account, isInstalled, isConnecting, error, connect, disconnect, formatAddress } = useMetaMask();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const getButtonText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected && account) return formatAddress(account);
    if (!isInstalled) return "Install MetaMask";
    return `Wallet ${walletNumber}`;
  };

  const getButtonColor = () => {
    if (walletNumber === 1) {
      return "border-2 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white bg-[#f8fcf4]";
    } else {
      return "border-2 border-[#7E69AB] text-[#7E69AB] hover:bg-[#7E69AB] hover:text-white bg-[#fff5f6]";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isConnecting || !isInstalled}
        className={cn(
          "rounded-full flex items-center gap-2",
          getButtonColor(),
          isConnected && "bg-green-50 border-green-500 text-green-700 hover:bg-green-500 hover:text-white",
          !isInstalled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {!isInstalled ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {getButtonText()}
      </Button>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletButton;