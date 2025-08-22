import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { configUtils } from "@/lib/config-utils";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { Layout } from "@/components/Layout";
import { getEtherscanLink, shortenTxHash } from "@/lib/utils";
import type { Chain } from "@/protos/gen/arborter_config_pb";

const Mint = (): JSX.Element => {
  const [isMinting, setIsMinting] = useState(false);
  const { address, isConnected } = useAccount();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const { switchToNetwork } = useNetworkSwitch();
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

        // Use our custom network switching
        const success = await switchToNetwork(chainConfig);
        if (!success) {
          toast({
            title: "Network switch failed",
            description: "Failed to switch to the required network",
            variant: "destructive",
          });
          return;
        }

        // Wait a bit for the switch to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to switch network";
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

      console.log("Minting tokens:", {
        chainId,
        tokenAddress,
        tokenSymbol,
        decimals,
        mintAmount: mintAmount.toString(),
        address,
      });

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

      console.log("Mint successful:", hash);

      // Show success toast with Etherscan link
      const etherscanLink = getEtherscanLink(hash, chainId);
      const shortHash = shortenTxHash(hash);

      toast({
        title: "Mint successful",
        description: (
          <article>
            <p>Successfully minted 1000 {tokenSymbol} tokens</p>
            <a
              href={etherscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View on Explorer: {shortHash}
            </a>
          </article>
        ),
      });
    } catch (err: unknown) {
      console.error("Mint failed:", err);

      let errorMessage = "Mint failed";

      if (err instanceof Error) {
        if (err.message?.includes("Internal JSON-RPC error")) {
          errorMessage =
            "RPC connection error. The network endpoint may be down. Please try refreshing the page or switching networks.";
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
    console.log("Mint page: All chains from config:", chains);
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
      <main className="max-w-4xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Test Token Minting
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Mint test tokens for both chains to test the trading functionality.
          </p>
        </header>

        {!isConnected ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                Please connect your wallet to mint test tokens.
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
                    className="border-2 border-gray-200"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">
                          {(() => {
                            const prefix = getChainPrefix(chain.network);
                            const fullSymbol = `${prefix}${tokenSymbol}`;
                            console.log("Token display:", {
                              network: chain.network,
                              prefix,
                              tokenSymbol,
                              fullSymbol,
                            });
                            return fullSymbol;
                          })()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {chain.network}
                        </span>
                      </CardTitle>
                      <small className="text-xs text-gray-400">
                        Chain ID: {chain.chainId}
                      </small>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <dl className="space-y-3">
                        <header className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Address:
                          </span>
                          <span className="text-xs font-mono text-gray-500">
                            {tokenConfig.address.slice(0, 8)}...
                            {tokenConfig.address.slice(-6)}
                          </span>
                        </header>
                        <section className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Decimals:
                          </span>
                          <span className="font-medium">
                            {tokenConfig.decimals}
                          </span>
                        </section>
                        <section className="flex justify-between">
                          <span className="text-sm text-gray-600">
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
                        className="w-full"
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
                          ✓ Currently on this network
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
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Connect your wallet to mint test tokens</li>
            <li>• Click "Mint" on each chain to get 1000 test tokens</li>
            <li>• The app will automatically switch networks if needed</li>
            <li>• Use these tokens to test deposits and trading</li>
          </ul>
        </aside>
      </main>
    </Layout>
  );
};

export default Mint;
