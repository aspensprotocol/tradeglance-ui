import { useState, useEffect, useCallback } from "react";
import { useConfig } from "./useConfig";
import { configUtils } from "../lib/config-utils";
import { Chain } from "../protos/gen/arborter_config_pb";

// MetaMask Chain Permissions Update (November 2024):
// - wallet_switchEthereumChain and wallet_addEthereumChain are deprecated
// - Users must manually switch chains in MetaMask
// - This hook now only monitors chain state, doesn't attempt to switch chains
console.log(
  "MetaMask Chain Permissions: useChainMonitor hook initialized - no automatic chain switching",
);

export const useChainMonitor = (): {
  currentChainId: number | null;
  isSupported: boolean;
  supportedChains: Chain[];
  getCurrentChainId: () => Promise<number>;
  handleChainChanged: (chainId: string) => void;
} => {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [supportedChains, setSupportedChains] = useState<Chain[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { config } = useConfig();

  // Initialize with clean state when no MetaMask
  useEffect(() => {
    if (!window.ethereum) {
      setCurrentChainId(null);
      setIsSupported(false);
      setSupportedChains([]);
      setIsInitialized(true);
    }
  }, []);

  const getCurrentChainId = async (): Promise<number> => {
    if (!window.ethereum) throw new Error("No ethereum provider found");

    const chainId: string = await window.ethereum.request({
      method: "eth_chainId",
    });
    const chainIdNumber: number = parseInt(chainId, 16);
    return chainIdNumber;
  };

  const checkChainSupport = useCallback(
    async (chainId: number): Promise<void> => {
      if (!config || !chainId || chainId <= 0) return;

      const tradeContractAddress: string | null =
        configUtils.getTradeContractAddress(chainId);
      const chainConfig: Chain | null = configUtils.getChainByChainId(chainId);
      const supported: boolean = !!tradeContractAddress;

      setCurrentChainId(chainId);
      setIsSupported(supported);

      console.log("Chain support check:", {
        chainId,
        supported,
        tradeContractAddress,
        chainConfig: chainConfig
          ? { network: chainConfig.network, chainId: chainConfig.chainId }
          : null,
      });
    },
    [config],
  );

  const updateSupportedChains = useCallback((): void => {
    if (!config) {
      setSupportedChains([]);
      return;
    }

    const allChains: Chain[] = configUtils.getAllChains();
    setSupportedChains(allChains);

    console.log(
      "Supported chains updated:",
      allChains.map((chain: Chain) => ({
        network: chain.network,
        chainId: chain.chainId,
        baseOrQuote: chain.baseOrQuote,
      })),
    );
  }, [config]);

  // Initialize chain monitoring
  useEffect(() => {
    if (isInitialized) return; // Prevent multiple initializations

    const initializeChainMonitoring = async (): Promise<void> => {
      if (!window.ethereum) {
        console.warn("No ethereum provider found");
        setCurrentChainId(null);
        setIsSupported(false);
        setIsInitialized(true);
        return;
      }

      try {
        // Check if MetaMask is connected by trying to get accounts
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length === 0) {
          console.log("MetaMask not connected - no accounts found");
          setCurrentChainId(null);
          setIsSupported(false);
          setIsInitialized(true);
          return;
        }

        // Only try to get chain ID if MetaMask is connected
        const chainId: number = await getCurrentChainId();
        await checkChainSupport(chainId);
        updateSupportedChains();
        setIsInitialized(true);
      } catch (error) {
        console.log("MetaMask not connected or error getting chain ID:", error);
        setCurrentChainId(null);
        setIsSupported(false);
        setIsInitialized(true);
      }
    };

    initializeChainMonitoring();
  }, [checkChainSupport, updateSupportedChains, isInitialized]);

  // Update when config changes
  useEffect(() => {
    // Only update chain support if we have a valid chain ID and config
    if (currentChainId && currentChainId > 0 && config) {
      checkChainSupport(currentChainId);
    }
    // Always update supported chains when config changes
    updateSupportedChains();
  }, [config, currentChainId, checkChainSupport, updateSupportedChains]);

  // Listen for chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainId: string): void => {
      const chainIdNumber: number = parseInt(chainId, 16);
      console.log("Chain changed to:", chainIdNumber);
      checkChainSupport(chainIdNumber);
    };

    const handleAccountsChanged = (accounts: string[]): void => {
      if (accounts.length === 0) {
        console.log("No accounts found, user disconnected");
        setCurrentChainId(null);
        setIsSupported(false);
      }
    };

    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [checkChainSupport]);

  return {
    currentChainId,
    isSupported,
    supportedChains,
    getCurrentChainId,
    handleChainChanged: (chainId: string): void => {
      const chainIdNumber: number = parseInt(chainId, 16);
      checkChainSupport(chainIdNumber);
    },
  };
};
