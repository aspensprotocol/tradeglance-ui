import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { configUtils } from "@/lib/config-utils";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { Layout } from "@/components/Layout";
import { getEtherscanLink } from "@/lib/utils";
import type { Chain } from "@/lib/shared-types";

const Mint = (): JSX.Element => {
  const [isMinting, setIsMinting] = useState(false);
  const { address, isConnected } = useAccount();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();

  const { data: walletClient } = useWalletClient();

  // Helper function to get the correct chain based on chain ID from config
  const getChainById = (
    id: number,
  ): {
    id: number;
    name: string;
    network: string;
    nativeCurrency: { decimals: number; name: string; symbol: string };
    rpcUrls: { default: { http: string[] }; public: { http: string[] } };
    blockExplorers?: { default: { name: string; url: string } };
  } => {
    // Get chain config from gRPC config
    const chainConfig = configUtils.getChainByChainId(id);
    if (chainConfig) {
      const chainObj: {
        id: number;
        name: string;
        network: string;
        nativeCurrency: { decimals: number; name: string; symbol: string };
        rpcUrls: { default: { http: string[] }; public: { http: string[] } };
        blockExplorers?: { default: { name: string; url: string } };
      } = {
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

  const handleMint = async (
    chainId: number,
    tokenAddress: string,
    tokenSymbol: string,
    decimals: number,
  ) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint tokens",
        variant: "destructive",
      });
      return;
    }

    // Switch to the target chain if not already on it
    console.log(
      `🔄 Network switch needed: Current chain ${currentChainId} -> Target chain ${chainId}`,
    );
    if (currentChainId !== chainId) {
      try {
        // Get the chain config for the target chain
        const chainConfig: Chain | null =
          configUtils.getChainByChainId(chainId);
        if (!chainConfig) {
          toast({
            title: "Chain not supported",
            description: `Chain ID ${chainId} is not configured in the backend`,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Switching network",
          description: `Switching to ${chainConfig.network}...`,
        });

        // Use MetaMask's built-in network switching with enhanced error handling
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          // If the chain is not added to MetaMask (error code 4902), try to add it
          if (
            switchError &&
            typeof switchError === "object" &&
            "code" in switchError
          ) {
            const errorCode = (switchError as { code: number }).code;
            if (errorCode === 4902) {
              // Chain not found, try to add it
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: `0x${chainId.toString(16)}`,
                      chainName: chainConfig.network,
                      nativeCurrency: {
                        name: "Ether",
                        symbol: "ETH",
                        decimals: 18,
                      },
                      rpcUrls: [chainConfig.rpcUrl],
                      blockExplorerUrls: chainConfig.explorerUrl
                        ? [chainConfig.explorerUrl]
                        : [],
                    },
                  ],
                });
              } catch (addError: unknown) {
                console.error("Failed to add chain:", addError);
                throw new Error(
                  `Failed to add ${chainConfig.network} to MetaMask. Please add it manually.`,
                );
              }
            } else {
              // Re-throw other switch errors
              throw switchError;
            }
          } else {
            throw switchError;
          }
        }

        // Wait a bit for the switch to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify the switch was successful by checking the current chain
        const newChainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const newChainIdNumber = parseInt(newChainId, 16);

        if (newChainIdNumber !== chainId) {
          throw new Error(
            `Network switch verification failed. Expected chain ${chainId}, got ${newChainIdNumber}`,
          );
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to switch network";

        if (error instanceof Error) {
          if (error.message.includes("user rejected")) {
            errorMessage = "Network switch was cancelled by user";
          } else if (error.message.includes("verification failed")) {
            errorMessage =
              "Network switch verification failed. Please try again.";
          } else if (error.message.includes("Failed to add")) {
            errorMessage = error.message;
          } else {
            errorMessage = error.message;
          }
        }

        console.error("Network switch error:", error);
        toast({
          title: "Network switch failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    }

    setIsMinting(true);

    try {
      // Mint 1000 tokens (adjust amount as needed)
      const mintAmount = BigInt(1000 * Math.pow(10, decimals));

      // Create a simple mint function call
      const mintFunction = {
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "mint",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
      };

      if (!walletClient) {
        toast({
          title: "Wallet not available",
          description: "Please ensure your wallet is connected and available",
          variant: "destructive",
        });
        return;
      }

      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: mintFunction.abi,
        functionName: "mint",
        args: [address as `0x${string}`, mintAmount],
        account: address as `0x${string}`,
        chain: getChainById(chainId),
      });

      // Show success toast with Etherscan link
      toast({
        title: "Mint successful",
        description: `Successfully minted ${mintAmount} ${tokenSymbol} on ${getChainById(chainId).name}!`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(getEtherscanLink(hash, chainId), "_blank")
            }
          >
            View on Etherscan
          </Button>
        ),
      });
    } catch (err: unknown) {
      let errorMessage = "Mint failed";

      if (err instanceof Error) {
        if (err.message?.includes("Internal JSON-RPC error")) {
          errorMessage =
            "RPC connection error. The network endpoint may be down. Please try refreshing the page or ensure you're on the correct network in MetaMask.";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage =
            "Insufficient funds for transaction. Please check your balance.";
        } else if (err.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      toast({
        title: "Mint failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const getChains = (): Chain[] => {
    const chains = configUtils.getAllChains();
    return chains;
  };

  const chains = getChains();

  // Helper function to get chain prefix for trading pairs
  const getChainPrefix = (network: string): string => {
    if (network.includes("flare")) return "f"; // flare-coston2
    if (network.includes("base")) return "b"; // base-sepolia
    if (network.includes("mainnet")) return "m";
    if (network.includes("goerli")) return "g";
    if (network.includes("sepolia")) return "s";
    return network.charAt(0).toLowerCase(); // fallback to first letter
  };

  return (
    <Layout scrollable>
      <main className="max-w-4xl mx-auto relative">
        {/* Floating decorative elements matching Pro view aesthetic */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-pulse delay-300"></section>
          <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-xl animate-pulse delay-700"></section>
          <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-lg animate-pulse delay-1000"></section>
        </section>

        <header className="mb-6 sm:mb-8 relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
            Mint Test Tokens
          </h1>
          <p className="text-neutral-700 text-xs sm:text-sm">
            Get test tokens to try out the trading interface
          </p>
        </header>

        {!isConnected ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-neutral-700 text-xs">
                Select a token and network to mint test tokens
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {chains.flatMap((chain: Chain) =>
              Object.keys(chain.tokens).map((tokenSymbol: string) => {
                const tokenConfig = chain.tokens[tokenSymbol];
                if (!tokenConfig) return null;

                return (
                  <Card
                    key={`${chain.chainId}-${tokenSymbol}`}
                    className="border-2 border-gray-200 bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">
                          {(() => {
                            const prefix = getChainPrefix(chain.network);
                            const fullSymbol = `${prefix}${tokenSymbol}`;
                            return fullSymbol;
                          })()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {chain.network}
                        </span>
                      </CardTitle>
                      <small className="text-xs text-neutral-500">
                        (estimated)
                      </small>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <dl className="space-y-3">
                        <header className="flex justify-between">
                          <span className="text-sm text-neutral-600">
                            Address:
                          </span>
                          <span className="text-xs font-mono text-neutral-600">
                            {tokenConfig.address.slice(0, 8)}...
                            {tokenConfig.address.slice(-6)}
                          </span>
                        </header>
                        <section className="flex justify-between">
                          <span className="text-sm text-neutral-600">
                            Decimals:
                          </span>
                          <span className="font-medium">
                            {tokenConfig.decimals}
                          </span>
                        </section>
                        <section className="flex justify-between">
                          <span className="text-sm text-neutral-600">
                            Network:
                          </span>
                          <span className="font-medium">{chain.network}</span>
                        </section>
                      </dl>

                      <Button
                        onClick={() =>
                          handleMint(
                            typeof chain.chainId === "string"
                              ? parseInt(chain.chainId, 10)
                              : chain.chainId,
                            tokenConfig.address,
                            tokenSymbol,
                            tokenConfig.decimals,
                          )
                        }
                        disabled={isMinting}
                        className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        {isMinting ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            Minting...
                          </span>
                        ) : (
                          `Mint 1000 ${tokenSymbol}`
                        )}
                      </Button>

                      {currentChainId ===
                        (typeof chain.chainId === "string"
                          ? parseInt(chain.chainId, 10)
                          : chain.chainId) && (
                        <aside className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          ✅ Successfully minted 1000 {tokenSymbol} on{" "}
                          {chain.network}
                        </aside>
                      )}
                    </CardContent>
                  </Card>
                );
              }),
            )}
          </section>
        )}

        <aside className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Connect your wallet to mint test tokens</li>
            <li>• Click "Mint" on each chain to get 1000 test tokens</li>
            <li>• MetaMask will automatically switch networks as needed</li>
            <li>• Use these tokens to test deposits and trading</li>
          </ul>
        </aside>
      </main>
    </Layout>
  );
};

export default Mint;
