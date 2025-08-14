// Arborter gRPC Types
export interface OrderbookRequest {
  continue_stream: boolean;
  market_id: string;
  historical_open_orders?: boolean;
  filter_by_trader?: string;
}

export interface TradeRequest {
  continue_stream: boolean;
  market_id: string;
  historical_closed_trades?: boolean;
  filter_by_trader?: string;
}

// Protobuf Orderbook Entry - matches the backend structure
export interface ProtobufOrderbookEntry {
  timestamp: number;           // Field 1: uint64 timestamp
  order_id: number;           // Field 2: uint64 order_id  
  price: string;              // Field 3: string price
  quantity: string;           // Field 4: string quantity
  side: number;               // Field 5: uint32 side (1 = BID, 2 = ASK)
  maker_base_address: string; // Field 6: string maker_base_address
  maker_quote_address: string; // Field 7: string maker_quote_address
  status: number;             // Field 8: uint32 status (1 = ADDED, 2 = UPDATED, 3 = REMOVED)
  market_id: string;          // Field 9: string market_id
}

export interface OrderbookEntry {
  timestamp: number;
  order_id: number;
  price: string;
  quantity: string;
  side: number; // 1 = BID, 2 = ASK
  maker_base_address: string;
  maker_quote_address: string;
  status: number; // 1 = ADDED, 2 = UPDATED, 3 = REMOVED
  market_id: string;
}

// Add TradeRole enum
export enum TradeRole {
  TRADE_ROLE_UNSPECIFIED = 0,
  MAKER = 1,
  TAKER = 2,
}

export interface ProtobufTrade {
  timestamp: number;           // Field 1: uint64 timestamp
  price: string;              // Field 2: string price
  qty: string;                // Field 3: string qty
  maker_id: string;           // Field 4: string maker_id (renamed from maker)
  taker_id: string;           // Field 5: string taker_id (renamed from taker)
  maker_base_address: string; // Field 6: string maker_base_address
  maker_quote_address: string; // Field 7: string maker_quote_address
  taker_base_address: string; // Field 8: string taker_base_address (new)
  taker_quote_address: string; // Field 9: string taker_quote_address (new)
  buyer_is: TradeRole;        // Field 10: TradeRole buyer_is (new)
  seller_is: TradeRole;       // Field 11: TradeRole seller_is (new)
  order_hit: number;          // Field 12: uint64 order_hit (moved from 10)
}

export interface Trade {
  timestamp: number;
  price: string;
  qty: string;
  maker_id: string;
  taker_id: string;
  maker_base_address: string;
  maker_quote_address: string;
  taker_base_address: string;
  taker_quote_address: string;
  buyer_is: TradeRole;
  seller_is: TradeRole;
  order_hit: number;
}

export interface TradeResponse {
  success: boolean;
  data?: Trade[];
  error?: string;
}

export interface OrderbookResponse {
  success: boolean;
  data: OrderbookEntry[];
  error?: string;
}

// Environment variable for gRPC-Web proxy URL
const GRPC_WEB_PROXY_URL = import.meta.env.VITE_GRPC_WEB_PROXY_URL || 'http://localhost:8811';
console.log('Environment variable VITE_GRPC_WEB_PROXY_URL:', import.meta.env.VITE_GRPC_WEB_PROXY_URL);
console.log('Using GRPC_WEB_PROXY_URL:', GRPC_WEB_PROXY_URL);

// Legacy types for backward compatibility
interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  tradePrecision: number;
}

interface TradeContract {
  address: string;
}

interface Chain {
  architecture: string;
  canonicalName: string;
  network: string;
  chainId: number;
  contractOwnerAddress: string;
  explorerUrl?: string;
  rpcUrl: string;
  serviceAddress: string;
  tradeContract: TradeContract;
  tokens: Record<string, Token>;
  baseOrQuote: string;
}

interface Market {
  slug: string;
  name: string;
  baseChainNetwork: string;
  quoteChainNetwork: string;
  baseChainTokenSymbol: string;
  quoteChainTokenSymbol: string;
  baseChainTokenDecimals: number;
  quoteChainTokenDecimals: number;
  pairDecimals: number;
  marketId: string;
}

interface ConfigResponse {
  config: {
    chains: Chain[];
    markets: Market[];
  };
}

