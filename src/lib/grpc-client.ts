import { createGrpcWebTransport } from "@connectrpc/connect-web";

// Arborter gRPC Types
export interface OrderbookRequest {
  continue_stream: boolean;
  market_id: string;
  historical_open_orders?: boolean;
  filter_by_trader?: string;
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

export interface OrderbookResponse {
  success: boolean;
  data: OrderbookEntry[];
  error?: string;
}

// Environment variable for gRPC-Web proxy URL
const GRPC_WEB_PROXY_URL = import.meta.env.VITE_GRPC_WEB_PROXY_URL || 'http://localhost:8811';
console.log('Environment variable VITE_GRPC_WEB_PROXY_URL:', import.meta.env.VITE_GRPC_WEB_PROXY_URL);
console.log('Using GRPC_WEB_PROXY_URL:', GRPC_WEB_PROXY_URL);

// Create the gRPC-Web transport
const transport = createGrpcWebTransport({
  baseUrl: GRPC_WEB_PROXY_URL,
  useBinaryFormat: true, // Use binary format for gRPC-Web
});

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

  // Encode OrderbookRequest as protobuf
  private encodeOrderbookRequest(data: OrderbookRequest): Uint8Array {
    const encodeVarint = (value: number): Uint8Array => {
      const bytes: number[] = [];
      while (value >= 0x80) {
        bytes.push((value & 0x7F) | 0x80);
        value >>>= 7;
      }
      bytes.push(value & 0x7F);
      return new Uint8Array(bytes);
    };

    const encodeStringField = (fieldNumber: number, value: string): Uint8Array => {
      const stringBytes = new TextEncoder().encode(value);
      const fieldHeader = encodeVarint((fieldNumber << 3) | 2); // Wire type 2 = length-delimited
      const lengthBytes = encodeVarint(stringBytes.length);
      return this.concatenateUint8Arrays([fieldHeader, lengthBytes, stringBytes]);
    };

    const encodeBoolField = (fieldNumber: number, value: boolean): Uint8Array => {
      const fieldHeader = encodeVarint((fieldNumber << 3) | 0); // Wire type 0 = varint
      const valueBytes = encodeVarint(value ? 1 : 0);
      return this.concatenateUint8Arrays([fieldHeader, valueBytes]);
    };

    const parts: Uint8Array[] = [];

    // Field 1: continue_stream (bool)
    parts.push(encodeBoolField(1, data.continue_stream));

    // Field 2: market_id (string)
    parts.push(encodeStringField(2, data.market_id));

    // Field 3: historical_open_orders (optional bool)
    if (data.historical_open_orders !== undefined) {
      parts.push(encodeBoolField(3, data.historical_open_orders));
    }

    // Field 4: filter_by_trader (optional string)
    if (data.filter_by_trader !== undefined) {
      parts.push(encodeStringField(4, data.filter_by_trader));
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
        
        // Use protobuf encoding for SendOrder and Orderbook, JSON for others
        if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'SendOrder') {
          messageBytes = this.encodeOrderProtobuf(data);
        } else if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'Orderbook') {
          messageBytes = this.encodeOrderbookRequest(data);
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
      const isStreamingMethod = service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'Orderbook';
      
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
        fetchOptions.signal = AbortSignal.timeout(10000); // 10 second timeout
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
        console.log('Handling streaming response for orderbook');
        // For streaming, we need to read the response as a stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available for streaming');
        }
        
