import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, base, baseSepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Your WalletConnect project ID
const projectId = 'c3690594c774dccbd4a0272ae38f1953'

// Start with default chains that are always available
const defaultChains = [mainnet, sepolia, polygon, base, baseSepolia] as const

// Create initial wagmi config with default chains only
const createWagmiConfig = (customChains: any[] = []) => {
  const allChains = [...defaultChains, ...customChains] as const;
  
  // Create transports object dynamically
  const transports: any = {};
  allChains.forEach(chain => {
    transports[chain.id] = http();
  });

  return createConfig({
    chains: allChains,
    transports,
    connectors: [
      // Injected wallets (MetaMask, Rabby, etc.) - FIRST
      injected({ shimDisconnect: true }),
      // WalletConnect - SECOND
      walletConnect({ projectId, showQrModal: true }),
      // Coinbase Wallet - THIRD
      coinbaseWallet({ appName: 'TradeGlance' })
    ]
  });
};

// Create initial config with default chains
let wagmiConfig = createWagmiConfig();

// Create Web3Modal with injected wallet support
let web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  // Theme
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': 9999
  }
})

export { wagmiConfig, createWagmiConfig }

// Utility function to create dynamic chains from gRPC config
export const createDynamicChains = (grpcChains: any[]) => {
  return grpcChains.map(chain => defineChain({
    id: typeof chain.chainId === 'string' ? parseInt(chain.chainId, 10) : chain.chainId,
    name: chain.network,
    network: chain.network,
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: [chain.rpcUrl] },
      public: { http: [chain.rpcUrl] },
    },
    blockExplorers: chain.explorerUrl ? {
      default: { name: 'Explorer', url: chain.explorerUrl },
    } : undefined,
  }));
};

// Function to update the wagmi config with chains from gRPC config
export const updateWagmiConfig = (grpcChains: any[]) => {
  const dynamicChains = createDynamicChains(grpcChains);
  const newConfig = createWagmiConfig(dynamicChains);
  
  // Update the global wagmi config
  wagmiConfig = newConfig;
  
  // Recreate Web3Modal with the new config
  web3Modal = createWeb3Modal({
    wagmiConfig: newConfig,
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-z-index': 9999
    }
  });
  
  console.log('Updated wagmi config with chains:', dynamicChains.map(c => ({ id: c.id, name: c.name })));
  
  return newConfig;
}; 