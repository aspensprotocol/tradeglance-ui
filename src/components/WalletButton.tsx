import React, { useState } from "react";
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
      <section className="flex items-center gap-2">
        <button
          className="text-sm border border-gray-300 rounded px-2 py-1 sm:py-0.5 bg-white/60 text-gray-900 cursor-pointer hover:bg-white/80 transition-colors"
          onClick={handleAddressClick}
          title="Click to deposit/withdraw funds"
          type="button"
        >
          <span className="font-medium">{formatAddress(address)}</span>
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1"
        >
          Disconnect
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
      className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2"
    >
      Connect Wallet
    </Button>
  );
}
