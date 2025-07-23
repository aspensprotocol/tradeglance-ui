// Configuration
const GRPC_WEB_PROXY_URL = import.meta.env.VITE_GRPC_WEB_PROXY_URL || 'http://localhost:8811';

console.log('Environment variable VITE_GRPC_WEB_PROXY_URL:', import.meta.env.VITE_GRPC_WEB_PROXY_URL);
console.log('Using GRPC_WEB_PROXY_URL:', GRPC_WEB_PROXY_URL);

// This must point to the Envoy proxy, not the Express server
const ENVOY_PROXY_URL = GRPC_WEB_PROXY_URL;

// Simple gRPC-Web client using fetch API for unary calls
class SimpleGrpcWebClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async call(service: string, method: string, data: any, headers: any = {}) {
    const url = `${this.baseUrl}/${service}/${method}`;
    
    console.log(`gRPC client making request to: ${url}`);
    console.log(`gRPC client base URL: ${this.baseUrl}`);
    
    // Convert data to proper gRPC-Web format
    const messageBytes = new TextEncoder().encode(JSON.stringify(data));
    const messageLength = messageBytes.length;
    
    // Create gRPC-Web frame: [1 byte flag][4 bytes length][message]
    const frame = new Uint8Array(5 + messageLength);
    frame[0] = 0; // No compression flag
    frame[1] = (messageLength >>> 24) & 0xFF; // Length bytes (big-endian)
    frame[2] = (messageLength >>> 16) & 0xFF;
    frame[3] = (messageLength >>> 8) & 0xFF;
    frame[4] = messageLength & 0xFF;
    frame.set(messageBytes, 5); // Set message after header
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+proto',
        'X-Grpc-Web': '1',
        ...headers
      },
      body: frame
    });

    if (!response.ok) {
      throw new Error(`gRPC call failed: ${response.status} ${response.statusText}`);
    }

    // Check gRPC status from headers
    const grpcStatus = response.headers.get('grpc-status');
    const grpcMessage = response.headers.get('grpc-message');
    
    console.log(`gRPC response status: ${response.status}`);
    console.log(`gRPC grpc-status: ${grpcStatus}`);
    console.log(`gRPC grpc-message: ${grpcMessage}`);
    console.log(`gRPC response headers:`, Object.fromEntries(response.headers.entries()));
    
    // Check if gRPC call failed
    if (grpcStatus && grpcStatus !== '0') {
      throw new Error(`gRPC call failed: ${grpcStatus} - ${grpcMessage || 'Unknown error'}`);
    }
    
    // Get response as array buffer for binary processing
    const arrayBuffer = await response.arrayBuffer();
    const responseBytes = new Uint8Array(arrayBuffer);
    
    console.log(`gRPC response bytes length: ${responseBytes.length}`);
    console.log(`gRPC response bytes:`, Array.from(responseBytes.slice(0, 20))); // Log first 20 bytes
    
    if (responseBytes.length === 0) {
      console.log('Empty response received');
      return {}; // Return empty object for empty responses
    }
    
    // Parse gRPC-Web response frame
    if (responseBytes.length >= 5) {
      const flag = responseBytes[0];
      const length = (responseBytes[1] << 24) | (responseBytes[2] << 16) | (responseBytes[3] << 8) | responseBytes[4];
      const messageBytes = responseBytes.slice(5, 5 + length);
      
      console.log(`gRPC response flag: ${flag}, length: ${length}`);
      
      if (messageBytes.length > 0) {
        try {
          const messageText = new TextDecoder().decode(messageBytes);
          console.log(`gRPC response message text:`, messageText);
          
          const parsed = JSON.parse(messageText);
          console.log('Successfully parsed JSON response:', parsed);
          return parsed;
        } catch (error) {
          console.warn('Failed to parse response as JSON:', error);
          return { rawResponse: Array.from(messageBytes) };
        }
      }
    }
    
    console.log('No valid message in response');
    return {};
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

// Create clients using Envoy proxy
const arborterClient = new SimpleGrpcWebClient(ENVOY_PROXY_URL);
const configClient = new SimpleGrpcWebClient(ENVOY_PROXY_URL);
const streamingClient = new StreamingGrpcWebClient(ENVOY_PROXY_URL);

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
    // Create the proper SendOrderRequest structure (matching aspens SDK)
    const request = {
      order: {
        side: order.side,
        quantity: order.quantity.toString(), // Convert to string (SDK expects string)
        price: order.price ? order.price.toString() : undefined, // Convert to string (SDK expects string)
        marketId: order.marketId, // Use marketId (SDK expects marketId, not marketName/tradeSymbol)
        baseAccountAddress: order.baseAccountAddress,
        quoteAccountAddress: order.quoteAccountAddress,
        executionType: order.executionType || 0,
        matchingOrderIds: order.matchingOrderIds || []
      },
      signatureHash: Array.from(signatureHash)
    };
    
    // Use proxy server for send order since it handles protobuf conversion properly
    const proxyUrl = 'http://localhost:8083';
    const url = `${proxyUrl}/grpc/xyz.aspens.arborter.v1.ArborterService/SendOrder`;
    
    console.log(`Sending order via proxy server to: ${url}`);
    console.log(`Order request:`, JSON.stringify(request, null, 2));
    console.log(`Signature hash length:`, signatureHash.length);
    console.log(`Signature hash bytes:`, Array.from(signatureHash));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Grpc-Web': '1',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Proxy server response:', result);
    return result;
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
  async getConfig(token?: string): Promise<any> {
    try {
      console.log('Calling getConfig via gRPC-Web');
      const request = {}; // No specific request object needed for getConfig
      const metadata: Record<string, string> = {};
      if (token) {
        metadata['Authorization'] = `Bearer ${token}`;
      }
      
      // Use the Promise-based API for better error handling
      return new Promise((resolve, reject) => {
        configClient.call(
          'xyz.aspens.arborter.v1.ConfigService',
          'GetConfig',
          request,
          metadata
        )
        .then(response => {
          console.log('gRPC-Web getConfig success:', response);
          resolve(response);
        })
        .catch(error => {
          console.error('gRPC-Web getConfig error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error in getConfig:', error);
      throw error;
    }
  },
  
  // Get version information
  async getVersion(token?: string): Promise<any> {
    try {
      console.log('Calling getVersion via gRPC-Web');
      const request = {}; // No specific request object needed for getVersion
      const metadata: Record<string, string> = {};
      if (token) {
        metadata['Authorization'] = `Bearer ${token}`;
      }
      
      return new Promise((resolve, reject) => {
        configClient.call(
          'xyz.aspens.arborter.v1.ConfigService',
          'GetVersion',
          request,
          metadata
        )
        .then(response => {
          console.log('gRPC-Web getVersion success:', response);
          resolve(response);
        })
        .catch(error => {
          console.error('gRPC-Web getVersion error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error in getVersion:', error);
      throw error;
    }
  }
};

// Test gRPC connection
export async function testGrpcConnection(): Promise<boolean> {
  try {
    console.log('Testing gRPC connection to Envoy proxy at:', ENVOY_PROXY_URL);
    const version = await configService.getVersion();
    console.log('gRPC connection successful:', version);
    return true;
  } catch (error) {
    console.error('gRPC connection failed:', error);
    return false;
  }
}
