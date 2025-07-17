// Environment configuration for blockchain settings
export const config = {
  // Contract Addresses
  MIDRIB_CONTRACT_ADDRESS: import.meta.env.VITE_MIDRIB_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  
  // RPC URLs
  ETHEREUM_RPC_URL: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  POLYGON_RPC_URL: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
  ARBITRUM_RPC_URL: import.meta.env.VITE_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  FLARE_RPC_URL: import.meta.env.VITE_FLARE_RPC_URL || 'https://flare-api.flare.network/ext/C/rpc',
  XRPL_RPC_URL: import.meta.env.VITE_XRPL_RPC_URL || 'https://xrplcluster.com',
  
  // Chain IDs
  ETHEREUM_CHAIN_ID: parseInt(import.meta.env.VITE_ETHEREUM_CHAIN_ID || '1'),
  POLYGON_CHAIN_ID: parseInt(import.meta.env.VITE_POLYGON_CHAIN_ID || '137'),
  ARBITRUM_CHAIN_ID: parseInt(import.meta.env.VITE_ARBITRUM_CHAIN_ID || '42161'),
  FLARE_CHAIN_ID: parseInt(import.meta.env.VITE_FLARE_CHAIN_ID || '14'),
  
  // Default network settings
  DEFAULT_CHAIN_ID: parseInt(import.meta.env.VITE_DEFAULT_CHAIN_ID || '1'),
  DEFAULT_NETWORK: import.meta.env.VITE_DEFAULT_NETWORK || 'ethereum',
  
  // Gas settings
  DEFAULT_GAS_LIMIT: parseInt(import.meta.env.VITE_DEFAULT_GAS_LIMIT || '200000'),
  DEFAULT_GAS_PRICE: import.meta.env.VITE_DEFAULT_GAS_PRICE || '20000000000', // 20 gwei
};

// Network configuration
export const networks = {
  ethereum: {
    chainId: config.ETHEREUM_CHAIN_ID,
    rpcUrl: config.ETHEREUM_RPC_URL,
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    blockExplorer: 'https://etherscan.io',
  },
  polygon: {
    chainId: config.POLYGON_CHAIN_ID,
    rpcUrl: config.POLYGON_RPC_URL,
    name: 'Polygon',
    currency: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
  },
  arbitrum: {
    chainId: config.ARBITRUM_CHAIN_ID,
    rpcUrl: config.ARBITRUM_RPC_URL,
    name: 'Arbitrum One',
    currency: 'ETH',
    blockExplorer: 'https://arbiscan.io',
  },
  flare: {
    chainId: config.FLARE_CHAIN_ID,
    rpcUrl: config.FLARE_RPC_URL,
    name: 'Flare Network',
    currency: 'FLR',
    blockExplorer: 'https://flare-explorer.flare.network',
  },
};

// Token addresses for different networks
export const tokenAddresses = {
  ethereum: {
    USDT: import.meta.env.VITE_ETHEREUM_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: import.meta.env.VITE_ETHEREUM_USDC_ADDRESS || '0xA0b86a33E6441b8C4505B6B8C0d4C5c5C5C5C5C5',
    WBTC: import.meta.env.VITE_ETHEREUM_WBTC_ADDRESS || '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  polygon: {
    USDT: import.meta.env.VITE_POLYGON_USDT_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: import.meta.env.VITE_POLYGON_USDC_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    WBTC: import.meta.env.VITE_POLYGON_WBTC_ADDRESS || '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  },
  flare: {
    WFLR: import.meta.env.VITE_FLARE_WFLR_ADDRESS || '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d',
    USDT: import.meta.env.VITE_FLARE_USDT_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
};

export default config;