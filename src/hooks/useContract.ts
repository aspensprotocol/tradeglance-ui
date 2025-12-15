import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits, getAddress } from "viem";
import { configUtils } from "../lib/config-utils";
import MidribV2ABI from "../lib/abi/MidribV2.json";
import { createPublicClient, http } from "viem";
import { useToast } from "./use-toast";

export const useContract = (): {
  isConnected: boolean;
  account: string | undefined;
  deposit: (
    amount: string,
    token: string,
    targetChainId: number,
  ) => Promise<`0x${string}`>;
  withdraw: (
    amount: string,
    token: string,
    targetChainId: number,
  ) => Promise<`0x${string}`>;
  isLoading: boolean;
  isConfirming: boolean;
  error: string | null;
  isWalletClientReady: boolean;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  // Fallback: if wagmi's walletClient isn't ready but we're connected,
  // consider it ready anyway (we'll use window.ethereum directly if needed)
  const isWalletClientReady = isConnected && address && (!!walletClient || typeof window.ethereum !== 'undefined');

  // Helper function to create a custom public client with the correct RPC URL
  const createCustomPublicClient = (
    rpcUrl: string,
  ): ReturnType<typeof createPublicClient> => {
    return createPublicClient({ transport: http(rpcUrl) });
  };

  // Get current chain ID directly from MetaMask (same as useChainMonitor)
  const getCurrentChainId = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const chainIdNumber = parseInt(chainId, 16);
        setCurrentChainId(chainIdNumber);
      } catch (err) {
        console.error("useContract: Error getting chain ID:", err);
        setCurrentChainId(null);
      }
    }
  };

  // Listen for chain changes
  const handleChainChanged = (chainId: string): void => {
    const chainIdNumber = parseInt(chainId, 16);
    setCurrentChainId(chainIdNumber);
  };

  useEffect(() => {
    getCurrentChainId();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Helper function to get the correct chain based on chain ID from config
  const getChainById = (
    id: number,
  ): {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      decimals: number;
      name: string;
      symbol: string;
    };
    rpcUrls: {
      default: { http: string[] };
      public: { http: string[] };
    };
    blockExplorers?: {
      default: { name: string; url: string };
    };
  } => {
    // Get chain config from gRPC config
    const chainConfig = configUtils.getChainByChainId(id);
    if (chainConfig) {
      interface ChainObject {
        id: number;
        name: string;
        network: string;
        nativeCurrency: {
          decimals: number;
          name: string;
          symbol: string;
        };
        rpcUrls: {
          default: { http: string[] };
          public: { http: string[] };
        };
        blockExplorers?: {
          default: { name: string; url: string };
        };
      }

      const chainObj: ChainObject = {
        id:
          typeof chainConfig.chainId === "string"
            ? parseInt(chainConfig.chainId, 10)
            : chainConfig.chainId,
        name: chainConfig.network,
        network: chainConfig.network,
        nativeCurrency: {
          decimals: 18,
          name: "Ether",
          symbol: "ETH",
        },
        rpcUrls: {
          default: { http: [chainConfig.rpcUrl] },
          public: { http: [chainConfig.rpcUrl] },
        },
      };

      // Add block explorer if available
      if (chainConfig.explorerUrl) {
        chainObj.blockExplorers = {
          default: { name: "Explorer", url: chainConfig.explorerUrl },
        };
      }

      return chainObj;
    }

    // If no chain config found, throw an error
    throw new Error(
      `Chain configuration not found for chain ID ${id}. Please ensure the chain is configured in the backend.`,
    );
  };

  useEffect(() => {
    if (isConnected && address) {
      // Contract operations are handled dynamically based on config
      // No need to create a static contract instance
      // setContract({ isConnected: true }); // This state is removed, so this line is removed
    } else {
      // setContract(null); // This state is removed, so this line is removed
    }
  }, [isConnected, address]);

  // Helper function to check if a token contract supports approve
  const checkTokenApprovalSupport = async (
    tokenAddress: string,
    chainId: number,
  ): Promise<boolean> => {
    try {
      const chainConfig = configUtils.getChainByChainId(chainId);
      if (!chainConfig) {
        return false;
      }

      const tradeContractAddress = configUtils.getTradeContractAddress(chainId);
      if (!tradeContractAddress) {
        return false;
      }

      // Create custom public client with the correct RPC URL
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      // Try to read the allowance to see if the contract responds
      await customPublicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "allowance",
        args: [address as `0x${string}`, tradeContractAddress as `0x${string}`],
      });

      return true;
    } catch {
      return false;
    }
  };

  const deposit = async (
    amount: string,
    token: string,
    targetChainId: number,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      // Use wagmi's walletClient if available, otherwise create one from window.ethereum
      let activeWalletClient = walletClient;
      if (!activeWalletClient && typeof window.ethereum !== 'undefined') {
        // Create wallet client from window.ethereum as fallback
        const { createWalletClient, custom } = await import('viem');
        activeWalletClient = createWalletClient({
          account: address as `0x${string}`,
          transport: custom(window.ethereum),
        });
      }

      if (!activeWalletClient) {
        throw new Error("Wallet client not available");
      }

      const tradeContractAddress =
        configUtils.getTradeContractAddress(targetChainId);
      if (!tradeContractAddress) {
        throw new Error(
          `No trade contract found for chain ID ${targetChainId}`,
        );
      }

      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      const tokenSymbol = Object.keys(chainConfig?.tokens || {}).find(
        (symbol) =>
          getAddress(chainConfig?.tokens[symbol].address) === getAddress(token),
      );
      const decimals = tokenSymbol
        ? chainConfig?.tokens[tokenSymbol].decimals
        : 18;

      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals || 18);

      // Check if wallet is on the correct chain and switch if needed
      if (currentChainId !== targetChainId) {
        try {
          const targetChainConfig =
            configUtils.getChainByChainId(targetChainId);
          if (!targetChainConfig) {
            throw new Error(
              `Chain configuration not found for chain ID ${targetChainId}`,
            );
          }

          toast({
            title: "Switching network",
            description: `Switching to ${targetChainConfig.network}...`,
          });

          // Use MetaMask's built-in network switching (same as minting page)
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });

          // Wait a bit for the switch to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Update current chain ID after successful switch
          setCurrentChainId(targetChainId);
        } catch (switchError: unknown) {
          const errorMessage =
            switchError instanceof Error
              ? switchError.message
              : "Failed to switch network";
          throw new Error(
            `Failed to switch to the required network: ${errorMessage}. Please try switching manually in MetaMask.`,
          );
        }
      }

      // Check if the token contract supports approval
      const supportsApproval = await checkTokenApprovalSupport(
        token,
        targetChainId,
      );

      if (supportsApproval) {
        // First, approve the contract to spend our tokens
        const tokenContract = {
          address: token as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              name: "approve",
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
        };

        await activeWalletClient.writeContract({
          address: token as `0x${string}`,
          abi: tokenContract.abi,
          functionName: "approve",
          args: [tradeContractAddress, amountWei],
          account: address as `0x${string}`,
          chain: getChainById(targetChainId),
        });

        // Wait a moment for the approval to be processed
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Now attempt the deposit
      const hash = await activeWalletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi,
        functionName: "deposit",
        args: [token, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
      });

      // Wait for transaction confirmation using custom public client
      setIsConfirming(true);
      if (!chainConfig) throw new Error("Chain configuration not found");
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      const receipt = await customPublicClient.waitForTransactionReceipt({
        hash,
        timeout: 30000, // 30 second timeout
        confirmations: 1, // Only wait for 1 confirmation
      });

      setIsConfirming(false);

      // Check if transaction was successful
      if (receipt.status === "reverted") {
        throw new Error("Transaction was reverted on the blockchain");
      }

      // Additional check: if the transaction has no logs, it might have failed
      if (receipt.logs && receipt.logs.length === 0) {
        console.warn("Transaction has no logs, which might indicate a failure");
      }

      return hash;
    } catch (err: unknown) {
      console.error("Deposit failed:", err);

      // Provide more helpful error messages
      let errorMessage = "Deposit failed";

      if (err instanceof Error) {
        if (err.message?.includes("Internal JSON-RPC error")) {
          errorMessage =
            "RPC connection error. Please check your network connection and try again.";
        } else if (err.message?.includes("approve")) {
          errorMessage =
            "Token approval failed. The token contract may not support standard ERC20 approval.";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage =
            "Insufficient funds for transaction. Please check your balance.";
        } else if (err.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (
    amount: string,
    token: string,
    targetChainId: number,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      // Use wagmi's walletClient if available, otherwise create one from window.ethereum
      let activeWalletClient = walletClient;
      if (!activeWalletClient && typeof window.ethereum !== 'undefined') {
        // Create wallet client from window.ethereum as fallback
        const { createWalletClient, custom } = await import('viem');
        activeWalletClient = createWalletClient({
          account: address as `0x${string}`,
          transport: custom(window.ethereum),
        });
      }

      if (!activeWalletClient) {
        throw new Error("Wallet client not available");
      }

      const tradeContractAddress =
        configUtils.getTradeContractAddress(targetChainId);
      if (!tradeContractAddress) {
        throw new Error(
          `No trade contract found for chain ID ${targetChainId}`,
        );
      }

      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      const tokenSymbol = Object.keys(chainConfig?.tokens || {}).find(
        (symbol) =>
          getAddress(chainConfig?.tokens[symbol].address) === getAddress(token),
      );
      const decimals = tokenSymbol
        ? chainConfig?.tokens[tokenSymbol].decimals
        : 18;

      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals || 18);

      // Check if wallet is on the correct chain and switch if needed
      if (currentChainId !== targetChainId) {
        try {
          const targetChainConfig =
            configUtils.getChainByChainId(targetChainId);
          if (!targetChainConfig) {
            throw new Error(
              `Chain configuration not found for chain ID ${targetChainId}`,
            );
          }

          toast({
            title: "Switching network",
            description: `Switching to ${targetChainConfig.network}...`,
          });

          // Use MetaMask's built-in network switching (same as minting page)
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });

          // Wait a bit for the switch to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Update current chain ID after successful switch
          setCurrentChainId(targetChainId);
        } catch (switchError: unknown) {
          const errorMessage =
            switchError instanceof Error
              ? switchError.message
              : "Failed to switch network";
          throw new Error(
            `Failed to switch to the required network: ${errorMessage}. Please try switching manually in MetaMask.`,
          );
        }
      }

      // Attempt the withdrawal
      const hash = await activeWalletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi,
        functionName: "withdraw",
        args: [token, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
      });

      // Wait for transaction confirmation using custom public client
      setIsConfirming(true);
      if (!chainConfig) throw new Error("Chain configuration not found");
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      const receipt = await customPublicClient.waitForTransactionReceipt({
        hash,
        timeout: 30000, // 30 second timeout
        confirmations: 1, // Only wait for 1 confirmation
      });

      setIsConfirming(false);

      // Check if transaction was successful
      if (receipt.status === "reverted") {
        throw new Error("Transaction was reverted on the blockchain");
      }

      // Additional check: if the transaction has no logs, it might have failed
      if (receipt.logs && receipt.logs.length === 0) {
        console.warn("Transaction has no logs, which might indicate a failure");
      }

      return hash;
    } catch (err: unknown) {
      console.error("Withdrawal failed:", err);

      // Provide more helpful error messages
      let errorMessage = "Withdrawal failed";

      if (err instanceof Error) {
        if (err.message?.includes("Internal JSON-RPC error")) {
          errorMessage =
            "RPC connection error. Please check your network connection and try again.";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage =
            "Insufficient funds for withdrawal. Please check your balance.";
        } else if (err.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // contract, // This state is removed, so this line is removed
    isConnected,
    account: address,
    deposit,
    withdraw,
    isLoading,
    isConfirming,
    error,
    isWalletClientReady,
  };
};