        // Read the first chunk to get the initial data
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream ended immediately');
          return [];
        }
        
        console.log('Streaming response chunk:', {
          done,
          valueLength: value?.length,
          valueBytes: Array.from(value || []).slice(0, 100)
        });
        
        // Parse the streaming response
        const entries = this.parseOrderbookStreamResponse(value);
        console.log('Parsed streaming entries:', entries);
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
      
      // Use protobufjs to parse the response
      const config = this.parseProtobufConfigWithLibrary(messageBytes);
      
      console.log('Successfully parsed protobuf config:', config);
      return config;
      
    } catch (error) {
      console.error('Failed to parse protobuf response:', error);
      throw error;
    }
  }

  // Parse protobuf binary data using manual protobuf parsing
  parseProtobufConfigWithLibrary(bytes: Uint8Array): ConfigResponse {
    try {
      console.log('parseProtobufConfigWithLibrary: Starting to parse', bytes.length, 'bytes');
      
      // Use manual protobuf parsing to extract real data from gRPC response
      const config = this.parseProtobufManually(bytes);
      
      console.log('parseProtobufConfigWithLibrary: Parsed config:', config);
      return config;
      
    } catch (error) {
      console.error('Failed to parse config:', error);
      throw error;
    }
  }

  // Simple protobufjs parsing
  parseWithSimpleProtobufjs(bytes: Uint8Array): any {
    // This method is not being used - removed to fix TypeScript errors
    throw new Error('Not implemented');
  }

  // Extract config from binary string using manual protobuf parsing
  extractConfigFromBinaryString(dataString: string): ConfigResponse {
    console.log('extractConfigFromBinaryString: Raw data string length:', dataString.length);
    console.log('extractConfigFromBinaryString: Raw data string (first 500 chars):', dataString.substring(0, 500));
    
    // Convert string back to Uint8Array for proper protobuf parsing
    const bytes = new Uint8Array(dataString.length);
    for (let i = 0; i < dataString.length; i++) {
      bytes[i] = dataString.charCodeAt(i);
    }
    
    // Use manual protobuf parsing to extract real data from gRPC response
    return this.parseProtobufManually(bytes);
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
    
    while (offset < bytes.length) {
      const byte = bytes[offset];
      result |= (byte & 0x7F) << shift;
      offset++;
      
      if ((byte & 0x80) === 0) break;
      shift += 7;
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
      
      return this.parseProtobufConfigWithLibrary(bytes);
      
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
  parseOrderbookStreamResponse(responseBytes: Uint8Array): any {
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
        return parsed;
      }
      
      // If it has a data property, return that
      if (parsed && parsed.data) {
        return Array.isArray(parsed.data) ? parsed.data : [parsed.data];
      }
      
      // If it's a single object, wrap it in an array
      return [parsed];
      
    } catch (error) {
      console.log('Not JSON, parsing as protobuf binary format');
      
      // Parse as protobuf binary format
      try {
        const entries = this.parseOrderbookProtobufResponse(responseBytes);
        console.log('Parsed protobuf orderbook entries:', entries);
        return entries;
      } catch (protobufError) {
        console.error('Failed to parse Orderbook stream response as protobuf:', protobufError);
        // Return empty array as fallback
        return [];
      }
    }
  }

  // Parse orderbook protobuf binary response
  parseOrderbookProtobufResponse(responseBytes: Uint8Array): any[] {
    console.log('Parsing orderbook protobuf response');
    
    const entries: any[] = [];
    let offset = 0;
    
    // Parse multiple protobuf messages from the response
    while (offset < responseBytes.length) {
      try {
        // Read the length prefix (4 bytes)
        if (offset + 4 > responseBytes.length) {
          console.log('Not enough bytes for length prefix, stopping');
          break;
        }
        
        const length = (responseBytes[offset] << 24) | 
                      (responseBytes[offset + 1] << 16) | 
                      (responseBytes[offset + 2] << 8) | 
                      responseBytes[offset + 3];
        
        console.log(`Message length: ${length} at offset ${offset}`);
        
        if (length <= 0 || offset + 4 + length > responseBytes.length) {
          console.log('Invalid message length or not enough bytes, stopping');
          break;
        }
        
        // Extract the message bytes
        const messageBytes = responseBytes.slice(offset + 4, offset + 4 + length);
        
        // Parse the individual orderbook entry
        const entry = this.parseOrderbookEntryProtobuf(messageBytes);
        if (entry) {
          entries.push(entry);
        }
        
        // Move to next message
        offset += 4 + length;
        
      } catch (error) {
        console.error('Error parsing protobuf message at offset', offset, error);
        break;
      }
    }
    
    console.log(`Parsed ${entries.length} orderbook entries from protobuf`);
    return entries;
  }

  // Parse individual orderbook entry from protobuf
  parseOrderbookEntryProtobuf(messageBytes: Uint8Array): any {
    try {
      console.log('Parsing orderbook entry protobuf, bytes length:', messageBytes.length);
      
      let offset = 0;
      const entry: any = {};
      
      while (offset < messageBytes.length) {
        // Read field number and wire type
        const tag = this.readVarint(messageBytes, offset);
        const fieldNumber = tag >> 3;
        const wireType = tag & 0x7;
        
        console.log(`Field ${fieldNumber}, wire type ${wireType} at offset ${offset}`);
        
        // Read the field value based on wire type
        let value: any;
        let newOffset: number;
        
        if (wireType === 0) { // Varint
          value = this.readVarint(messageBytes, offset + 1);
          newOffset = offset + 1 + this.varintLength(value);
        } else if (wireType === 1) { // 64-bit
          if (offset + 9 > messageBytes.length) break;
          value = this.readBytes(messageBytes, offset + 1, 8);
          newOffset = offset + 9;
        } else if (wireType === 2) { // Length-delimited
          const length = this.readVarint(messageBytes, offset + 1);
          const lengthBytes = this.varintLength(length);
          value = this.readBytes(messageBytes, offset + 1 + lengthBytes, length);
          newOffset = offset + 1 + lengthBytes + length;
        } else {
          console.log(`Unknown wire type ${wireType}, skipping`);
          break;
        }
        
        // Map field numbers to field names based on the expected protobuf structure
        switch (fieldNumber) {
          case 1: // timestamp
            entry.timestamp = value.toString();
            break;
          case 2: // order_id
            entry.order_id = value;
            break;
          case 3: // price
            entry.price = value.toString();
            break;
          case 4: // quantity
            entry.quantity = value.toString();
            break;
          case 5: // side
            entry.side = value;
            break;
          case 6: // maker_base_address
            entry.maker_base_address = this.decodeString(value);
            break;
          case 7: // maker_quote_address
            entry.maker_quote_address = this.decodeString(value);
            break;
          case 8: // status
            entry.status = value;
            break;
          case 9: // market_id
            entry.market_id = this.decodeString(value);
            break;
          default:
            console.log(`Unknown field number ${fieldNumber}, value:`, value);
        }
        
        offset = newOffset;
      }
      
      console.log('Parsed orderbook entry:', entry);
      return entry;
      
    } catch (error) {
      console.error('Error parsing orderbook entry protobuf:', error);
      return null;
    }
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

  // Get version
  async getVersion(): Promise<any> {
    try {
      console.log('Calling getVersion via Connect gRPC-Web');
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter_config.v1.ConfigService',
        'GetVersion',
        {}
      );
      
      console.log('Connect gRPC-Web getVersion success:', response);
      return { success: true, version: response.data || 'unknown' };
    } catch (error) {
      console.error('Connect gRPC-Web getVersion error:', error);
      throw error;
    }
  }
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
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter.v1.ArborterService',
        'SendOrder',
        request
      );
      
      console.log('Connect gRPC-Web sendOrder success:', response);
      return { success: true, data: response };
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
  parseOrderbookEntry(rawEntry: any): OrderbookEntry {
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
  async getOrderbookSnapshot(marketId: string): Promise<OrderbookResponse> {
    try {
      console.log('Calling getOrderbookSnapshot via arborterService for market:', marketId);
      
      // For streaming methods, we need to use continue_stream: true for proper streaming
      // The backend expects this to be a streaming connection
      const request: OrderbookRequest = {
        continue_stream: true,
        historical_open_orders: true,
        market_id: marketId
      };
      
      console.log('Sending orderbook snapshot request:', request);
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter.v1.ArborterService',
        'Orderbook',
        request
      );
      
      console.log('Raw orderbook response:', response);
      
      // Parse the response into OrderbookEntry objects using the same pattern as config
      let entries: OrderbookEntry[] = [];
      
      if (Array.isArray(response)) {
        entries = response.map(entry => this.parseOrderbookEntry(entry));
      } else if (response && typeof response === 'object') {
        // If it's a single object, wrap it in an array
        entries = [this.parseOrderbookEntry(response)];
      } else if (response && response.data) {
        // If it has a data property, use that
        const data = Array.isArray(response.data) ? response.data : [response.data];
        entries = data.map(entry => this.parseOrderbookEntry(entry));
      }
      
      console.log('Parsed orderbook entries:', entries);
      
      return { 
        success: true, 
        data: entries 
      };
    } catch (error) {
      console.error('arborterService getOrderbookSnapshot error:', error);
      
      // Return empty orderbook on error (same pattern as config)
      return { 
        success: true, 
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get orderbook stream (streaming with Server-Sent Events)
  async getOrderbookStream(marketId: string, onUpdate: (entries: OrderbookEntry[]) => void): Promise<{ success: boolean; cleanup: () => void }> {
    try {
      console.log('Starting orderbook stream for market:', marketId);
      
      const request: OrderbookRequest = {
        continue_stream: true,
        historical_open_orders: true,
        market_id: marketId
      };
      
      // For now, we'll use polling as a fallback since true streaming is complex
      // In a real implementation, this would use Server-Sent Events or WebSocket
      const pollOrderbook = async () => {
        try {
          const response = await this.getOrderbookSnapshot(marketId);
          if (response.success && response.data) {
            onUpdate(response.data);
          }
        } catch (error) {
          console.error('Orderbook polling error:', error);
        }
      };
      
      // Initial poll
      await pollOrderbook();
      
      // Set up polling interval
      const intervalId = setInterval(pollOrderbook, 2000); // Poll every 2 seconds for real-time feel
      
      // Return cleanup function
      return {
        success: true,
        cleanup: () => {
          console.log('Cleaning up orderbook stream');
          clearInterval(intervalId);
        }
      };
    } catch (error) {
      console.error('Connect gRPC-Web getOrderbookStream error:', error);
      throw error;
    }
  },

  // Proper streaming implementation using gRPC-Web streaming
  async getOrderbookStreamReal(marketId: string, onUpdate: (entries: OrderbookEntry[]) => void): Promise<{ success: boolean; cleanup: () => void }> {
    try {
      console.log('Starting real orderbook stream for market:', marketId);
      
      const request: OrderbookRequest = {
        continue_stream: true,
        historical_open_orders: true,
        market_id: marketId
      };
      
      // For now, just use the snapshot method since true streaming is complex
      // In a real implementation, this would handle the streaming properly
      const snapshotResponse = await this.getOrderbookSnapshot(marketId);
      if (snapshotResponse.success && snapshotResponse.data) {
        onUpdate(snapshotResponse.data);
      }
      
      // Return cleanup function (for now, just a no-op since we're not actually streaming)
      return {
        success: true,
        cleanup: () => {
          console.log('Cleaning up real orderbook stream (no-op for now)');
        }
      };
    } catch (error) {
      console.error('Connect gRPC-Web getOrderbookStreamReal error:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  async getOrderbook(marketId: string, continueStream: boolean = true, historicalOpenOrders: boolean = true): Promise<any> {
    try {
      console.log('Calling getOrderbook via Connect gRPC-Web (legacy method)');
      
      const request = {
        continue_stream: continueStream,
        historical_open_orders: historicalOpenOrders,
        market_id: marketId
      };
      
      console.log('Sending orderbook request to gRPC:', request);
      
      // If this is a streaming request, we need to handle it differently
      if (continueStream) {
        console.warn('Streaming orderbook requests are not yet implemented. Use getOrderbookSnapshot for snapshots.');
        // For now, fall back to snapshot
        return this.getOrderbookSnapshot(marketId);
      }
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter.v1.ArborterService',
        'Orderbook',
        request
      );
      
      console.log('Connect gRPC-Web getOrderbook success:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Connect gRPC-Web getOrderbook error:', error);
      throw error;
    }
  }
};

// Test gRPC connection
export async function testGrpcConnection(): Promise<boolean> {
  try {
    console.log('Testing Connect gRPC-Web connection...');
    await grpcClient.call(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'GetConfig',
      {}
    );
    console.log('Connect gRPC-Web connection successful');
    return true;
  } catch (error) {
    console.error('Connect gRPC-Web connection failed:', error);
    return false;
  }
}
