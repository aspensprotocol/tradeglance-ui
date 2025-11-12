import { type Config, createConfig, http } from "wagmi";
import { base, baseSepolia, mainnet, polygon, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { type Chain as ViemChain, defineChain } from "viem";
import type { Chain } from "../lib/shared-types";

// Your WalletConnect project ID
const projectId = "c3690594c774dccbd4a0272ae38f1953";

// Start with default chains that are always available
const defaultChains = [mainnet, sepolia, polygon, base, baseSepolia] as const;

// Create initial wagmi config with default chains only
const createWagmiConfig = (
  customChains: ReturnType<typeof defineChain>[] = [],
): Config => {
  const allChains = [...defaultChains, ...customChains] as const;

  // Create transports object dynamically with retry logic
  const transports: Record<number, ReturnType<typeof http>> = {};
  allChains.forEach((chain) => {
    transports[chain.id] = http(chain.rpcUrls.default.http[0], {
      batch: { batchSize: 1 }, // Disable batching to avoid connection issues
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
    });
  });

  return createConfig({
    chains: allChains,
    transports,
    connectors: [
      // Injected wallets (MetaMask, Rabby, etc.) - FIRST
      injected(),
      // WalletConnect - SECOND
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: {
          name: "TradeGlance",
          description: "TradeGlance Trading Platform",
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.png`],
        },
      }),
      // Coinbase Wallet - THIRD
      coinbaseWallet({
        appName: "TradeGlance",
        headlessMode: false, // Ensure UI is shown
      }),
    ],
  });
};

// Create initial config with default chains
let wagmiConfig = createWagmiConfig();

export { wagmiConfig, createWagmiConfig };

// Utility function to create dynamic chains from gRPC config
export const createDynamicChains = (grpcChains: Chain[]): ViemChain[] => {
  return grpcChains.map((chain) =>
    defineChain({
      id:
        typeof chain.chainId === "string"
          ? parseInt(chain.chainId, 10)
          : chain.chainId,
      name: chain.network,
      network: chain.network,
      nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
      },
      rpcUrls: {
        default: { http: [chain.rpcUrl] },
        public: { http: [chain.rpcUrl] },
      },
      blockExplorers: chain.explorerUrl
        ? {
            default: { name: "Explorer", url: chain.explorerUrl },
          }
        : undefined,
    }),
  );
};

// Track if we've already updated the config to prevent multiple initializations
let hasUpdatedConfig = false;

// Function to update the wagmi config with chains from gRPC config
export const updateWagmiConfig = (grpcChains: Chain[]): Config => {
  // Prevent multiple updates
  if (hasUpdatedConfig) {
    return wagmiConfig;
  }

  const dynamicChains = createDynamicChains(grpcChains);
  const newConfig = createWagmiConfig(dynamicChains);

  // Update the global wagmi config
  wagmiConfig = newConfig;

  hasUpdatedConfig = true;

  return newConfig;
};
