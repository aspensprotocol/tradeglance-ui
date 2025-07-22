// Configuration
const GRPC_WEB_PROXY_URL = import.meta.env.VITE_GRPC_WEB_PROXY_URL || 'http://0.0.0.0:8811';

// Import generated gRPC-Web client and messages
import { ConfigServiceClient } from '../proto/generated/Arborter_configServiceClientPb';
import { GetConfigRequest, GetConfigResponse } from '../proto/generated/arborter_config_pb';

// Create the gRPC-Web client instance
const configGrpcClient = new ConfigServiceClient(GRPC_WEB_PROXY_URL, null, null);

// Simple gRPC-Web client using fetch API for unary calls
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

// Streaming gRPC-Web client using fetch with ReadableStream for server-sent events
class StreamingGrpcWebClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  createStream(service: string, method: string, data: any, headers: any = {}) {
    const url = `${this.baseUrl}/${service}/${method}`;
    
    // Create a custom event emitter for the stream
    const stream = {
      on: (event: string, callback: Function) => {
        if (event === 'data') {
          stream.dataCallback = callback;
        } else if (event === 'error') {
          stream.errorCallback = callback;
        } else if (event === 'end') {
          stream.endCallback = callback;
        }
      },
      cancel: () => {
        if (stream.abortController) {
          stream.abortController.abort();
        }
      },
      dataCallback: null as Function | null,
      errorCallback: null as Function | null,
      endCallback: null as Function | null,
      abortController: null as AbortController | null
    };

    // Create abort controller for cancellation
    const abortController = new AbortController();
    stream.abortController = abortController;

    // Start the fetch request
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Grpc-Web': '1',
        ...headers
      },
      body: JSON.stringify(data),
      signal: abortController.signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      function readStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            if (stream.endCallback) {
              stream.endCallback();
            }
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonData);
                
                // Skip connection messages
                if (data.type === 'connected') {
                  continue;
                }
                
                // Handle error messages
                if (data.type === 'error') {
                  if (stream.errorCallback) {
                    stream.errorCallback(new Error(data.error));
                  }
                  return;
                }
                
                // Handle end messages
                if (data.type === 'end') {
                  if (stream.endCallback) {
                    stream.endCallback();
                  }
                  return;
                }
                
                // Handle actual data
                if (stream.dataCallback) {
                  stream.dataCallback(data);
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
                if (stream.errorCallback) {
                  stream.errorCallback(error);
                }
              }
            }
          }

          // Continue reading
          readStream();
        }).catch(error => {
          if (stream.errorCallback) {
            stream.errorCallback(error);
          }
        });
      }

      readStream();
    })
    .catch(error => {
      if (stream.errorCallback) {
        stream.errorCallback(error);
      }
    });

    return stream;
  }
}

// Create clients
const arborterClient = new SimpleGrpcWebClient(GRPC_WEB_PROXY_URL);
const configClient = new SimpleGrpcWebClient(GRPC_WEB_PROXY_URL);
const streamingClient = new StreamingGrpcWebClient(GRPC_WEB_PROXY_URL);

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

  // Stream orderbook using proper gRPC-Web streaming
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
    
    return streamingClient.createStream(
      'xyz.aspens.arborter.v1.ArborterService',
      'Orderbook',
      data,
      { Authorization: token ? `Bearer ${token}` : '' }
    );
  },

  // Stream trades using proper gRPC-Web streaming
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
    
    return streamingClient.createStream(
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

// Config Service using gRPC-Web generated client
export const configService = {
  // Get configuration
  async getConfig(token?: string): Promise<GetConfigResponse.AsObject> {
    const request = new GetConfigRequest();
    const metadata: Record<string, string> = {};
    if (token) {
      metadata['Authorization'] = `Bearer ${token}`;
    }
    const response = await configGrpcClient.getConfig(request, metadata);
    return response.toObject();
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
