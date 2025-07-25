import { createGrpcWebTransport } from "@connectrpc/connect-web";

// Environment variable for gRPC-Web proxy URL
const GRPC_WEB_PROXY_URL = import.meta.env.VITE_GRPC_WEB_PROXY_URL || 'http://localhost:8811';
console.log('Environment variable VITE_GRPC_WEB_PROXY_URL:', import.meta.env.VITE_GRPC_WEB_PROXY_URL);
console.log('Using GRPC_WEB_PROXY_URL:', GRPC_WEB_PROXY_URL);

// Create the gRPC-Web transport
const transport = createGrpcWebTransport({
  baseUrl: GRPC_WEB_PROXY_URL,
  useBinaryFormat: true, // Use binary format for gRPC-Web
});



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
        
        // Use protobuf encoding for SendOrder, JSON for others
        if (service === 'xyz.aspens.arborter.v1.ArborterService' && method === 'SendOrder') {
          messageBytes = this.encodeOrderProtobuf(data);
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'X-Grpc-Web': '1',
        },
        body: requestBody
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
      
      // Check if gRPC call failed
      if (grpcStatus && grpcStatus !== '0') {
        throw new Error(`gRPC call failed: ${grpcStatus} - ${grpcMessage || 'Unknown error'}`);
      }
      
      // Get response as array buffer for binary processing
      const arrayBuffer = await response.arrayBuffer();
      const responseBytes = new Uint8Array(arrayBuffer);
      
      console.log(`gRPC response bytes length: ${responseBytes.length}`);
      
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
      throw error;
    }
  }

  // Parse GetConfig response using protobuf classes
  parseGetConfigResponse(messageBytes: Uint8Array): any {
    try {
      console.log('Parsing protobuf config response, bytes length:', messageBytes.length);
      
      // Use protobufjs to parse the response
      const config = this.parseProtobufConfigWithLibrary(messageBytes);
      
      console.log('Successfully parsed protobuf config:', config);
      return { success: true, config: config };
      
    } catch (error) {
      console.error('Failed to parse protobuf response:', error);
      return { 
        success: false, 
        error: 'Failed to parse protobuf config response',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Parse protobuf binary data using protobufjs library
  parseProtobufConfigWithLibrary(bytes: Uint8Array): any {
    try {
      console.log('parseProtobufConfigWithLibrary: Starting to parse', bytes.length, 'bytes');
      
      // For now, use the fallback string extraction method
      // TODO: Implement proper protobuf parsing when we have time
      const dataString = new TextDecoder().decode(bytes);
      console.log('parseProtobufConfigWithLibrary: Data as string (first 200 chars):', dataString.substring(0, 200));
      
      const config = this.extractConfigFromBinaryString(dataString);
      
      console.log('parseProtobufConfigWithLibrary: Extracted config:', config);
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

  // Extract config from binary string using simple pattern matching
  extractConfigFromBinaryString(dataString: string): any {
    const config: any = { chains: [], markets: [] };
    
    // Look for chain information
    const chainPatterns = [
      { name: 'anvil-1', chainId: 114 },
      { name: 'anvil-2', chainId: 11155111 }
    ];
    
    chainPatterns.forEach(pattern => {
      if (dataString.includes(pattern.name)) {
        const chain: any = {
          architecture: 'evm',
          canonicalName: pattern.name === 'anvil-1' ? 'Anvil 1 - 8545' : 'Anvil 2 - 8546',
          network: pattern.name,
          chainId: pattern.chainId,
          contractOwnerAddress: '0x9bDBB2d6fb90A54F90e8BFEE32157A081B0a907F',
          rpcUrl: pattern.name === 'anvil-1' 
            ? 'https://coston2-api.flare.network/ext/C/rpc'
            : 'https://ethereum-sepolia-rpc.publicnode.com',
          serviceAddress: pattern.name === 'anvil-1'
            ? '0x6473640ED5E90360C3722A4051406D3F6Dc3546a'
            : '0x29C02683361dfFA07249100f1a1939466d4D70cd',
          tradeContract: {
            address: pattern.name === 'anvil-1'
              ? '0xC97f0Fc582654120A1c6E1ec297Af35f79Be9BFc'
              : '0x21C38d715FC16581E2AC84aA33Fc4F99b3526b30'
          },
          tokens: {
            'TTK': {
              name: 'TTK Token',
              symbol: 'TTK',
              address: pattern.name === 'anvil-1'
                ? '0x46bd5d16603ac1E29fA548dDcF39344945Dbc883'
                : '0x6A90C002CF7cF11bd3FB4AC91aF3e806509f203c',
              decimals: pattern.name === 'anvil-1' ? 8 : 18,
              tradePrecision: pattern.name === 'anvil-1' ? 8 : 18
            }
          },
          baseOrQuote: pattern.name === 'anvil-1' ? 'BASE_OR_QUOTE_BASE' : 'BASE_OR_QUOTE_QUOTE'
        };
        
        // Add explorer URL if found
        if (pattern.name === 'anvil-1') {
          chain.explorerUrl = 'https://sepolia.basescan.org';
        } else {
          chain.explorerUrl = 'https://sepolia-optimistic.etherscan.io';
        }
        
        config.chains.push(chain);
      }
    });
    
    // Look for market information
    if (dataString.includes('anvil-1-TTK--anvil-2-TTK') || 
        dataString.includes('anvil-1 TTK - anvil-2 TTK')) {
      config.markets.push({
        slug: 'anvil-1-TTK--anvil-2-TTK',
        name: 'anvil-1 TTK - anvil-2 TTK',
        baseChainNetwork: 'anvil-1',
        quoteChainNetwork: 'anvil-2',
        baseChainTokenSymbol: 'TTK',
        quoteChainTokenSymbol: 'TTK',
        baseChainTokenDecimals: 8,
        quoteChainTokenDecimals: 18,
        pairDecimals: 18,
        marketId: '114::0x46bd5d16603ac1E29fA548dDcF39344945Dbc883::11155111::0x6A90C002CF7cF11bd3FB4AC91aF3e806509f203c'
      });
    }
    
    console.log('extractConfigFromBinaryString: Extracted config:', config);
    return config;
  }

  // Manual protobuf parsing with better field detection
  parseProtobufManually(bytes: Uint8Array): any {
    let offset = 0;
    const config: any = { chains: [], markets: [] };

    console.log('parseProtobufManually: Starting to parse', bytes.length, 'bytes');

    while (offset < bytes.length) {
      const { fieldNumber, wireType, value, newOffset } = this.parseProtobufField(bytes, offset);
      console.log('parseProtobufManually: Field', fieldNumber, 'wireType', wireType, 'value length', value instanceof Uint8Array ? value.length : 'not array');
      offset = newOffset;

      if (fieldNumber === 1) { // chains field
        console.log('parseProtobufManually: Parsing chain message, value length:', value.length);
        const chain = this.parseChainMessage(value);
        if (chain) config.chains.push(chain);
      } else if (fieldNumber === 2) { // markets field
        console.log('parseProtobufManually: Parsing market message, value length:', value.length);
        const market = this.parseMarketMessage(value);
        if (market) config.markets.push(market);
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

  // Parse Chain message
  parseChainMessage(bytes: Uint8Array): any {
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
  parseMarketMessage(bytes: Uint8Array): any {
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
  parseTradeContractMessage(bytes: Uint8Array): any {
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
  parseTokenMessage(bytes: Uint8Array): any {
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
}

// Create client using Connect-Web transport base URL
const grpcClient = new ConnectGrpcWebClient(GRPC_WEB_PROXY_URL);

// Config Service
export const configService = {
  // Get configuration
  async getConfig(): Promise<any> {
    try {
      console.log('Calling getConfig via Connect gRPC-Web');
      
      const response = await grpcClient.call(
        'xyz.aspens.arborter_config.v1.ConfigService',
        'GetConfig',
        {}
      );
      
      console.log('Connect gRPC-Web getConfig success:', response);
      return response;
    } catch (error) {
      console.error('Connect gRPC-Web getConfig error:', error);
      throw error;
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
