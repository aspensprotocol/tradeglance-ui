import { useState } from "react";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { Button } from "./ui/button";
import DepositWithdrawModal from "./DepositWithdrawModal";

export default function WalletButton(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleAddressClick = (): void => {
    setModalOpen(true);
  };

  if (isConnected && address) {
    return (
      <section className="flex items-center gap-3">
        <button
          className="text-sm font-bold border-2 border-transparent rounded-xl px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white cursor-pointer hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transform hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg animate-pulse-glow relative overflow-hidden group"
          onClick={handleAddressClick}
          title="Click to deposit/withdraw funds"
          type="button"
        >
          {/* Floating sparkles */}
          <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
          <span className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-75 delay-700"></span>

          {/* Glowing border effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></span>

          <span className="relative z-10 font-bold tracking-wide">
            💎 {formatAddress(address)}
          </span>
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 border-2 border-transparent bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white hover:from-red-600 hover:via-pink-600 hover:to-rose-600 transform hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg animate-pulse-glow relative overflow-hidden group"
        >
          {/* Floating sparkles */}
          <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>

          {/* Glowing border effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 rounded-lg opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></span>

          <span className="relative z-10 font-bold">🔌 Disconnect</span>
        </Button>

        <DepositWithdrawModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            // No refreshBalance here as it's removed
          }}
        />
      </section>
    );
  }

  // Find MetaMask connector
  const metaMaskConnector = connectors.find(
    (connector) => connector.name === "MetaMask",
  );

  return (
    <Button
      onClick={() => {
        if (metaMaskConnector) {
          connect({ connector: metaMaskConnector });
        } else {
          console.error("MetaMask connector not found");
        }
      }}
      disabled={!metaMaskConnector}
      className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 border-2 border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transform hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg animate-pulse-glow relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Floating sparkles */}
      <span className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-75 delay-300"></span>
      <span className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-75 delay-700"></span>
      <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-75 delay-1000"></span>

      {/* Glowing border effect */}
      <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></span>

      <span className="relative z-10 font-bold tracking-wide">
        🔗 Connect Wallet
      </span>
    </Button>
  );
}
