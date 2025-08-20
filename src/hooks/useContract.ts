import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { configUtils } from "../lib/config-utils";
import MidribV2ABI from "../lib/abi/MidribV2.json";
import { createPublicClient, http } from "viem";

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
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

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
        console.log(
          "useContract: Current chain ID from MetaMask:",
          chainIdNumber,
        );
        setCurrentChainId(chainIdNumber);
      } catch (error) {
        console.error("useContract: Error getting chain ID:", error);
        setCurrentChainId(null);
      }
    }
  };

  // Listen for chain changes
  const handleChainChanged = (chainId: string): void => {
    const chainIdNumber = parseInt(chainId, 16);
    console.log("useContract: Chain changed to:", chainIdNumber);
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
        console.log(
          "checkTokenApprovalSupport: No chain config found for chain",
          chainId,
        );
        return false;
      }

      const tradeContractAddress = configUtils.getTradeContractAddress(chainId);
      if (!tradeContractAddress) {
        console.warn("No trade contract address found for chain", chainId);
        return false;
      }

      console.log("checkTokenApprovalSupport: Testing allowance for:", {
        tokenAddress,
        userAddress: address,
        tradeContractAddress,
        chainId,
        rpcUrl: chainConfig.rpcUrl,
      });

      // Create custom public client with the correct RPC URL
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      // Try to read the allowance to see if the contract responds
      const allowanceResult = await customPublicClient.readContract({
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

      console.log(
        "checkTokenApprovalSupport: Allowance test successful, result:",
        allowanceResult,
      );
      return true;
    } catch (error) {
      console.warn(
        "Token contract does not support standard ERC20 allowance:",
        error,
      );
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
      if (!isConnected || !address || !walletClient) {
        throw new Error("Wallet not connected or wallet client not available");
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
          chainConfig?.tokens[symbol].address.toLowerCase() ===
          token.toLowerCase(),
      );
      const decimals = tokenSymbol
        ? chainConfig?.tokens[tokenSymbol].decimals
        : 18;

      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals || 18);

      console.log(
        `Converting ${amount} with ${decimals} decimals to: ${amountWei}`,
      );
      console.log(
        `Current wallet chain ID: ${currentChainId}, Target chain ID: ${targetChainId}`,
      );

      // Check if wallet is on the correct chain
      if (currentChainId !== targetChainId) {
        throw new Error(
          `Wallet is on chain ${currentChainId} but transaction requires chain ${targetChainId}. Please switch to the correct network.`,
        );
      }

      // Check if the token contract supports approval
      console.log("Checking if token supports approval...");
      const supportsApproval = await checkTokenApprovalSupport(
        token,
        targetChainId,
      );
      console.log("Token approval support result:", supportsApproval);

      if (supportsApproval) {
        // First, approve the contract to spend our tokens
        console.log("Approving token spending...");
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

        const approveHash = await walletClient.writeContract({
          address: token as `0x${string}`,
          abi: tokenContract.abi,
          functionName: "approve",
          args: [tradeContractAddress, amountWei],
          account: address as `0x${string}`,
          chain: getChainById(targetChainId),
        });

        console.log("Approval successful:", approveHash);

        // Wait a moment for the approval to be processed
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log(
          "Token contract does not support standard ERC20 approval, skipping approval step",
        );
      }

      // Now attempt the deposit
      console.log("Attempting deposit with:", {
        contractAddress: tradeContractAddress,
        tokenAddress: token,
        amountWei: amountWei.toString(),
        account: address,
        chain: getChainById(targetChainId),
      });

      const hash = await walletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi,
        functionName: "deposit",
        args: [token, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
      });

      console.log("Deposit transaction submitted:", hash);

      // Wait for transaction confirmation using custom public client
      console.log("Waiting for transaction confirmation...");
      setIsConfirming(true);
      if (!chainConfig) throw new Error("Chain configuration not found");
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      const receipt = await customPublicClient.waitForTransactionReceipt({
        hash,
        timeout: 30000, // 30 second timeout
        confirmations: 1, // Only wait for 1 confirmation
      });

      setIsConfirming(false);
      console.log("Transaction confirmed in block:", receipt.blockNumber);

      // Check if transaction was successful
      if (receipt.status === "reverted") {
        throw new Error("Transaction was reverted on the blockchain");
      }

      // Additional check: if the transaction has no logs, it might have failed
      if (receipt.logs && receipt.logs.length === 0) {
        console.warn("Transaction has no logs, which might indicate a failure");
      }

      console.log("Deposit transaction successful");
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
      if (!isConnected || !address || !walletClient) {
        throw new Error("Wallet not connected or wallet client not available");
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
          chainConfig?.tokens[symbol].address.toLowerCase() ===
          token.toLowerCase(),
      );
      const decimals = tokenSymbol
        ? chainConfig?.tokens[tokenSymbol].decimals
        : 18;

      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals || 18);

      console.log(
        `Converting ${amount} with ${decimals} decimals to: ${amountWei}`,
      );
      console.log(
        `Current wallet chain ID: ${currentChainId}, Target chain ID: ${targetChainId}`,
      );

      // Check if wallet is on the correct chain
      if (currentChainId !== targetChainId) {
        throw new Error(
          `Wallet is on chain ${currentChainId} but transaction requires chain ${targetChainId}. Please switch to the correct network.`,
        );
      }

      // Attempt the withdrawal
      console.log("Attempting withdrawal with:", {
        contractAddress: tradeContractAddress,
        tokenAddress: token,
        amountWei: amountWei.toString(),
        account: address,
        chain: getChainById(targetChainId),
      });

      const hash = await walletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi,
        functionName: "withdraw",
        args: [token, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
      });

      console.log("Withdrawal transaction submitted:", hash);

      // Wait for transaction confirmation using custom public client
      console.log("Waiting for transaction confirmation...");
      setIsConfirming(true);
      if (!chainConfig) throw new Error("Chain configuration not found");
      const customPublicClient = createCustomPublicClient(chainConfig.rpcUrl);

      const receipt = await customPublicClient.waitForTransactionReceipt({
        hash,
        timeout: 30000, // 30 second timeout
        confirmations: 1, // Only wait for 1 confirmation
      });

      setIsConfirming(false);
      console.log("Transaction confirmed in block:", receipt.blockNumber);

      // Check if transaction was successful
      if (receipt.status === "reverted") {
        throw new Error("Transaction was reverted on the blockchain");
      }

      // Additional check: if the transaction has no logs, it might have failed
      if (receipt.logs && receipt.logs.length === 0) {
        console.warn("Transaction has no logs, which might indicate a failure");
      }

      console.log("Withdrawal transaction successful");
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
  };
};
