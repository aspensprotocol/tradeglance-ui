import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, base, baseSepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Your WalletConnect project ID
const projectId = 'c3690594c774dccbd4a0272ae38f1953'

// Define custom chains for our application
const anvil1 = defineChain({
  id: 114,
  name: 'Anvil 1 - 8545',
  network: 'anvil-1',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
    public: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
})

const anvil2 = defineChain({
  id: 11155111,
  name: 'Anvil 2 - 8546',
  network: 'anvil-2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
    public: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia-optimistic.etherscan.io' },
  },
})

// Configure chains - include both default and custom chains
const chains = [mainnet, sepolia, polygon, base, baseSepolia, anvil1, anvil2] as const

// Create wagmi config with proper connectors
const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [anvil1.id]: http(),
    [anvil2.id]: http(),
  },
  connectors: [
    // Injected wallets (MetaMask, Rabby, etc.) - FIRST
    injected({ shimDisconnect: true }),
    // WalletConnect - SECOND
    walletConnect({ projectId, showQrModal: true }),
    // Coinbase Wallet - THIRD
    coinbaseWallet({ appName: 'TradeGlance' })
  ]
})

// Create Web3Modal with injected wallet support
createWeb3Modal({
  wagmiConfig,
  projectId,
  // Theme
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': 9999
  }
})

export { wagmiConfig } 