import { GetConfigResponse } from '../proto/generated/src/proto/arborter_config';

// For now, let's create a simple mock response to test the UI
// In production, you'd need a backend proxy to call the gRPC service
export const configService = {
  async getConfig(token?: string): Promise<GetConfigResponse> {
    try {
      // For now, return a mock response to test the UI
      // TODO: Replace with actual gRPC call via backend proxy
      const mockConfig: GetConfigResponse = {
        config: {
          chains: [
            {
              architecture: "EVM",
              canonicalName: "Base Sepolia",
              network: "base-sepolia",
              chainId: 84532,
              contractOwnerAddress: "0x1234567890123456789012345678901234567890",
              rpcUrl: "https://sepolia.base.org",
              serviceAddress: "0x1234567890123456789012345678901234567890",
              tradeContract: {
                address: "0x1234567890123456789012345678901234567890"
              },
              tokens: {
                "USDC": {
                  name: "USD Coin",
                  symbol: "USDC",
                  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7c",
                  decimals: 6,
                  tradePrecision: 6
                }
              },
              baseOrQuote: 1 // BASE
            },
            {
              architecture: "EVM",
              canonicalName: "Optimism Sepolia",
              network: "op-sepolia",
              chainId: 11155420,
              contractOwnerAddress: "0x1234567890123456789012345678901234567890",
              rpcUrl: "https://sepolia.optimism.io",
              serviceAddress: "0x1234567890123456789012345678901234567890",
              tradeContract: {
                address: "0x1234567890123456789012345678901234567890"
              },
              tokens: {
                "USDC": {
                  name: "USD Coin",
                  symbol: "USDC",
                  address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
                  decimals: 6,
                  tradePrecision: 6
                }
              },
              baseOrQuote: 2 // QUOTE
            }
          ],
          markets: [
            {
              slug: "base-sepolia-usdc--op-sepolia-usdc",
              name: "Base Sepolia USDC - OP Sepolia USDC",
              baseChainNetwork: "base-sepolia",
              quoteChainNetwork: "op-sepolia",
              baseChainTokenSymbol: "USDC",
              quoteChainTokenSymbol: "USDC",
              baseChainTokenDecimals: 6,
              quoteChainTokenDecimals: 6,
              pairDecimals: 6,
              marketId: "84532::0x036CbD53842c5426634e7929541eC2318f3dCF7c::11155420::0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
            }
          ]
        }
      };
      
      console.log('Mock config data:', mockConfig);
      return mockConfig;
    } catch (error) {
      console.error('Failed to fetch config:', error);
      throw error;
    }
  },
}; 