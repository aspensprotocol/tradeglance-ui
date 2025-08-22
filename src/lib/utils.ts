import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { configUtils } from "./config-utils";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generate Etherscan link for a transaction hash based on chain ID
 * @param txHash - The transaction hash
 * @param chainId - The chain ID
 * @returns The Etherscan URL for the transaction
 */
export function getEtherscanLink(txHash: string, chainId: number): string {
  // Ensure we have the 0x prefix for the transaction hash
  const cleanHash = txHash.startsWith("0x") ? txHash : `0x${txHash}`;

  // Get explorer URL from gRPC configuration
  const chainConfig = configUtils.getChainByChainId(chainId);
  console.log("getEtherscanLink debug:", {
    chainId,
    chainConfig: chainConfig
      ? {
          network: chainConfig.network,
          chainId: chainConfig.chainId,
          explorerUrl: chainConfig.explorerUrl,
          hasExplorerUrl: !!chainConfig.explorerUrl,
          allChainFields: Object.keys(chainConfig).filter(
            (k) => !k.startsWith("_"),
          ),
        }
      : null,
    allConfigChains: configUtils.getAllChains().map((c) => ({
      network: c.network,
      chainId: c.chainId,
      explorerUrl: c.explorerUrl,
      hasExplorerUrl: !!c.explorerUrl,
    })),
  });

  if (chainConfig && chainConfig.explorerUrl) {
    // Remove trailing slash from explorer URL if present
    const baseUrl = chainConfig.explorerUrl.replace(/\/$/, "");
    console.log("Using config explorer URL:", baseUrl);
    return `${baseUrl}/tx/${cleanHash}`;
  }

  // If no explorer URL is configured, return just the transaction hash
  console.log(
    `No explorer URL configured for chain ${chainId}, returning transaction hash`,
  );
  return cleanHash;
}

/**
 * Generate a shortened transaction hash for display
 * @param txHash - The transaction hash
 * @param startLength - Number of characters to show at the start (default: 6)
 * @param endLength - Number of characters to show at the end (default: 4)
 * @returns Shortened hash string
 */
export function shortenTxHash(
  txHash: string,
  startLength = 6,
  endLength = 4,
): string {
  if (!txHash || txHash.length < startLength + endLength + 3) {
    return txHash;
  }

  const cleanHash = txHash.startsWith("0x") ? txHash.slice(2) : txHash;
  return `${cleanHash.slice(0, startLength)}...${cleanHash.slice(-endLength)}`;
}

// Utility function to trigger a global balance refresh event
export const triggerBalanceRefresh = (): void => {
  console.log("triggerBalanceRefresh: Dispatching balance refresh event");
  window.dispatchEvent(new CustomEvent("balance-refresh"));
};

// Utility function to trigger a global orderbook refresh event
export const triggerOrderbookRefresh = (): void => {
  console.log("triggerOrderbookRefresh: Dispatching orderbook refresh event");
  window.dispatchEvent(new CustomEvent("orderbook-refresh"));
};

// Token image mapping utility
export function getTokenImageUrl(symbol: string): string | null {
  // Normalize the symbol to handle various formats
  const normalizedSymbol = symbol.toUpperCase().trim();
  
  const tokenImages: Record<string, string> = {
    // Major cryptocurrencies
    BTC: "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png",
    ETH: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
    USDT: "https://assets.coingecko.com/coins/images/325/standard/Tether.png",
    USDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
    
    // Wrapped tokens (show underlying asset logo)
    WBTC: "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png", // Wrapped Bitcoin shows Bitcoin logo
    WETH: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png", // Wrapped ETH shows ETH logo
    WMATIC: "https://assets.coingecko.com/coins/images/4713/standard/matic-token-icon.png", // Wrapped MATIC shows MATIC logo
    
    // Additional popular tokens
    BNB: "https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png",
    SOL: "https://assets.coingecko.com/coins/images/4128/standard/solana.png",
    ADA: "https://assets.coingecko.com/coins/images/975/standard/cardano.png",
    DOT: "https://assets.coingecko.com/coins/images/12171/standard/polkadot-new-logo.png",
    MATIC: "https://assets.coingecko.com/coins/images/4713/standard/matic-token-icon.png",
    LINK: "https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png",
    UNI: "https://assets.coingecko.com/coins/images/12504/standard/uniswap-uni.png",
    ATOM: "https://assets.coingecko.com/coins/images/1481/standard/cosmos_hub.png",
    LTC: "https://assets.coingecko.com/coins/images/2/standard/litecoin.png",
    XRP: "https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png",
    
    // Stablecoins
    DAI: "https://assets.coingecko.com/coins/images/9956/standard/4943.png",
    FRAX: "https://assets.coingecko.com/coins/images/13422/standard/FRAX_icon.png",
    BUSD: "https://assets.coingecko.com/coins/images/9576/standard/BUSD.png",
    
    // Layer 2 tokens
    ARB: "https://assets.coingecko.com/coins/images/16547/standard/photo_2023-03-29_21-47-00.jpg",
    OP: "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png",
    
    // Add more mappings as needed
  };

  // First try exact match
  if (tokenImages[normalizedSymbol]) {
    return tokenImages[normalizedSymbol];
  }

  // If no exact match, try to handle wrapped tokens by checking if it starts with 'W'
  if (normalizedSymbol.startsWith('W')) {
    const underlyingSymbol = normalizedSymbol.slice(1); // Remove the 'W' prefix
    if (tokenImages[underlyingSymbol]) {
      return tokenImages[underlyingSymbol];
    }
  }

  // If still no match, try to find partial matches for common variations
  for (const [key, value] of Object.entries(tokenImages)) {
    if (normalizedSymbol.includes(key) || key.includes(normalizedSymbol)) {
      return value;
    }
  }

  return null;
}
