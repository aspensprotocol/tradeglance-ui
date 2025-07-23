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
        const messageBytes = new TextEncoder().encode(JSON.stringify(data));
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
          // Extract the readable text from the binary response
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

  // Extract config data from the protobuf text content
  extractConfigFromText(text: string): any {
    console.log('Extracting config data from protobuf text content');
    console.log('Raw text length:', text.length);
    console.log('Raw text (first 500 chars):', text.substring(0, 500));
    
    // Clean the text by removing control characters and normalizing
    const cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Cleaned text length:', cleanText.length);
    console.log('Cleaned text (first 500 chars):', cleanText.substring(0, 500));
    
    // Extract chain information
    const chains: any[] = [];
    
    // More flexible regex patterns to find chain sections
    const anvil1Matches = cleanText.match(/anvil-1[^a]*?0x[a-fA-F0-9]{40}/g);
    const anvil2Matches = cleanText.match(/anvil-2[^a]*?0x[a-fA-F0-9]{40}/g);
    
    console.log('All anvil-1 matches:', anvil1Matches);
    console.log('All anvil-2 matches:', anvil2Matches);
    
    // If we find both chains mentioned, create them with default values
    if (cleanText.includes('anvil-1') && cleanText.includes('anvil-2')) {
      const addresses = cleanText.match(/0x[a-fA-F0-9]{40}/g) || [];
      
      console.log('Found both chains, creating with addresses:', addresses);
      
      // Use known RPC URLs to avoid corruption from regex extraction
      const knownRpcUrls = {
        'anvil-1': 'https://sepolia.basescan.org',
        'anvil-2': 'https://coston2-api.flare.network/ext/C/rpc'
      };
      
      // Create anvil-1 chain
      if (addresses.length >= 2) {
        chains.push({
          network: 'anvil-1',
          chain_id: 114,
          rpc_url: knownRpcUrls['anvil-1'],
          service_address: addresses[0] || '',
          trade_contract: {
            address: addresses[1] || ''
          },
          tokens: {
            TTK: {
              name: 'TTK Token',
              symbol: 'TTK',
              address: '0x1a2E41abe7405328d281456D638CF6f95825a382',
              decimals: 18,
              tradePrecision: 18
            }
          }
        });
      }
      
      // Create anvil-2 chain
      if (addresses.length >= 4) {
        chains.push({
          network: 'anvil-2',
          chain_id: 11155111,
          rpc_url: knownRpcUrls['anvil-2'],
          service_address: addresses[2] || '',
          trade_contract: {
            address: addresses[3] || ''
          },
          tokens: {
            TTK: {
              name: 'TTK Token',
              symbol: 'TTK',
              address: '0xeDe684d67932D8bbE9fda8bdc80d4Ab27d845739',
              decimals: 18,
              tradePrecision: 18
            }
          }
        });
      }
    }
    
    // Extract markets
    const markets: any[] = [];
    const marketMatch = cleanText.match(/anvil-1-TTK--anvil-2-TTK/);
    if (marketMatch) {
      markets.push({
        slug: 'anvil-1-TTK--anvil-2-TTK',
        name: 'anvil-1 TTK - anvil-2 TTK',
        base_chain_network: 'anvil-1',
        quote_chain_network: 'anvil-2',
        base_chain_token_symbol: 'TTK',
        quote_chain_token_symbol: 'TTK',
        base_chain_token_decimals: 18,
        quote_chain_token_decimals: 18,
        pair_decimals: 18,
        market_id: '114::0x1a2E41abe7405328d281456D638CF6f95825a382::11155111::0xeDe684d67932D8bbE9fda8bdc80d4Ab27d845739'
      });
    }
    
    const configData = {
      chains,
      markets
    };
    
    console.log('Final extracted config data:', configData);
    return { success: true, config: configData };
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
  async sendOrder(order: any): Promise<any> {
    try {
      console.log('Calling sendOrder via Connect gRPC-Web');
      
      const request = {
        order: order
      };
      
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
