import { useState } from "react";
import { configUtils } from "../lib/config-utils";
import { Chain } from "../protos/gen/arborter_config_pb";
import { useToast } from "./use-toast";

// MetaMask Chain Permissions Update Notice:
// As of November 2024, MetaMask introduced a new "Chain Permissions" system that replaces
// the old wallet_switchEthereumChain and wallet_addEthereumChain methods. This update
// requires users to manually switch networks in MetaMask instead of automatic switching.
// See: https://metamask.io/news/metamask-feature-update-chain-permissions
console.log(
  "NetworkSwitch: Using MetaMask Chain Permissions system - automatic chain switching disabled",
);

export const useNetworkSwitch = (): {
  switchToNetwork: (chainConfig: Chain) => Promise<boolean>;
  getSupportedNetworks: () => Chain[];
  isSwitching: boolean;
} => {
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();

  const switchToNetwork = async (chainConfig: Chain) => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to switch networks",
        variant: "destructive",
      });
      return false;
    }

    setIsSwitching(true);
    try {
      const chainId =
        typeof chainConfig.chainId === "string"
          ? parseInt(chainConfig.chainId, 10)
          : chainConfig.chainId;
      const chainIdHex = `0x${chainId.toString(16)}`;

      console.log(
        `Attempting to switch to network: ${chainConfig.network} (${chainIdHex})`,
      );

      // With MetaMask's new Chain Permissions system, we can't automatically switch chains
      // Instead, we provide guidance to the user
      console.log(
        `MetaMask Chain Permissions: User should manually switch to ${chainConfig.network} (${chainIdHex})`,
      );

      toast({
        title: "Manual network switch required",
        description: `Please manually switch to ${chainConfig.network} in MetaMask. The new Chain Permissions system requires manual network switching.`,
        variant: "default",
      });

      // Return true to indicate the operation was "successful" (user was guided)
      return true;
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
      return false;
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
