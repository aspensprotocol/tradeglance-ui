import { useState, useEffect } from 'react';
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { configUtils } from "@/lib/config-utils";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { useToast } from "@/hooks/use-toast";
import { BaseOrQuote } from '@/protos/gen/arborter_config_pb';

export interface NetworkState {
  senderNetwork: string;
  receiverNetwork: string;
}

export const useNetworkManagement = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    senderNetwork: "",
    receiverNetwork: ""
  });

  const { currentChainId } = useChainMonitor();
  const { switchToNetwork } = useNetworkSwitch();
  const { toast } = useToast();

  // Auto-detect and fill network parameters based on current chain and available chains
  useEffect(() => {
    if (currentChainId) {
      // Get current chain info
      const currentChain = configUtils.getChainByChainId(currentChainId);
      
      if (currentChain) {
        // Set sender network to current network
        const newSenderNetwork = currentChain.network;
        
        // Get all available chains for receiver network options
        const allChains = configUtils.getAllChains();
        const otherChains = allChains.filter(chain => chain.chainId !== currentChainId);
        
        // Set receiver network to the first available other chain, or current if no others
        const newReceiverNetwork = otherChains.length > 0 ? otherChains[0].network : currentChain.network;
        
        setNetworkState({
          senderNetwork: newSenderNetwork,
          receiverNetwork: newReceiverNetwork
        });
        
        console.log('NetworkManagement: Auto-detected networks:', {
          currentChainId,
          currentNetwork: currentChain.network,
          senderNetwork: newSenderNetwork,
          receiverNetwork: newReceiverNetwork,
          availableChains: allChains.map(c => ({ chainId: c.chainId, network: c.network }))
        });
      }
    }
  }, [currentChainId]);

  const handleSenderNetworkChange = async (newNetwork: string) => {
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

      // Switch MetaMask to the new network
      const chainId = typeof newChainConfig.chainId === 'string' ? parseInt(newChainConfig.chainId, 10) : newChainConfig.chainId;
      const success = await switchToNetwork(newChainConfig);
      
      if (!success) {
        toast({
          title: "Network switch failed",
          description: "Failed to switch to the selected network",
          variant: "destructive",
        });
        return;
      }

      // Update sender network
      setNetworkState(prev => ({ ...prev, senderNetwork: newNetwork }));

      // Auto-update receiver network to a different network
      const allChains = configUtils.getAllChains();
      const otherChains = allChains.filter(chain => chain.network !== newNetwork);
      
      if (otherChains.length > 0) {
        setNetworkState(prev => ({ ...prev, receiverNetwork: otherChains[0].network }));
      }

      console.log('Network switched:', {
        newSenderNetwork: newNetwork,
        newReceiverNetwork: otherChains.length > 0 ? otherChains[0].network : 'none',
        chainId
      });

    } catch (error: unknown) {
      console.error('Error switching network:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to switch network in MetaMask";
      toast({
        title: "Network switch failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReceiverNetworkChange = (newNetwork: string) => {
    // Prevent setting receiver network to the same as sender network
    if (newNetwork === networkState.senderNetwork) {
      toast({
        title: "Invalid network selection",
        description: "Receiver network cannot be the same as sender network",
        variant: "destructive",
      });
      return;
    }

    setNetworkState(prev => ({ ...prev, receiverNetwork: newNetwork }));
  };

  const swapNetworks = async () => {
    // Store current values before swapping
    const oldSenderNetwork = networkState.senderNetwork;
    const oldReceiverNetwork = networkState.receiverNetwork;

    // Swap the networks
    setNetworkState({
      senderNetwork: oldReceiverNetwork,
      receiverNetwork: oldSenderNetwork
    });

    // Switch MetaMask to the new sender network (which was the old receiver network)
    try {
      const newSenderChainConfig = configUtils.getChainByNetwork(oldReceiverNetwork);
      if (newSenderChainConfig) {
        const success = await switchToNetwork(newSenderChainConfig);
        
        if (!success) {
          toast({
            title: "Network switch failed",
            description: "Failed to switch to the new sender network",
            variant: "destructive",
          });
          // Revert the swap if network switch fails
          setNetworkState({
            senderNetwork: oldSenderNetwork,
            receiverNetwork: oldReceiverNetwork
          });
        }
      }
    } catch (error: unknown) {
      console.error('Error switching network during swap:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to switch network during swap";
      toast({
        title: "Network switch failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Revert the swap on error
      setNetworkState({
        senderNetwork: oldSenderNetwork,
        receiverNetwork: oldReceiverNetwork
      });
    }
  };

  const validateNetworks = (): { isValid: boolean; errorMessage?: string } => {
    if (networkState.senderNetwork === networkState.receiverNetwork) {
      return {
        isValid: false,
        errorMessage: "Sender and receiver networks must be different for bridging."
      };
    }
    return { isValid: true };
  };

  const getCurrentChainConfig = () => {
    return currentChainId ? configUtils.getChainByChainId(currentChainId) : null;
  };

  const getAllChains = () => {
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
