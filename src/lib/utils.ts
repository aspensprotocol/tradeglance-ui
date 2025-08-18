import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { configUtils } from "./config-utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate Etherscan link for a transaction hash based on chain ID
 * @param txHash - The transaction hash
 * @param chainId - The chain ID
 * @returns The Etherscan URL for the transaction
 */
export function getEtherscanLink(txHash: string, chainId: number): string {
  // Ensure we have the 0x prefix for the transaction hash
  const cleanHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  
  // Get explorer URL from gRPC configuration
  const chainConfig = configUtils.getChainByChainId(chainId);
  console.log('getEtherscanLink debug:', {
    chainId,
    chainConfig: chainConfig ? {
      network: chainConfig.network,
      chainId: chainConfig.chainId,
      explorerUrl: chainConfig.explorerUrl,
      hasExplorerUrl: !!chainConfig.explorerUrl,
      allChainFields: Object.keys(chainConfig).filter(k => !k.startsWith('_'))
    } : null,
    allConfigChains: configUtils.getAllChains().map(c => ({
      network: c.network,
      chainId: c.chainId,
      explorerUrl: c.explorerUrl,
      hasExplorerUrl: !!c.explorerUrl
    }))
  });
  
  if (chainConfig && chainConfig.explorerUrl) {
    // Remove trailing slash from explorer URL if present
    const baseUrl = chainConfig.explorerUrl.replace(/\/$/, '');
    console.log('Using config explorer URL:', baseUrl);
    return `${baseUrl}/tx/${cleanHash}`;
  }
  
  // Fallback to hardcoded explorer URLs for known chains
  const explorerUrls: Record<number, string> = {
    1: 'https://etherscan.io', // Ethereum Mainnet
    137: 'https://polygonscan.com', // Polygon
    42161: 'https://arbiscan.io', // Arbitrum One
    14: 'https://flare-explorer.flare.network', // Flare Network
    11155111: 'https://sepolia.etherscan.io', // Sepolia
    80001: 'https://mumbai.polygonscan.com', // Mumbai
    421613: 'https://goerli.arbiscan.io', // Arbitrum Goerli
    31337: 'https://localhost:8545', // Anvil/Hardhat local
    114: 'https://coston2-explorer.flare.network', // Coston2
  };
  
  const baseUrl = explorerUrls[chainId];
  if (!baseUrl) {
    // Fallback to Etherscan with a warning
    console.warn(`Unknown chain ID ${chainId}, using Etherscan as fallback`);
    return `https://etherscan.io/tx/${cleanHash}`;
  }
  
  return `${baseUrl}/tx/${cleanHash}`;
}

/**
 * Generate a shortened transaction hash for display
 * @param txHash - The transaction hash
 * @param startLength - Number of characters to show at the start (default: 6)
 * @param endLength - Number of characters to show at the end (default: 4)
 * @returns Shortened hash string
 */
export function shortenTxHash(txHash: string, startLength: number = 6, endLength: number = 4): string {
  if (!txHash || txHash.length < startLength + endLength + 3) {
    return txHash;
  }
  
  const cleanHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
  return `${cleanHash.slice(0, startLength)}...${cleanHash.slice(-endLength)}`;
}

// Utility function to trigger a global balance refresh event
export const triggerBalanceRefresh = () => {
  console.log('triggerBalanceRefresh: Dispatching balance refresh event');
  window.dispatchEvent(new CustomEvent('balance-refresh'));
};
