import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { Button } from "./ui/button";
import DepositWithdrawModal from "./DepositWithdrawModal";
import { formatAddress } from "@/lib/utils";

export default function WalletButton(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleAddressClick = (): void => {
    setModalOpen(true);
  };

  if (isConnected && address) {
    return (
      <section className="flex items-center gap-3">
        <button
          className="text-sm font-bold border-2 border-transparent rounded-xl px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white cursor-pointer hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 hover:shadow-xl transition-all duration-300 shadow-lg"
          onClick={handleAddressClick}
          title="Click to deposit/withdraw funds"
          type="button"
        >
          💎 {formatAddress(address)}
        </button>

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
      className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 border-2 border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 hover:shadow-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      🔗 Connect Wallet
    </Button>
  );
}
