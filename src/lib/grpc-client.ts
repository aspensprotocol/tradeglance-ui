// Configuration
const GRPC_WEB_PROXY_URL = process.env.REACT_APP_GRPC_WEB_PROXY_URL || 'http://localhost:8083/grpc';

// Simple gRPC-Web client using fetch API
class SimpleGrpcWebClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async call(service: string, method: string, data: any, headers: any = {}) {
    const url = `${this.baseUrl}/${service}/${method}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Grpc-Web': '1',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`gRPC call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Create clients
const arborterClient = new SimpleGrpcWebClient(GRPC_WEB_PROXY_URL);
const configClient = new SimpleGrpcWebClient(GRPC_WEB_PROXY_URL);

// Utility function to convert protobuf objects to plain objects
export function convertToPlainObject<T>(protoObj: any): T {
  if (!protoObj) return protoObj;
  
  if (typeof protoObj.toObject === 'function') {
    return protoObj.toObject() as T;
  }
  
  if (Array.isArray(protoObj)) {
    return protoObj.map(item => convertToPlainObject(item)) as T;
  }
  
  if (typeof protoObj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(protoObj)) {
      result[key] = convertToPlainObject(value);
    }
    return result as T;
  }
  
  return protoObj as T;
}

// Arborter Service
export const arborterService = {
  // Send an order
  async sendOrder(
    order: any,
    signatureHash: Uint8Array,
    token?: string
  ): Promise<any> {
    const data = {
      order: order,
      signatureHash: Array.from(signatureHash)
    };
    
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'SendOrder',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Cancel an order
  async cancelOrder(
    orderToCancel: any,
    signatureHash: Uint8Array,
    token?: string
  ): Promise<any> {
    const data = {
      order: orderToCancel,
      signatureHash: Array.from(signatureHash)
    };
    
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'CancelOrder',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Stream orderbook (simplified for now)
  streamOrderbook(
    marketId: string,
    continueStream: boolean = true,
    historicalOpenOrders?: boolean,
    filterByTrader?: string,
    token?: string
  ) {
    const data = {
      continueStream,
      marketId,
      historicalOpenOrders,
      filterByTrader
    };
    
    // For now, return a simple promise-based approach
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'Orderbook',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Stream trades (simplified for now)
  streamTrades(
    marketId: string,
    continueStream: boolean = true,
    historicalClosedTrades?: boolean,
    filterByTrader?: string,
    token?: string
  ) {
    const data = {
      continueStream,
      marketId,
      historicalClosedTrades,
      filterByTrader
    };
    
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'Trades',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Add orderbook
  async addOrderbook(
    marketId: string,
    decimalPlaces: number,
    token?: string
  ): Promise<any> {
    const data = {
      marketId,
      decimalPlaces
    };
    
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'AddOrderbook',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Remove orderbook
  async removeOrderbook(
    marketId: string,
    token?: string
  ): Promise<any> {
    const data = {
      marketId
    };
    
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'RemoveOrderbook',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Unnormalize decimals
  async unNormalizeDecimals(
    marketId: string,
    side: string,
    quantity: string,
    price: string,
    token?: string
  ): Promise<any> {
    const data = {
      marketId,
      side,
      quantity,
      price
    };
    
    return arborterClient.call(
      'xyz.aspens.arborter.v1.ArborterService',
      'UnNormalizeDecimals',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  }
};

// Config Service
export const configService = {
  // Get configuration
  async getConfig(token?: string): Promise<any> {
    const data = {};
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'GetConfig',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Get version info
  async getVersion(token?: string): Promise<any> {
    const data = {};
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'GetVersion',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Deploy contract
  async deployContract(
    chainNetwork: string,
    baseOrQuote: string,
    token?: string
  ): Promise<any> {
    const data = {
      chainNetwork,
      baseOrQuote
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'DeployContract',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Add chain
  async addChain(chain: any, token?: string): Promise<any> {
    const data = {
      chain
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'AddChain',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Add token
  async addToken(
    chainNetwork: string,
    tokenData: any,
    token?: string
  ): Promise<any> {
    const data = {
      chainNetwork,
      token: tokenData
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'AddToken',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Add market
  async addMarket(marketData: any, token?: string): Promise<any> {
    const data = {
      baseChainNetwork: marketData.baseChainNetwork,
      quoteChainNetwork: marketData.quoteChainNetwork,
      baseChainTokenSymbol: marketData.baseChainTokenSymbol,
      quoteChainTokenSymbol: marketData.quoteChainTokenSymbol,
      baseChainTokenAddress: marketData.baseChainTokenAddress,
      quoteChainTokenAddress: marketData.quoteChainTokenAddress,
      baseChainTokenDecimals: marketData.baseChainTokenDecimals,
      quoteChainTokenDecimals: marketData.quoteChainTokenDecimals,
      pairDecimals: marketData.pairDecimals
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'AddMarket',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Add trade contract
  async addTradeContract(
    address: string,
    chainId: number,
    token?: string
  ): Promise<any> {
    const data = {
      address,
      chainId
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'AddTradeContract',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Delete market
  async deleteMarket(marketId: string, token?: string): Promise<any> {
    const data = {
      marketId
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'DeleteMarket',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Delete token
  async deleteToken(
    chainNetwork: string,
    tokenSymbol: string,
    token?: string
  ): Promise<any> {
    const data = {
      chainNetwork,
      tokenSymbol
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'DeleteToken',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Delete chain
  async deleteChain(chainNetwork: string, token?: string): Promise<any> {
    const data = {
      chainNetwork
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'DeleteChain',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Delete trade contract
  async deleteTradeContract(
    address: string,
    chainId: number,
    token?: string
  ): Promise<any> {
    const data = {
      address,
      chainId
    };
    
    return configClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'DeleteTradeContract',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  }
};

// Test gRPC connection
export async function testGrpcConnection(): Promise<boolean> {
  try {
    const version = await configService.getVersion();
    console.log('gRPC connection successful:', version);
    return true;
  } catch (error) {
    console.error('gRPC connection failed:', error);
    return false;
  }
} 