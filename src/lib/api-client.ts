// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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

// Base API client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  public async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = token;
    }

    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  public async post<T>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = token;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }
}

// Streaming client for Server-Sent Events
class StreamingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  createStream(endpoint: string, data: any, token?: string) {
    const url = `${this.baseUrl}${endpoint}`;
    
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

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    // Start the fetch request
    fetch(url, {
      method: 'POST',
      headers,
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

// Create API clients
const apiClient = new ApiClient(API_BASE_URL);
const streamingClient = new StreamingApiClient(API_BASE_URL);

// Arborter Service
export const arborterService = {
  // Send an order
  async sendOrder(
    order: any,
    signatureHash: Uint8Array,
    token?: string
  ): Promise<any> {
    // Create the proper SendOrderRequest structure
    const request = {
      order: order,
      signatureHash: Array.from(signatureHash)
    };
    
    return apiClient.post('/arborter/send-order', request, token);
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
    
    return apiClient.post('/arborter/cancel-order', data, token);
  },

  // Stream orderbook using Server-Sent Events
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
    
    return streamingClient.createStream('/arborter/orderbook-stream', data, token);
  },

  // Stream trades using Server-Sent Events
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
    
    return streamingClient.createStream('/arborter/trades-stream', data, token);
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
    
    return apiClient.post('/arborter/add-orderbook', data, token);
  },

  // Remove orderbook
  async removeOrderbook(
    marketId: string,
    token?: string
  ): Promise<any> {
    const data = {
      marketId
    };
    
    return apiClient.post('/arborter/remove-orderbook', data, token);
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
    
    return apiClient.post('/arborter/unnormalize-decimals', data, token);
  }
};

// Config Service
export const configService = {
  // Get configuration
  async getConfig(token?: string): Promise<any> {
    try {
      // Use our new gRPC client that goes through Envoy
      const { configService: grpcConfigService } = await import('./grpc-client');
      return await grpcConfigService.getConfig(token);
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  // Get version
  async getVersion(token?: string): Promise<any> {
    try {
      // Use our new gRPC client that goes through Envoy
      const { configService: grpcConfigService } = await import('./grpc-client');
      return await grpcConfigService.getVersion(token);
    } catch (error) {
      console.error('Error fetching version:', error);
      throw error;
    }
  }
};

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    // Use our new gRPC client to test the connection
    const { testGrpcConnection } = await import('./grpc-client');
    return await testGrpcConnection();
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}