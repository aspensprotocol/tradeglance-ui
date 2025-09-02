import { useEffect, useState } from "react";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useToast } from "@/hooks/use-toast";
import type { Chain } from "@/protos/gen/arborter_config_pb";

// MetaMask Network Management Update (August 2025):
// - wallet_switchEthereumChain and wallet_addEthereumChain are deprecated
// - Users must manually switch networks using the globe icon in MetaMask
// - This hook now only manages local network state, doesn't attempt to switch chains

export interface NetworkState {
  senderNetwork: string;
  receiverNetwork: string;
}

export const useNetworkManagement = (): {
  networkState: NetworkState;
  currentChainId: number | null;
  handleSenderNetworkChange: (network: string) => void;
  handleReceiverNetworkChange: (network: string) => void;
  swapNetworks: () => void;
  validateNetworks: () => { isValid: boolean; errorMessage?: string };
  getCurrentChainConfig: () => Chain | null;
  getAllChains: () => Chain[];
} => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    senderNetwork: "",
    receiverNetwork: "",
  });
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();

  // Auto-detect and fill network parameters based on current chain and available chains
  useEffect(() => {
    if (hasInitialized) return; // Prevent multiple initializations

    if (
      currentChainId &&
      currentChainId > 0 &&
      configUtils.getAllChains().length > 0
    ) {
      // Only run when we have a valid chain ID and config
      // Get current chain info
      const currentChain = configUtils.getChainByChainId(currentChainId);

      if (currentChain) {
        // Set sender network to current network
        const newSenderNetwork = currentChain.network;

        // Get all available chains for receiver network options
        const allChains = configUtils.getAllChains();
        const otherChains = allChains.filter(
          (chain) => chain.chainId !== currentChainId,
        );

        // Set receiver network to the first available other chain, or current if no others
        const newReceiverNetwork =
          otherChains.length > 0
            ? otherChains[0].network
            : currentChain.network;

        setNetworkState({
          senderNetwork: newSenderNetwork,
          receiverNetwork: newReceiverNetwork,
        });

        setHasInitialized(true);
      }
    }
  }, [currentChainId, hasInitialized]);

  const handleSenderNetworkChange = (newNetwork: string): void => {
    try {
      // Get the chain config for the new network
      const newChainConfig = configUtils.getChainByNetwork(newNetwork);
      if (!newChainConfig) {
        toast({
          title: "Network not found",
          description: "Selected network is not available",
          variant: "destructive",
        });
        return;
      }

      // With MetaMask's new network management system, we don't automatically switch networks
      // Instead, we provide guidance to the user

      // Update sender network
      setNetworkState((prev) => ({ ...prev, senderNetwork: newNetwork }));

      // Auto-update receiver network to a different network
      const allChains = configUtils.getAllChains();
      const otherChains = allChains.filter(
        (chain: Chain) => chain.network !== newNetwork,
      );

      if (otherChains.length > 0) {
        setNetworkState((prev) => ({
          ...prev,
          receiverNetwork: otherChains[0].network,
        }));
      }
    } catch (error: unknown) {
      console.error("Error updating network configuration:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update network configuration";
      toast({
        title: "Network configuration failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReceiverNetworkChange = (newNetwork: string): void => {
    // Prevent setting receiver network to the same as sender network
    if (newNetwork === networkState.senderNetwork) {
      toast({
        title: "Invalid network selection",
        description: "Receiver network cannot be the same as sender network",
        variant: "destructive",
      });
      return;
    }

    setNetworkState((prev) => ({ ...prev, receiverNetwork: newNetwork }));
  };

  const swapNetworks = (): void => {
    // Store current values before swapping
    const oldSenderNetwork = networkState.senderNetwork;
    const oldReceiverNetwork = networkState.receiverNetwork;

    // Swap the networks
    setNetworkState({
      senderNetwork: oldReceiverNetwork,
      receiverNetwork: oldSenderNetwork,
    });

    // With MetaMask's new network management system, we don't automatically switch networks
    // Users need to manually switch networks in MetaMask using the globe icon

    toast({
      title: "Networks swapped",
      description: `Please switch to ${oldReceiverNetwork} in MetaMask using the globe icon to complete the swap`,
      variant: "default",
    });
  };

  const validateNetworks = (): { isValid: boolean; errorMessage?: string } => {
    if (networkState.senderNetwork === networkState.receiverNetwork) {
      return {
        isValid: false,
        errorMessage:
          "Sender and receiver networks must be different for bridging.",
      };
    }
    return { isValid: true };
  };

  const getCurrentChainConfig = (): Chain | null => {
    return currentChainId
      ? configUtils.getChainByChainId(currentChainId)
      : null;
  };

  const getAllChains = (): Chain[] => {
    return configUtils.getAllChains();
  };

  return {
    networkState,
    currentChainId,
    handleSenderNetworkChange,
    handleReceiverNetworkChange,
    swapNetworks,
    validateNetworks,
    getCurrentChainConfig,
    getAllChains,
  };
};
