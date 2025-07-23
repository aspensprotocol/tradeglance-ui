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
    const data = {
      order: order,
      signatureHash: Array.from(signatureHash)
    };
    
    return apiClient.post('/arborter/send-order', data, token);
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
      // Use the gRPC-Web endpoint directly
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/grpc/xyz.aspens.arborter_config.v1.ConfigService/GetConfig`, {
        method: 'POST',  // gRPC-Web requires POST method
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'X-Grpc-Web': '1',
          ...(token ? { 'Authorization': token } : {})
        },
        body: new Uint8Array(0)  // Empty message for GetConfig
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the gRPC-Web response
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Skip the gRPC-Web header (5 bytes) and parse the actual message
      if (bytes.length > 5) {
        const dataBytes = bytes.slice(5);
        const jsonString = new TextDecoder().decode(dataBytes);
        
        // Debug: let's see what we're actually getting
        console.log('Raw JSON string:', jsonString);
        console.log('JSON string length:', jsonString.length);
        
        // The response starts with "fig": which suggests there's a prefix
        // Let's find the actual JSON start and clean it
        let cleanedJson = jsonString;
        
        // If it starts with a partial JSON, try to find the complete object
        if (cleanedJson.includes('"chains"') && !cleanedJson.startsWith('{')) {
          const startIndex = cleanedJson.indexOf('"chains"');
          if (startIndex > 0) {
            // Find the opening brace before "chains"
            const beforeChains = cleanedJson.substring(0, startIndex);
            const lastBraceIndex = beforeChains.lastIndexOf('{');
            if (lastBraceIndex >= 0) {
              cleanedJson = cleanedJson.substring(lastBraceIndex);
            } else {
              // If no opening brace found, add one
              cleanedJson = '{' + cleanedJson;
            }
          }
        }
        
        // Ensure the JSON is properly closed
        if (!cleanedJson.endsWith('}')) {
          const lastBraceIndex = cleanedJson.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            cleanedJson = cleanedJson.substring(0, lastBraceIndex + 1);
          }
        }
        
        try {
          const parsed = JSON.parse(cleanedJson);
          // If the parsed object has a 'config' property, extract it
          if (parsed.config) {
            return { success: true, config: parsed.config };
          }
          return { success: true, config: parsed };
        } catch (e) {
          console.error('Failed to parse cleaned JSON:', e);
          
          // Fallback: try to find the actual JSON start
          const jsonStartIndex = cleanedJson.indexOf('{"');
          if (jsonStartIndex >= 0) {
            const jsonEndIndex = cleanedJson.lastIndexOf('}');
            if (jsonEndIndex > jsonStartIndex) {
              const extractedJson = cleanedJson.substring(jsonStartIndex, jsonEndIndex + 1);
              try {
                const parsed = JSON.parse(extractedJson);
                if (parsed.config) {
                  return { success: true, config: parsed.config };
                }
                return { success: true, config: parsed };
              } catch (e2) {
                console.error('Failed to parse extracted JSON:', e2);
                console.log('Extracted JSON:', extractedJson);
              }
            }
          }
          
          // Last resort: try to parse the original string with aggressive cleaning
          try {
            // The response starts with "fig": so we need to find the actual JSON
            const jsonStartIndex = jsonString.indexOf('{"');
            if (jsonStartIndex >= 0) {
              // Find the last complete JSON object by counting braces
              let braceCount = 0;
              let endIndex = jsonStartIndex;
              let inString = false;
              let escapeNext = false;
              
              for (let i = jsonStartIndex; i < jsonString.length; i++) {
                const char = jsonString[i];
                
                if (escapeNext) {
                  escapeNext = false;
                  continue;
                }
                
                if (char === '\\') {
                  escapeNext = true;
                  continue;
                }
                
                if (char === '"' && !escapeNext) {
                  inString = !inString;
                  continue;
                }
                
                if (!inString) {
                  if (char === '{') {
                    braceCount++;
                  } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      endIndex = i;
                      break;
                    }
                  }
                }
              }
              
              if (braceCount === 0) {
                const finalJson = jsonString.substring(jsonStartIndex, endIndex + 1);
                console.log('Final extracted JSON:', finalJson);
                const parsed = JSON.parse(finalJson);
                if (parsed.config) {
                  return { success: true, config: parsed.config };
                }
                return { success: true, config: parsed };
              }
            }
          } catch (e3) {
            console.error('Failed to parse aggressively cleaned JSON:', e3);
          }
          
          return { success: false, message: 'Failed to parse configuration' };
        }
      }
      
      return { success: false, message: 'Empty config received' };
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  // Get version
  async getVersion(token?: string): Promise<any> {
    try {
      // Use the gRPC-Web endpoint directly
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/grpc/xyz.aspens.arborter_config.v1.ConfigService/GetVersion`, {
        method: 'POST',  // gRPC-Web requires POST method
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'X-Grpc-Web': '1',
          ...(token ? { 'Authorization': token } : {})
        },
        body: new Uint8Array(0)  // Empty message for GetVersion
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the gRPC-Web response
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Skip the gRPC-Web header (5 bytes) and parse the actual message
      if (bytes.length > 5) {
        const dataBytes = bytes.slice(5);
        const jsonString = new TextDecoder().decode(dataBytes);
        try {
          const parsed = JSON.parse(jsonString);
          return { success: true, version: parsed };
        } catch (e) {
          console.error('Failed to parse version response:', e);
          return { success: false, message: 'Failed to parse version' };
        }
      }
      
      return { success: false, message: 'Empty version received' };
    } catch (error) {
      console.error('Error fetching version:', error);
      throw error;
    }
  }
};

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('API connection successful:', data);
      return true;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}