// Simple gRPC-Web client using Connect-Web transport
class ConnectGrpcWebClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Helper function to concatenate Uint8Arrays
  private concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    
    return result;
  }

  // Simple protobuf encoder for SendOrderRequest
  private encodeOrderProtobuf(data: any): Uint8Array {
    console.log('=== ENCODING SENDORDERREQUEST ===');
    console.log('Input data:', data);
    
    const fields: Uint8Array[] = [];
    
    // Helper function to encode varint
    const encodeVarint = (value: number): Uint8Array => {
      const bytes: number[] = [];
      let val = value;
      while (val >= 0x80) {
        bytes.push((val & 0x7F) | 0x80);
        val = val >>> 7;
      }
      bytes.push(val & 0x7F);
      return new Uint8Array(bytes);
    };

    // Helper function to encode string field
    const encodeStringField = (fieldNumber: number, value: string): Uint8Array => {
      const tag = (fieldNumber << 3) | 2; // Wire type 2 = Length-delimited
      const tagBytes = encodeVarint(tag);
      const valueBytes = new TextEncoder().encode(value);
      const lengthBytes = encodeVarint(valueBytes.length);
      
      const result = new Uint8Array(tagBytes.length + lengthBytes.length + valueBytes.length);
      result.set(tagBytes, 0);
      result.set(lengthBytes, tagBytes.length);
      result.set(valueBytes, tagBytes.length + lengthBytes.length);
      return result;
    };

    const encodeBytesField = (fieldNumber: number, value: Uint8Array): Uint8Array => {
      const tag = (fieldNumber << 3) | 2; // Wire type 2 = Length-delimited
      const tagBytes = encodeVarint(tag);
      const lengthBytes = encodeVarint(value.length);
      
      const result = new Uint8Array(tagBytes.length + lengthBytes.length + value.length);
      result.set(tagBytes, 0);
      result.set(lengthBytes, tagBytes.length);
      result.set(value, tagBytes.length + lengthBytes.length);
      return result;
    };

    // Helper function to encode varint field
    const encodeVarintField = (fieldNumber: number, value: number): Uint8Array => {
      const tag = (fieldNumber << 3) | 0; // wire type 0 for varint
      const tagBytes = encodeVarint(tag);
      const valueBytes = encodeVarint(value);
      const result = new Uint8Array(tagBytes.length + valueBytes.length);
      result.set(tagBytes, 0);
      result.set(valueBytes, tagBytes.length);
      return result;
    };

    // Helper function to encode nested message field
    const encodeMessageField = (fieldNumber: number, messageBytes: Uint8Array): Uint8Array => {
      const tag = (fieldNumber << 3) | 2; // wire type 2 for length-delimited
      const tagBytes = encodeVarint(tag);
      const lengthBytes = encodeVarint(messageBytes.length);
      const result = new Uint8Array(tagBytes.length + lengthBytes.length + messageBytes.length);
      result.set(tagBytes, 0);
      result.set(lengthBytes, tagBytes.length);
      result.set(messageBytes, tagBytes.length + lengthBytes.length);
      return result;
    };

    // First, encode the order as a nested message
    const orderFields: Uint8Array[] = [];
    
    console.log('Encoding order fields...');
    
    // Encode order fields (assuming field numbers based on common patterns)
    if (data.order.side !== undefined) {
      console.log('Encoding side:', data.order.side);
      orderFields.push(encodeVarintField(1, data.order.side));
    }
    if (data.order.quantity !== undefined) {
      console.log('Encoding quantity:', data.order.quantity);
      orderFields.push(encodeStringField(2, data.order.quantity));
    }
    if (data.order.price !== undefined && data.order.price !== '') {
      console.log('Encoding price:', data.order.price);
      orderFields.push(encodeStringField(3, data.order.price));
    } else {
      console.log('Skipping price field (market order or empty price)');
    }
    if (data.order.market_id !== undefined) {
      console.log('Encoding market_id:', data.order.market_id);
      orderFields.push(encodeStringField(4, data.order.market_id));
    }
    if (data.order.base_account_address !== undefined) {
      console.log('Encoding base_account_address:', data.order.base_account_address);
      orderFields.push(encodeStringField(5, data.order.base_account_address));
    }
    if (data.order.quote_account_address !== undefined) {
      console.log('Encoding quote_account_address:', data.order.quote_account_address);
      orderFields.push(encodeStringField(6, data.order.quote_account_address));
    }
    if (data.order.execution_type !== undefined) {
      console.log('Encoding execution_type:', data.order.execution_type);
      orderFields.push(encodeVarintField(7, data.order.execution_type));
    }
    if (data.order.matching_order_ids && data.order.matching_order_ids.length > 0) {
      console.log('Encoding matching_order_ids:', data.order.matching_order_ids);
      for (const orderId of data.order.matching_order_ids) {
        orderFields.push(encodeVarintField(8, orderId));
      }
    }

    // Combine order fields
    const orderBytes = this.concatenateUint8Arrays(orderFields);
    console.log('Order bytes length:', orderBytes.length);
    
    // Now encode the SendOrderRequest with the order as field 1
    fields.push(encodeMessageField(1, orderBytes));
    
    // Add signature as field 2
    if (data.signature_hash !== undefined) {
      console.log('Encoding signature_hash:', data.signature_hash);
      fields.push(encodeBytesField(2, data.signature_hash));
    }

    // Combine all fields
    const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const field of fields) {
      result.set(field, offset);
      offset += field.length;
    }
    
    console.log('Final protobuf bytes length:', result.length);
    console.log('=== END ENCODING ===');
    
    return result;
  }

  // Common protobuf encoding utilities
  private encodeVarint(value: number): Uint8Array {
    const bytes: number[] = [];
    while (value >= 0x80) {
      bytes.push((value & 0x7F) | 0x80);
      value >>>= 7;
    }
    bytes.push(value & 0x7F);
    return new Uint8Array(bytes);
  }

  private encodeStringField(fieldNumber: number, value: string): Uint8Array {
    const stringBytes = new TextEncoder().encode(value);
    const fieldHeader = this.encodeVarint((fieldNumber << 3) | 2); // Wire type 2 = length-delimited
    const lengthBytes = this.encodeVarint(stringBytes.length);
    return this.concatenateUint8Arrays([fieldHeader, lengthBytes, stringBytes]);
  }

  private encodeBoolField(fieldNumber: number, value: boolean): Uint8Array {
    const fieldHeader = this.encodeVarint((fieldNumber << 3) | 0); // Wire type 0 = varint
    const valueBytes = this.encodeVarint(value ? 1 : 0);
    return this.concatenateUint8Arrays([fieldHeader, valueBytes]);
  }

  // Encode OrderbookRequest as protobuf
  private encodeOrderbookRequest(data: OrderbookRequest): Uint8Array {
    const parts: Uint8Array[] = [];

    // Field 1: continue_stream (bool)
    parts.push(this.encodeBoolField(1, data.continue_stream));

    // Field 2: market_id (string)
    parts.push(this.encodeStringField(2, data.market_id));

    // Field 3: historical_open_orders (optional bool)
    if (data.historical_open_orders !== undefined) {
      parts.push(this.encodeBoolField(3, data.historical_open_orders));
    }

    // Field 4: filter_by_trader (optional string)
    if (data.filter_by_trader !== undefined) {
      parts.push(this.encodeStringField(4, data.filter_by_trader));
    }

    return this.concatenateUint8Arrays(parts);
  }

  // Encode TradeRequest as protobuf
  private encodeTradeRequest(data: TradeRequest): Uint8Array {
    const parts: Uint8Array[] = [];

    // Field 1: continue_stream (bool)
    parts.push(this.encodeBoolField(1, data.continue_stream));

    // Field 2: market_id (string)
    parts.push(this.encodeStringField(2, data.market_id));

    // Field 3: historical_closed_trades (optional bool)
    if (data.historical_closed_trades !== undefined) {
      parts.push(this.encodeBoolField(3, data.historical_closed_trades));
    }

    // Field 4: filter_by_trader (optional string)
    if (data.filter_by_trader !== undefined) {
      parts.push(this.encodeStringField(4, data.filter_by_trader));
    }

    return this.concatenateUint8Arrays(parts);
  }

  async call(service: string, method: string, data: any = {}) {
    console.log(`Connect gRPC-Web client making request to: ${service}/${method}`);
    
    try {
      const url = `${this.baseUrl}/${service}/${method}`;
      
      // Create proper gRPC-Web request body
      let requestBody: Uint8Array;
      if (Object.keys(data).length === 0) {
        // For empty requests (like GetConfig), send empty protobuf frame
        // gRPC-Web frame: [1 byte flag][4 bytes length][message]
        requestBody = new Uint8Array(5);
        requestBody[0] = 0; // No compression flag
        requestBody[1] = 0; // Length bytes (big-endian) - 0 length
        requestBody[2] = 0;
        requestBody[3] = 0;
        requestBody[4] = 0;
      } else {
        // For non-empty requests, create proper protobuf frame
        let messageBytes: Uint8Array;
        
        // Use protobuf encoding for SendOrder, Orderbook, and Trades, JSON for others
        if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'SendOrder') {
          messageBytes = this.encodeOrderProtobuf(data);
        } else if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'Orderbook') {
          messageBytes = this.encodeOrderbookRequest(data);
        } else if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'Trades') {
          messageBytes = this.encodeTradeRequest(data);
        } else {
          messageBytes = new TextEncoder().encode(JSON.stringify(data));
        }
        
        const messageLength = messageBytes.length;
        
        requestBody = new Uint8Array(5 + messageLength);
        requestBody[0] = 0; // No compression flag
        requestBody[1] = (messageLength >>> 24) & 0xFF; // Length bytes (big-endian)
        requestBody[2] = (messageLength >>> 16) & 0xFF;
        requestBody[3] = (messageLength >>> 8) & 0xFF;
        requestBody[4] = messageLength & 0xFF;
        requestBody.set(messageBytes, 5); // Set message after header
      }
      
      // Use the browser's fetch directly with Connect-Web headers
      // For streaming methods, don't use timeout
      const isStreamingMethod = service === 'xyz.aspens.arborter.v1.ArborterService' && (method === 'Orderbook' || method === 'Trades');
      
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': isStreamingMethod ? 'application/grpc-web+proto' : 'application/grpc-web+proto',
          'X-Grpc-Web': '1',
        },
        body: requestBody,
      };
      
      // Only add timeout for non-streaming methods
      if (!isStreamingMethod) {
        // Use longer timeout for SendOrder method
        const timeoutMs = (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'SendOrder') ? 30000 : 8000;
        fetchOptions.signal = AbortSignal.timeout(timeoutMs);
      } else {
        // For streaming methods, use a shorter timeout to prevent hanging
        fetchOptions.signal = AbortSignal.timeout(100);
      }
      
      const response = await fetch(url, fetchOptions);

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
      
      // For streaming methods, handle differently
      if (isStreamingMethod) {
        console.log(`Handling streaming response for ${method}`);
        console.log(`Service: ${service}, Method: ${method}, isStreamingMethod: ${isStreamingMethod}`);
        // For streaming, we need to read the response as a stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available for streaming');
        }
        
        const entries: any[] = [];
        
        try {
          // Read all chunks from the stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream ended normally');
              break;
            }
            
            // Reduced logging for performance
            console.log('Streaming response chunk, length:', value?.length);
            
            // For gRPC-Web streaming, each chunk is a separate frame
            // Process each frame in the chunk
            let offset = 0;
            while (offset < value.length) {
              // Check if we have enough bytes for a frame header
              if (offset + 5 > value.length) {
                console.log('Incomplete frame header, breaking');
                break;
              }
              
              const flag = value[offset];
              const length = (value[offset + 1] << 24) | (value[offset + 2] << 16) | (value[offset + 3] << 8) | value[offset + 4];
              // Reduced logging for performance
              
              if (length > 0 && offset + 5 + length <= value.length) {
                const messageBytes = value.slice(offset + 5, offset + 5 + length);
                
                // Parse this individual message based on method
                console.log(`Parsing message for method: ${method}`);
                if (method === 'Orderbook') {
                  console.log('Using orderbook parser');
                  const messageEntries = this.parseOrderbookStreamResponse(messageBytes);
                  entries.push(...messageEntries);
                } else if (method === 'Trades') {
                  console.log('Using trades parser');
                  const messageTrades = this.parseTradeStreamResponse(messageBytes);
                  entries.push(...messageTrades);
                } else {
                  console.log(`Unknown method: ${method}, using orderbook parser as fallback`);
                  const messageEntries = this.parseOrderbookStreamResponse(messageBytes);
                  entries.push(...messageEntries);
                }
                
                offset += 5 + length;
              } else {
                console.log('Incomplete frame, breaking');
                break;
              }
            }
          }
        } catch (streamError) {
          console.log('Stream reading error (this is normal for incomplete streams):', streamError);
          // Don't throw here - we want to return whatever data we got
        } finally {
          reader.releaseLock();
        }
        
        console.log(`Total ${method} entries from stream:`, entries.length);
        return entries;
      }
      
      // Get response as array buffer for binary processing (non-streaming)
      const arrayBuffer = await response.arrayBuffer();
      const responseBytes = new Uint8Array(arrayBuffer);
      
      console.log(`gRPC response bytes length: ${responseBytes.length}`);
      console.log(`gRPC response bytes (first 100):`, Array.from(responseBytes.slice(0, 100)));
      
      // Try to decode as text for debugging
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(responseBytes);
        console.log(`gRPC response as text:`, text);
      } catch (error) {
        console.log(`Could not decode response as text:`, error);
      }
      
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
          // For GetConfig, parse as protobuf
          if (service === 'xyz.aspens.arborter_config.v1.ConfigService' && method === 'GetConfig') {
            return this.parseGetConfigResponse(messageBytes);
          }
          
          // For Orderbook, handle as streaming response
          if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'Orderbook') {
            console.log('Handling orderbook response...');
            try {
              const messageText = new TextDecoder().decode(messageBytes);
              console.log(`Orderbook response text:`, messageText);
              
              // Try to parse as JSON first
              const parsed = JSON.parse(messageText);
              console.log('Parsed orderbook response as JSON:', parsed);
              
              // If it's an array, return it directly
              if (Array.isArray(parsed)) {
                console.log('Orderbook response is array, returning directly');
                return parsed;
              }
              
              // If it has a data field, return that
              if (parsed && parsed.data) {
                console.log('Orderbook response has data field, returning data');
                return Array.isArray(parsed.data) ? parsed.data : [parsed.data];
              }
              
              // Otherwise return the parsed object
              console.log('Orderbook response is object, returning as is');
              return parsed;
            } catch (error) {
              console.warn('Failed to parse orderbook as JSON, trying protobuf:', error);
              // Fallback to protobuf parsing if JSON fails
              return this.parseOrderbookStreamResponse(responseBytes);
            }
          }
          
          // For Trades, handle as streaming response
          if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'Trades') {
            console.log('Handling trades response...');
            try {
              const messageText = new TextDecoder().decode(messageBytes);
              console.log(`Trades response text:`, messageText);
              
              // Try to parse as JSON first
              const parsed = JSON.parse(messageText);
              console.log('Parsed trades response as JSON:', parsed);
              
              // If it's an array, return it directly
              if (Array.isArray(parsed)) {
                console.log('Trades response is array, returning directly');
                return parsed;
              }
              
              // If it has a data field, return that
              if (parsed && parsed.data) {
                console.log('Trades response has data field, returning data');
                return Array.isArray(parsed.data) ? parsed.data : [parsed.data];
              }
              
              // Otherwise return the parsed object
              console.log('Trades response is object, returning as is');
              return parsed;
            } catch (error) {
              console.warn('Failed to parse trades as JSON, trying protobuf:', error);
              // Fallback to protobuf parsing if JSON fails
              return this.parseTradeStreamResponse(responseBytes);
            }
          }
          
          // For other methods, try JSON parsing
          const messageText = new TextDecoder().decode(messageBytes);
          console.log(`gRPC response message text:`, messageText);
          return this.extractConfigFromText(messageText);
        }
      }
      
      console.log('No valid message in response');
      return {};
    } catch (error) {
      console.error('Connect gRPC-Web call failed:', error);
      
      // Handle timeout specifically
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.warn('gRPC call timed out, this might indicate the backend method is not implemented or is slow');
        throw new Error(`gRPC call timed out: ${error.message}`);
      }
      
      throw error;
    }
  }

  // Parse GetConfig response using protobuf classes
  parseGetConfigResponse(messageBytes: Uint8Array): ConfigResponse {
    try {
      console.log('Parsing protobuf config response, bytes length:', messageBytes.length);
      
      // Use manual protobuf parsing to parse the response
      const config = this.parseProtobufManually(messageBytes);
      
      console.log('Successfully parsed protobuf config:', config);
      return config;
      
    } catch (error) {
      console.error('Failed to parse protobuf response:', error);
      throw error;
    }
  }



  // Manual protobuf parsing with better field detection
  parseProtobufManually(bytes: Uint8Array): ConfigResponse {
    let offset = 0;
    const config: ConfigResponse = { config: { chains: [], markets: [] } };

    console.log('parseProtobufManually: Starting to parse', bytes.length, 'bytes');

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      console.log('parseProtobufManually: Field', fieldNumber, 'wireType', wireType, 'value length', value instanceof Uint8Array ? value.length : 'not array');
      offset = newOffset;

      if (fieldNumber === 1) { // config field
        console.log('parseProtobufManually: Parsing config message, value length:', value.length);
        const configData = this.parseConfigMessage(value);
        if (configData) {
          config.config = configData;
        }
      }
    }

    console.log('parseProtobufManually: Final config:', config);
    return config;
  }

  // Parse a single protobuf field
  parseProtobufField(bytes: Uint8Array, offset: number): { fieldNumber: number, wireType: number, value: any, newOffset: number } {
    const tag = this.readVarint(bytes, offset);
    const fieldNumber = tag >> 3;
    const wireType = tag & 0x7;
    offset += this.varintLength(tag);

    console.log('parseProtobufField: Tag', tag, 'fieldNumber', fieldNumber, 'wireType', wireType, 'offset', offset);

    let value: any;
    if (wireType === 0) { // Varint
      const varint = this.readVarint(bytes, offset);
      value = varint;
      offset += this.varintLength(varint);
      console.log('parseProtobufField: Varint value:', varint);
    } else if (wireType === 1) { // 64-bit
      value = this.readBytes(bytes, offset, 8);
      offset += 8;
      console.log('parseProtobufField: 64-bit value length:', value.length);
    } else if (wireType === 2) { // Length-delimited
      const length = this.readVarint(bytes, offset);
      offset += this.varintLength(length);
      value = this.readBytes(bytes, offset, length);
      offset += length;
      console.log('parseProtobufField: Length-delimited value length:', length);
    } else if (wireType === 3) { // Start group (deprecated, but we should handle it gracefully)
      console.warn(`Wire type 3 (start group) encountered at field ${fieldNumber}, skipping`);
      // Skip to the end of the group (wire type 4)
      let groupOffset = offset;
      while (groupOffset < bytes.length) {
        const groupTag = this.readVarint(bytes, groupOffset);
        const groupWireType = groupTag & 0x7;
        if (groupWireType === 4) { // End group
          offset = groupOffset + this.varintLength(groupTag);
          break;
        }
        // Skip the field
        groupOffset += this.varintLength(groupTag);
        if (groupWireType === 0) { // Varint
          const varintValue = this.readVarint(bytes, groupOffset);
          groupOffset += this.varintLength(varintValue);
        } else if (groupWireType === 2) { // Length-delimited
          const length = this.readVarint(bytes, groupOffset);
          groupOffset += this.varintLength(length) + length;
        } else {
          groupOffset += 8; // Fixed64
        }
      }
      value = null; // Skip this field
    } else if (wireType === 4) { // End group (deprecated)
      console.warn(`Wire type 4 (end group) encountered, skipping`);
      value = null;
    } else if (wireType === 5) { // 32-bit
      value = this.readBytes(bytes, offset, 4);
      offset += 4;
      console.log('parseProtobufField: 32-bit value length:', value.length);
    } else {
      throw new Error(`Unsupported wire type: ${wireType}`);
    }

    return { fieldNumber, wireType, value, newOffset: offset };
  }

  // Parse Config message (contains chains and markets)
  parseConfigMessage(bytes: Uint8Array): { chains: Chain[]; markets: Market[] } {
    let offset = 0;
    const configData: { chains: Chain[]; markets: Market[] } = { chains: [], markets: [] };

    console.log('parseConfigMessage: Starting to parse config, bytes length:', bytes.length);

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      console.log('parseConfigMessage: Field', fieldNumber, 'wireType', wireType, 'value length', value instanceof Uint8Array ? value.length : 'not array');
      offset = newOffset;

      if (fieldNumber === 1) { // chains field
        console.log('parseConfigMessage: Parsing chain message, value length:', value.length);
        const chain = this.parseChainMessage(value);
        if (chain) configData.chains.push(chain);
      } else if (fieldNumber === 2) { // markets field
        console.log('parseConfigMessage: Parsing market message, value length:', value.length);
        const market = this.parseMarketMessage(value);
        if (market) configData.markets.push(market);
      }
    }

    console.log('parseConfigMessage: Final config data:', configData);
    return configData;
  }

  // Parse Chain message
  parseChainMessage(bytes: Uint8Array): Chain | null {
    let offset = 0;
    const chain: any = { tokens: {} };

    console.log('parseChainMessage: Starting to parse chain, bytes length:', bytes.length);

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      console.log('parseChainMessage: Field', fieldNumber, 'wireType', wireType, 'value type:', typeof value, 'value length:', value instanceof Uint8Array ? value.length : 'N/A');
      offset = newOffset;

      switch (fieldNumber) {
        case 1: // architecture
          chain.architecture = this.decodeString(value);
          console.log('parseChainMessage: Set architecture to:', chain.architecture);
          break;
        case 2: // canonical_name
          chain.canonicalName = this.decodeString(value);
          console.log('parseChainMessage: Set canonicalName to:', chain.canonicalName);
          break;
        case 3: // network
          chain.network = this.decodeString(value);
          console.log('parseChainMessage: Set network to:', chain.network);
          break;
        case 4: // chain_id
          chain.chainId = value;
          console.log('parseChainMessage: Set chainId to:', chain.chainId);
          break;
        case 5: // contract_owner_address
          chain.contractOwnerAddress = this.decodeString(value);
          console.log('parseChainMessage: Set contractOwnerAddress to:', chain.contractOwnerAddress);
          break;
        case 6: // explorer_url
          chain.explorerUrl = this.decodeString(value);
          console.log('parseChainMessage: Set explorerUrl to:', chain.explorerUrl);
          break;
        case 7: // rpc_url
          chain.rpcUrl = this.decodeString(value);
          console.log('parseChainMessage: Set rpcUrl to:', chain.rpcUrl);
          break;
        case 8: // service_address
          chain.serviceAddress = this.decodeString(value);
          console.log('parseChainMessage: Set serviceAddress to:', chain.serviceAddress);
          break;
        case 9: // trade_contract
          chain.tradeContract = this.parseTradeContractMessage(value);
          console.log('parseChainMessage: Set tradeContract to:', chain.tradeContract);
          break;
        case 10: // tokens
          const tokenEntry = this.parseTokenMapEntry(value);
          if (tokenEntry) {
            chain.tokens[tokenEntry.key] = tokenEntry.value;
            console.log('parseChainMessage: Added token:', tokenEntry.key, tokenEntry.value);
          }
          break;
        case 11: // base_or_quote
          chain.baseOrQuote = this.decodeEnum(value);
          console.log('parseChainMessage: Set baseOrQuote to:', chain.baseOrQuote);
          break;
      }
    }

    console.log('parseChainMessage: Final chain object:', chain);
    return chain;
  }

  // Parse Market message
  parseMarketMessage(bytes: Uint8Array): Market | null {
    let offset = 0;
    const market: any = {};

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      offset = newOffset;

      switch (fieldNumber) {
        case 1: // slug
          market.slug = this.decodeString(value);
          break;
        case 2: // name
          market.name = this.decodeString(value);
          break;
        case 3: // base_chain_network
          market.baseChainNetwork = this.decodeString(value);
          break;
        case 4: // quote_chain_network
          market.quoteChainNetwork = this.decodeString(value);
          break;
        case 5: // base_chain_token_symbol
          market.baseChainTokenSymbol = this.decodeString(value);
          break;
        case 6: // quote_chain_token_symbol
          market.quoteChainTokenSymbol = this.decodeString(value);
          break;
        case 7: // base_chain_token_decimals
          market.baseChainTokenDecimals = value;
          break;
        case 8: // quote_chain_token_decimals
          market.quoteChainTokenDecimals = value;
          break;
        case 9: // pair_decimals
          market.pairDecimals = value;
          break;
        case 10: // market_id
          market.marketId = this.decodeString(value);
          break;
      }
    }

    return market;
  }

  // Parse TradeContract message
  parseTradeContractMessage(bytes: Uint8Array): TradeContract | null {
    let offset = 0;
    const tradeContract: any = {};

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      offset = newOffset;

      switch (fieldNumber) {
        case 1: // contract_id
          tradeContract.contractId = this.decodeString(value);
          break;
        case 2: // address
          tradeContract.address = this.decodeString(value);
          break;
      }
    }

    return tradeContract;
  }

  // Parse Token message
  parseTokenMessage(bytes: Uint8Array): Token | null {
    let offset = 0;
    const token: any = {};

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      offset = newOffset;

      switch (fieldNumber) {
        case 1: // name
          token.name = this.decodeString(value);
          break;
        case 2: // symbol
          token.symbol = this.decodeString(value);
          break;
        case 3: // address
          token.address = this.decodeString(value);
          break;
        case 4: // token_id
          token.tokenId = this.decodeString(value);
          break;
        case 5: // decimals
          token.decimals = value;
          break;
        case 6: // trade_precision
          token.tradePrecision = value;
          break;
      }
    }

    return token;
  }

  // Parse token map entry (key-value pair)
  parseTokenMapEntry(bytes: Uint8Array): { key: string, value: any } | null {
    let offset = 0;
    let key = '';
    let value: any = null;

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value: fieldValue, newOffset } = this.parseProtobufField(bytes, offset);
      offset = newOffset;

      if (fieldNumber === 1) { // key
        key = this.decodeString(fieldValue);
      } else if (fieldNumber === 2) { // value
        value = this.parseTokenMessage(fieldValue);
      }
    }

    return key && value ? { key, value } : null;
  }

  // Helper methods for protobuf parsing
  readVarint(bytes: Uint8Array, offset: number): number {
    let result = 0;
    let shift = 0;
    let currentOffset = offset;
    
    while (currentOffset < bytes.length) {
      const byte = bytes[currentOffset];
      result |= (byte & 0x7F) << shift;
      currentOffset++;
      
      if ((byte & 0x80) === 0) break;
      shift += 7;
      
      // Allow 64-bit varints for timestamps
      if (shift >= 64) {
        console.warn('Varint too large, truncating');
        break;
      }
    }
    
    return result;
  }

  varintLength(value: number): number {
    let length = 1;
    while (value >= 0x80) {
      value >>= 7;
      length++;
    }
    return length;
  }

  readBytes(bytes: Uint8Array, offset: number, length: number): Uint8Array {
    return bytes.slice(offset, offset + length);
  }

  decodeString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  decodeEnum(value: number): string {
    // Map enum values to strings based on the protobuf definition
    switch (value) {
      case 0: return 'BASE_OR_QUOTE_UNSPECIFIED';
      case 1: return 'BASE_OR_QUOTE_BASE';
      case 2: return 'BASE_OR_QUOTE_QUOTE';
      default: return `UNKNOWN_${value}`;
    }
  }

  // Extract config data from the protobuf binary content
  extractConfigFromText(text: string): any {
    console.log('Extracting config data from protobuf binary content');
    console.log('Raw text length:', text.length);
    console.log('Raw text (first 500 chars):', text.substring(0, 500));
    
    // This is binary protobuf data, not text
    // We need to parse it as protobuf binary format
    try {
      // Convert string back to Uint8Array for parsing
      const bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i);
      }
      
      return this.parseProtobufManually(bytes);
      
    } catch (error) {
      console.error('Failed to parse protobuf binary data:', error);
      return { 
        success: false, 
        error: 'Could not parse protobuf binary response',
        rawText: text.substring(0, 1000) // Include first 1000 chars for debugging
      };
    }
  }

  // Parse Orderbook stream response (protobuf binary format)
  parseOrderbookStreamResponse(responseBytes: Uint8Array): ProtobufOrderbookEntry[] {
    console.log('Parsing Orderbook stream response, bytes length:', responseBytes.length);
    
    // If response is empty, return empty array
    if (responseBytes.length === 0) {
      console.log('Empty response received, returning empty array');
      return [];
    }
    
    // Try to parse as JSON first (fallback)
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(responseBytes);
      console.log('Orderbook stream response text:', text);
      
      const parsed = JSON.parse(text);
      console.log('Parsed orderbook response as JSON:', parsed);
      
      // If it's an array, return it directly
      if (Array.isArray(parsed)) {
        return parsed as ProtobufOrderbookEntry[];
      }
      
      // If it has a data property, return that
      if (parsed && parsed.data) {
        const data = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
        return data as ProtobufOrderbookEntry[];
      }
      
      // If it's a single object, wrap it in an array
      return [parsed as ProtobufOrderbookEntry];
      
    } catch (error) {
      console.log('Not JSON, parsing as protobuf binary format');
      
      // Parse as protobuf binary format - each message should be a single OrderbookEntry
      try {
        const entry = this.parseOrderbookEntryProtobuf(responseBytes);
        if (entry) {
          console.log('Successfully parsed single orderbook entry:', entry);
          return [entry];
        } else {
          console.log('Failed to parse orderbook entry from protobuf');
          return [];
        }
      } catch (protobufError) {
        console.error('Failed to parse Orderbook stream response as protobuf:', protobufError);
        
        // Last resort: try to parse as a simple protobuf message without frame
        try {
          console.log('Attempting to parse as raw protobuf message');
          const entry = this.parseOrderbookEntryProtobuf(responseBytes);
          if (entry) {
            console.log('Successfully parsed raw protobuf message');
            return [entry];
          }
        } catch (rawError) {
          console.error('Failed to parse as raw protobuf:', rawError);
        }
        
        // Return empty array as fallback
        return [];
      }
    }
  }

  // Parse Trade stream response (protobuf binary format)
  parseTradeStreamResponse(responseBytes: Uint8Array): ProtobufTrade[] {
    console.log('=== parseTradeStreamResponse called ===');
    console.log('Parsing Trade stream response, bytes length:', responseBytes.length);
    
    // If response is empty, return empty array
    if (responseBytes.length === 0) {
      console.log('Empty response received, returning empty array');
      return [];
    }
    
    // Try to parse as JSON first (fallback)
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(responseBytes);
      console.log('Trade stream response text:', text);
      
      const parsed = JSON.parse(text);
      console.log('Parsed trade response as JSON:', parsed);
      
      // If it's an array, return it directly
      if (Array.isArray(parsed)) {
        return parsed as ProtobufTrade[];
      }
      
      // If it has a data property, return that
      if (parsed && parsed.data) {
        const data = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
        return data as ProtobufTrade[];
      }
      
      // If it's a single object, wrap it in an array
      return [parsed as ProtobufTrade];
      
    } catch (error) {
      console.log('Not JSON, parsing as protobuf binary format');
      
      // Parse as protobuf binary format - each message should be a single Trade
      try {
        const trade = this.parseTradeProtobuf(responseBytes);
        if (trade) {
          console.log('Successfully parsed single trade:', trade);
          return [trade];
        } else {
          console.log('Failed to parse trade from protobuf');
          return [];
        }
      } catch (protobufError) {
        console.error('Failed to parse Trade stream response as protobuf:', protobufError);
        
        // Last resort: try to parse as a simple protobuf message without frame
        try {
          console.log('Attempting to parse as raw protobuf message');
          const trade = this.parseTradeProtobuf(responseBytes);
          if (trade) {
            console.log('Successfully parsed raw protobuf message');
            return [trade];
          }
        } catch (rawError) {
          console.error('Failed to parse as raw protobuf:', rawError);
        }
        
        // Return empty array as fallback
        return [];
      }
    }
  }

  // Parse orderbook protobuf binary response
  parseOrderbookProtobufResponse(responseBytes: Uint8Array): ProtobufOrderbookEntry[] {
    console.log('Parsing orderbook protobuf response');
    
    // Based on the hex data we've seen, let's try a simpler approach
    // The data seems to be: [gRPC frame][protobuf message]
    
    let messageBytes = responseBytes;
    
    // Skip gRPC-Web frame if present (first 5 bytes)
    if (responseBytes.length >= 5) {
      const flag = responseBytes[0];
      const length = (responseBytes[1] << 24) | (responseBytes[2] << 16) | (responseBytes[3] << 8) | responseBytes[4];
      console.log(`gRPC-Web frame: flag=${flag}, length=${length}`);
      
      if (length > 0 && length <= responseBytes.length - 5) {
        messageBytes = responseBytes.slice(5, 5 + length);
        console.log(`Extracted message bytes, length: ${messageBytes.length}`);
      }
    }
    
    // Now try to parse the actual protobuf message
    try {
      const entry = this.parseOrderbookEntryProtobuf(messageBytes);
      if (entry) {
        console.log('Successfully parsed orderbook entry');
        return [entry];
      }
    } catch (error) {
      console.error('Failed to parse protobuf message:', error);
    }
    
    console.log('No valid orderbook entries found');
    return [];
  }

  // Parse individual orderbook entry from protobuf
  parseOrderbookEntryProtobuf(messageBytes: Uint8Array): ProtobufOrderbookEntry | null {
    try {
      console.log('Parsing orderbook entry protobuf, bytes length:', messageBytes.length);
      console.log('First 20 bytes:', Array.from(messageBytes.slice(0, 20)));
      console.log('All bytes as hex:', Array.from(messageBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      let offset = 0;
      const entry: Partial<ProtobufOrderbookEntry> = {};
      const allFields: any = {};
      
      while (offset < messageBytes.length) {
        try {
          // Read field number and wire type
          const tag = this.readVarint(messageBytes, offset);
          const fieldNumber = tag >> 3;
          const wireType = tag & 0x7;
          
          console.log(`Field ${fieldNumber}, wire type ${wireType} at offset ${offset}, tag: ${tag}`);
          
          // Read the field value based on wire type
          let value: any;
          let newOffset: number;
          
          if (wireType === 0) { // Varint
            value = this.readVarint(messageBytes, offset + 1);
            newOffset = offset + 1 + this.varintLength(value);
            console.log(`Varint value: ${value}`);
          } else if (wireType === 1) { // 64-bit
            if (offset + 9 > messageBytes.length) break;
            value = this.readBytes(messageBytes, offset + 1, 8);
            newOffset = offset + 9;
            console.log(`64-bit value length: ${value.length}`);
          } else if (wireType === 2) { // Length-delimited
            const length = this.readVarint(messageBytes, offset + 1);
            const lengthBytes = this.varintLength(length);
            value = this.readBytes(messageBytes, offset + 1 + lengthBytes, length);
            newOffset = offset + 1 + lengthBytes + length;
            console.log(`Length-delimited value length: ${length}, decoded:`, this.decodeString(value));
          } else if (wireType === 3) { // Start group (deprecated but still used)
            console.log(`Wire type 3 (start group) at field ${fieldNumber}, skipping`);
            // Skip the start group marker and continue
            newOffset = offset + 1;
          } else if (wireType === 4) { // End group (deprecated but still used)
            console.log(`Wire type 4 (end group) at field ${fieldNumber}, skipping`);
            // Skip the end group marker and continue
            newOffset = offset + 1;
          } else if (wireType === 5) { // 32-bit
            if (offset + 5 > messageBytes.length) break;
            value = this.readBytes(messageBytes, offset + 1, 4);
            newOffset = offset + 5;
            console.log(`32-bit value length: ${value.length}`);
          } else {
            console.log(`Unknown wire type ${wireType}, skipping field ${fieldNumber}`);
            console.log(`Cannot handle wire type ${wireType}, stopping parsing`);
            break;
          }
          
          // Store all fields for debugging
          allFields[fieldNumber] = { value, wireType, offset };
          
          // Map field numbers to field names based on the expected protobuf structure
          switch (fieldNumber) {
            case 1: // timestamp (uint64)
              entry.timestamp = Number(value);
              console.log(`Set timestamp to: ${entry.timestamp}`);
              break;
            case 2: // order_id (uint64)
              entry.order_id = Number(value);
              console.log(`Set order_id to: ${entry.order_id}`);
              break;
            case 3: // price (string)
              entry.price = this.decodeString(value);
              console.log(`Set price to: ${entry.price}`);
              break;
            case 4: // quantity (string)
              entry.quantity = this.decodeString(value);
              console.log(`Set quantity to: ${entry.quantity}`);
              break;
            case 5: // side (uint32)
              entry.side = Number(value);
              console.log(`Set side to: ${entry.side}`);
              break;
            case 6: // maker_base_address (string)
              entry.maker_base_address = this.decodeString(value);
              console.log(`Set maker_base_address to: ${entry.maker_base_address}`);
              break;
            case 7: // maker_quote_address (string)
              entry.maker_quote_address = this.decodeString(value);
              console.log(`Set maker_quote_address to: ${entry.maker_quote_address}`);
              break;
            case 8: // status (uint32)
              entry.status = Number(value);
              console.log(`Set status to: ${entry.status}`);
              break;
            case 9: // market_id (string)
              entry.market_id = this.decodeString(value);
              console.log(`Set market_id to: ${entry.market_id}`);
              break;
            default:
              console.log(`Unknown field number ${fieldNumber}, value:`, value);
              // Try to guess the field type based on the value
              if (wireType === 0) { // varint
                console.log(`Field ${fieldNumber} is a varint with value: ${value}`);
              } else if (wireType === 2) { // length-delimited
                const decoded = this.decodeString(value);
                console.log(`Field ${fieldNumber} is a string with value: "${decoded}"`);
              }
          }
          
          offset = newOffset;
        } catch (fieldError) {
          console.error('Error parsing field at offset', offset, fieldError);
          break;
        }
      }
      
      console.log('All parsed fields:', allFields);
      
      // For now, let's be more lenient and try to construct an entry from what we have
      if (Object.keys(allFields).length > 0) {
        console.log('Attempting to construct orderbook entry from available fields');
        
        // Try to map fields based on their values and types
        const constructedEntry: any = {};
        
        for (const [fieldNum, fieldData] of Object.entries(allFields)) {
          const num = parseInt(fieldNum);
          const { value, wireType } = fieldData as any;
          
          console.log(`Processing field ${num}, wireType ${wireType}, value:`, value);
          
          if (wireType === 0) { // varint
            if (num === 1) constructedEntry.timestamp = Number(value);
            else if (num === 2) constructedEntry.order_id = Number(value);
            else if (num === 5) constructedEntry.side = Number(value);
            else if (num === 8) constructedEntry.status = Number(value);
            else console.log(`Unmapped varint field ${num}: ${value}`);
          } else if (wireType === 2) { // string
            const strValue = this.decodeString(value);
            console.log(`String field ${num}: "${strValue}"`);
            if (num === 3) constructedEntry.price = strValue;
            else if (num === 4) constructedEntry.quantity = strValue;
            else if (num === 6) constructedEntry.maker_base_address = strValue;
            else if (num === 7) constructedEntry.maker_quote_address = strValue;
            else if (num === 9) constructedEntry.market_id = strValue;
            else console.log(`Unmapped string field ${num}: "${strValue}"`);
          }
        }
        
        console.log('Constructed entry:', constructedEntry);
        
        // If we have at least some basic fields, return it
        if (constructedEntry.price || constructedEntry.quantity || constructedEntry.side !== undefined || constructedEntry.timestamp) {
          console.log('Returning constructed orderbook entry with available fields');
          return {
            timestamp: constructedEntry.timestamp || 0,
            order_id: constructedEntry.order_id || 0,
            price: constructedEntry.price || '0',
            quantity: constructedEntry.quantity || '0',
            side: constructedEntry.side || 0,
            maker_base_address: constructedEntry.maker_base_address || '',
            maker_quote_address: constructedEntry.maker_quote_address || '',
            status: constructedEntry.status || 0,
            market_id: constructedEntry.market_id || ''
          };
        }
      }
      
      console.warn('Could not construct valid orderbook entry');
      return null;
      
    } catch (error) {
      console.error('Error parsing orderbook entry protobuf:', error);
      return null;
    }
  }

  // Parse Trade protobuf message
  parseTradeProtobuf(messageBytes: Uint8Array): ProtobufTrade | null {
    console.log('Parsing Trade protobuf message, bytes length:', messageBytes.length);
    
    try {
      // First try to parse as JSON (since the response might be JSON)
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(messageBytes);
        console.log('Trade response as text:', text);
        
        const parsed = JSON.parse(text);
        console.log('Parsed trade as JSON:', parsed);
        
        // Map JSON fields to our ProtobufTrade interface
        const trade = {
          timestamp: parsed.timestamp ? parseInt(parsed.timestamp) : 0,
          price: parsed.price || '0',
          qty: parsed.qty || '0',
          maker_id: parsed.makerId || parsed.maker_id || '',
          taker_id: parsed.takerId || parsed.taker_id || '',
          maker_base_address: parsed.makerBaseAddress || parsed.maker_base_address || '',
          maker_quote_address: parsed.makerQuoteAddress || parsed.maker_quote_address || '',
          taker_base_address: parsed.takerBaseAddress || parsed.taker_base_address || '',
          taker_quote_address: parsed.takerQuoteAddress || parsed.taker_quote_address || '',
          buyer_is: parsed.buyerIs ? parseInt(parsed.buyerIs) : 0,
          seller_is: parsed.sellerIs ? parseInt(parsed.sellerIs) : 0,
          order_hit: parsed.orderHit ? parseInt(parsed.orderHit) : 0
        };
        
        console.log('Parsed trade from JSON:', trade);
        return trade;
      } catch (jsonError) {
        console.log('Not JSON, trying protobuf parsing');
      }
      
      // Fallback to protobuf parsing
      const allFields: Record<number, { value: any; wireType: number }> = {};
      let offset = 0;
      
      while (offset < messageBytes.length) {
        try {
          const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(messageBytes, offset);
          allFields[fieldNumber] = { value, wireType };
          offset = newOffset;
        } catch (fieldError) {
          console.error('Error parsing field at offset', offset, fieldError);
          break;
        }
      }
      
      console.log('All parsed trade fields:', allFields);
      console.log('Field numbers found:', Object.keys(allFields).map(k => parseInt(k)).sort((a, b) => a - b));
      
      // Construct trade from available fields
      if (Object.keys(allFields).length > 0) {
        console.log('Attempting to construct trade from available fields');
        
        const constructedTrade: any = {};
        
        for (const [fieldNum, fieldData] of Object.entries(allFields)) {
          const num = parseInt(fieldNum);
          const { value, wireType } = fieldData as any;
          
          console.log(`Processing trade field ${num}, wireType ${wireType}, value:`, value);
          
          if (wireType === 0) { // varint
            if (num === 1) constructedTrade.timestamp = Number(value);
            else if (num === 10) constructedTrade.buyer_is = Number(value);
            else if (num === 11) constructedTrade.seller_is = Number(value);
            else if (num === 12) constructedTrade.order_hit = Number(value);
            else console.log(`Unmapped varint field ${num}: ${value}`);
          } else if (wireType === 2) { // string
            const strValue = this.decodeString(value);
            console.log(`String field ${num}: "${strValue}"`);
            if (num === 2) constructedTrade.price = strValue;
            else if (num === 3) constructedTrade.qty = strValue;
            else if (num === 4) constructedTrade.maker_id = strValue;
            else if (num === 5) constructedTrade.taker_id = strValue;
            else if (num === 6) constructedTrade.maker_base_address = strValue;
            else if (num === 7) constructedTrade.maker_quote_address = strValue;
            else if (num === 8) constructedTrade.taker_base_address = strValue;
            else if (num === 9) constructedTrade.taker_quote_address = strValue;
            else console.log(`Unmapped string field ${num}: "${strValue}"`);
          }
        }
        
        console.log('Constructed trade:', constructedTrade);
        
        // If we have at least some basic fields, return it
        if (constructedTrade.price || constructedTrade.qty || constructedTrade.timestamp) {
          console.log('Returning constructed trade with available fields');
          return {
            timestamp: constructedTrade.timestamp || 0,
            price: constructedTrade.price || '0',
            qty: constructedTrade.qty || '0',
            maker_id: constructedTrade.maker_id || '',
            taker_id: constructedTrade.taker_id || '',
            maker_base_address: constructedTrade.maker_base_address || '',
            maker_quote_address: constructedTrade.maker_quote_address || '',
            taker_base_address: constructedTrade.taker_base_address || '',
            taker_quote_address: constructedTrade.taker_quote_address || '',
            buyer_is: constructedTrade.buyer_is || 0,
            seller_is: constructedTrade.seller_is || 0,
            order_hit: constructedTrade.order_hit || 0
          };
        }
      }
      
      console.warn('Could not construct valid trade');
      return null;
      
    } catch (error) {
      console.error('Error parsing trade protobuf:', error);
      return null;
    }
  }

  // Validate that an orderbook entry has all required fields
  private isValidOrderbookEntry(entry: Partial<ProtobufOrderbookEntry>): entry is ProtobufOrderbookEntry {
    return (
      typeof entry.timestamp === 'number' &&
      typeof entry.order_id === 'number' &&
      typeof entry.price === 'string' &&
      typeof entry.quantity === 'string' &&
      typeof entry.side === 'number' &&
      typeof entry.maker_base_address === 'string' &&
      typeof entry.maker_quote_address === 'string' &&
      typeof entry.status === 'number' &&
      typeof entry.market_id === 'string'
    );
  }

}

