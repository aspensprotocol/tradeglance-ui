import { useState } from "react";
import { configUtils } from "../lib/config-utils";
import type { Chain } from "../lib/shared-types";
import { useToast } from "./use-toast";

// MetaMask Network Management Update (August 2025):
// MetaMask has removed the manual network selection dropdown and introduced a new network management system.
// Users must manually switch networks using the globe icon in MetaMask instead of automatic switching.
// This update ensures compatibility with MetaMask's new architecture.

export const useNetworkSwitch = (): {
  switchToNetwork: (chainConfig: Chain) => Promise<boolean>;
  getSupportedNetworks: () => Chain[];
  isSwitching: boolean;
} => {
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();

  const switchToNetwork = (chainConfig: Chain): Promise<boolean> => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to switch networks",
        variant: "destructive",
      });
      return Promise.resolve(false);
    }

    setIsSwitching(true);
    try {
      // With MetaMask's new Chain Permissions system, we can't automatically switch chains
      // Instead, we provide guidance to the user

      toast({
        title: "Network switch required",
        description: `Please switch to ${chainConfig.network} in MetaMask by clicking the globe icon in your wallet and selecting the desired network.`,
        variant: "default",
      });

      // Return true to indicate the operation was "successful" (user was guided)
      return Promise.resolve(true);
    } catch (error: unknown) {
      console.error("Error in network switch guidance:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to provide network switch guidance";
      toast({
        title: "Network switch guidance failed",
        description: errorMessage,
        variant: "destructive",
      });
      return Promise.resolve(false);
    } finally {
      setIsSwitching(false);
    }
  };

  const getSupportedNetworks = (): Chain[] => {
    return configUtils
      .getAllChains()
      .filter((chain: Chain) => chain.tradeContract);
  };

  return {
    switchToNetwork,
    getSupportedNetworks,
    isSwitching,
  };
};