// Create client using Connect-Web transport base URL
const grpcClient = new ConnectGrpcWebClient(GRPC_WEB_PROXY_URL);

// Config Service
export const configService = {
  // Get configuration
  async getConfig(): Promise<{ success: boolean; config?: ConfigResponse; error?: string }> {
    try {
      console.log('Calling getConfig via Connect gRPC-Web');
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter_config.v1.ConfigService',
        'GetConfig',
        {}
      );
      
      console.log('Connect gRPC-Web getConfig success:', response);
      return { success: true, config: response };
    } catch (error) {
      console.error('Connect gRPC-Web getConfig error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },


};

// Arborter Service
export const arborterService = {
  // Send order
  async sendOrder(order: any, signatureHash: Uint8Array): Promise<any> {
    try {
      console.log('Calling sendOrder via Connect gRPC-Web');
      
      // Create the request data with CORRECT protobuf field names (snake_case)
      const request = {
        order: {
          side: order.side,
          quantity: order.quantity,
          price: order.price,
          market_id: order.marketId, // CORRECT: snake_case
          base_account_address: order.baseAccountAddress, // CORRECT: snake_case
          quote_account_address: order.quoteAccountAddress, // CORRECT: snake_case
          execution_type: order.executionType, // CORRECT: snake_case
          matching_order_ids: order.matchingOrderIds || [] // CORRECT: snake_case
        },
        signature_hash: signatureHash // Pass the Uint8Array directly
      };
      
      console.log('Sending request to gRPC:', request);
      console.log('Request order data:', request.order);
      console.log('Request signature hash length:', signatureHash.length);
      
      // First, let's test if the backend is reachable with a simple request
      try {
        console.log('Testing backend connectivity...');
        const testResponse = await grpcClient.call(
          'xyz.aspens.arborter_config.v1.ConfigService',
          'GetConfig',
          {}
        );
        console.log('Backend connectivity test successful:', testResponse);
      } catch (testError) {
        console.error('Backend connectivity test failed:', testError);
        throw new Error(`Backend not reachable: ${testError.message}`);
      }
      
      try {
        const response = await grpcClient.call(
          'xyz.aspens.arborter.v1.ArborterService',
          'SendOrder',
          request
        );
        
        console.log('Connect gRPC-Web sendOrder success:', response);
        return { success: true, data: response };
      } catch (sendOrderError) {
        console.error('SendOrder method failed:', sendOrderError);
        
        // Re-throw the error - no mock data
        throw sendOrderError;
        
        throw sendOrderError;
      }
    } catch (error) {
      console.error('Connect gRPC-Web sendOrder error:', error);
      throw error;
    }
  },

  // Cancel order
  async cancelOrder(orderId: string, signature: string, signer: string): Promise<any> {
    try {
      console.log('Calling cancelOrder via Connect gRPC-Web');
      
      const request = {
        orderId: orderId,
        signature: signature,
        signer: signer
      };
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter.v1.ArborterService',
        'CancelOrder',
        request
      );
      
      console.log('Connect gRPC-Web cancelOrder success:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Connect gRPC-Web cancelOrder error:', error);
      throw error;
    }
  },

  // Parse raw orderbook entry into proper OrderbookEntry type
  parseOrderbookEntry(rawEntry: ProtobufOrderbookEntry | any): OrderbookEntry {
    // If it's already a ProtobufOrderbookEntry, convert it directly
    if (rawEntry && typeof rawEntry === 'object' && 
        typeof rawEntry.timestamp === 'number' &&
        typeof rawEntry.order_id === 'number' &&
        typeof rawEntry.price === 'string' &&
        typeof rawEntry.quantity === 'string' &&
        typeof rawEntry.side === 'number' &&
        typeof rawEntry.maker_base_address === 'string' &&
        typeof rawEntry.maker_quote_address === 'string' &&
        typeof rawEntry.status === 'number' &&
        typeof rawEntry.market_id === 'string') {
      return {
        timestamp: rawEntry.timestamp,
        order_id: rawEntry.order_id,
        price: rawEntry.price,
        quantity: rawEntry.quantity,
        side: rawEntry.side,
        maker_base_address: rawEntry.maker_base_address,
        maker_quote_address: rawEntry.maker_quote_address,
        status: rawEntry.status,
        market_id: rawEntry.market_id
      };
    }
    
    // Fallback for legacy/unknown format
    return {
      timestamp: Number(rawEntry.timestamp) || 0,
      order_id: Number(rawEntry.order_id) || 0,
      price: String(rawEntry.price || '0'),
      quantity: String(rawEntry.quantity || '0'),
      side: Number(rawEntry.side) || 0,
      maker_base_address: String(rawEntry.maker_base_address || ''),
      maker_quote_address: String(rawEntry.maker_quote_address || ''),
      status: Number(rawEntry.status) || 0,
      market_id: String(rawEntry.market_id || '')
    };
  },

  // Get orderbook snapshot (standardized to match config/send order pattern)
  async getOrderbookSnapshot(marketId: string, filterByTrader?: string): Promise<OrderbookResponse> {
    try {
      console.log('Calling getOrderbookSnapshot via arborterService for market:', marketId, 'filterByTrader:', filterByTrader);
      
      // For snapshot, we want to get all historical orders without streaming
      const request: OrderbookRequest = {
        continue_stream: false,
        historical_open_orders: true,
        market_id: marketId,
        filter_by_trader: filterByTrader
      };
      
      console.log('Sending orderbook snapshot request:', request);
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter.v1.ArborterService',
        'Orderbook',
        request
      );
      
      console.log('Raw orderbook response:', response);
      
      // Parse the streaming response into OrderbookEntry objects
      let entries: OrderbookEntry[] = [];
      
      if (Array.isArray(response)) {
        // If response is already an array of OrderbookEntry (from streaming)
        entries = response;
      } else if (response && typeof response === 'object') {
        // If it's a single object, wrap it in an array
        entries = [response];
      } else if (response && response.data) {
        // If it has a data property, use that
        const data = Array.isArray(response.data) ? response.data : [response.data];
        entries = data;
      }
      
      console.log('Final orderbook entries count:', entries.length);
      
      return { 
        success: true, 
        data: entries 
      };
    } catch (error) {
      console.error('arborterService getOrderbookSnapshot error:', error);
      
      // Return error response (correct pattern)
      return { 
        success: false, 
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get trades snapshot (non-streaming)
  async getTradesSnapshot(marketId: string, filterByTrader?: string): Promise<TradeResponse> {
    try {
      console.log('Calling getTradesSnapshot via arborterService for market:', marketId, 'filterByTrader:', filterByTrader);
      
      const request = {
        continue_stream: false,
        historical_closed_trades: true,
        market_id: marketId,
        filter_by_trader: filterByTrader
      };
      
      console.log('Sending trades request to gRPC:', request);
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter.v1.ArborterService',
        'Trades',
        request
      );
      
      console.log('Connect gRPC-Web getTradesSnapshot success:', response);
      console.log('Response type:', typeof response);
      console.log('Response is array:', Array.isArray(response));
      console.log('Response length:', Array.isArray(response) ? response.length : 'N/A');
      
      if (Array.isArray(response)) {
        console.log('First trade in response:', response[0]);
        return { success: true, data: response };
      } else {
        console.error('Unexpected trades response format:', response);
        return { success: false, error: 'Invalid response format' };
      }
    } catch (error) {
      console.error('arborterService getTradesSnapshot error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },


};

// Utility functions for orderbook data
export function convertProtobufToOrderbookEntry(protobufEntry: ProtobufOrderbookEntry): OrderbookEntry {
  return {
    timestamp: protobufEntry.timestamp,
    order_id: protobufEntry.order_id,
    price: protobufEntry.price,
    quantity: protobufEntry.quantity,
    side: protobufEntry.side,
    maker_base_address: protobufEntry.maker_base_address,
    maker_quote_address: protobufEntry.maker_quote_address,
    status: protobufEntry.status,
    market_id: protobufEntry.market_id
  };
}

export function convertOrderbookEntryToProtobuf(orderbookEntry: OrderbookEntry): ProtobufOrderbookEntry {
  return {
    timestamp: orderbookEntry.timestamp,
    order_id: orderbookEntry.order_id,
    price: orderbookEntry.price,
    quantity: orderbookEntry.quantity,
    side: orderbookEntry.side,
    maker_base_address: orderbookEntry.maker_base_address,
    maker_quote_address: orderbookEntry.maker_quote_address,
    status: orderbookEntry.status,
    market_id: orderbookEntry.market_id
  };
}

// Helper function to validate orderbook entry status
export function isActiveOrderbookEntry(entry: OrderbookEntry | ProtobufOrderbookEntry): boolean {
  return entry.status !== 3; // 3 = REMOVED
}

// Helper function to get side as string
export function getOrderbookSideString(side: number): 'bid' | 'ask' {
  return side === 1 ? 'bid' : 'ask';
}

// Helper function to get status as string
export function getOrderbookStatusString(status: number): 'added' | 'updated' | 'removed' | 'unknown' {
  switch (status) {
    case 1: return 'added';
    case 2: return 'updated';
    case 3: return 'removed';
    default: return 'unknown';
  }
}


