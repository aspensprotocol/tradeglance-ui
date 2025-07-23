import { keccak256, toHex } from 'viem';
import * as protobuf from 'protobufjs';

// TypeScript declaration for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

// EIP-712 types for order signing - matching the aspens SDK structure
const ORDER_TYPES = {
  Order: [
    { name: 'side', type: 'uint8' },
    { name: 'quantity', type: 'string' },
    { name: 'price', type: 'string' },
    { name: 'marketId', type: 'string' },
    { name: 'baseAccountAddress', type: 'address' },
    { name: 'quoteAccountAddress', type: 'address' },
    { name: 'executionType', type: 'uint8' },
    { name: 'matchingOrderIds', type: 'uint64[]' },
  ],
};

export interface OrderData {
  side: 'SIDE_BID' | 'SIDE_ASK';
  quantity: string;
  price?: string;
  marketId: string;
  baseAccountAddress: string;
  quoteAccountAddress: string;
  executionType: 'EXECUTION_TYPE_UNSPECIFIED' | 'EXECUTION_TYPE_DISCRETIONARY';
  matchingOrderIds?: number[];
}

// Protobuf message definition matching the aspens SDK
const ORDER_PROTO_DEFINITION = `
syntax = "proto3";

package xyz.aspens.arborter.v1;

enum Side {
  SIDE_UNSPECIFIED = 0;
  SIDE_BID = 1;
  SIDE_ASK = 2;
}

enum ExecutionType {
  EXECUTION_TYPE_UNSPECIFIED = 0;
  EXECUTION_TYPE_DISCRETIONARY = 1;
}

message Order {
  Side side = 1;
  string quantity = 2;
  optional string price = 3;
  string market_id = 4;
  string base_account_address = 5;
  string quote_account_address = 6;
  ExecutionType execution_type = 7;
  repeated uint64 matching_order_ids = 8;
}
`;

// Load protobuf definition
let OrderMessage: protobuf.Type | null = null;

async function loadProtobufDefinition() {
  if (!OrderMessage) {
    const root = protobuf.parse(ORDER_PROTO_DEFINITION);
    OrderMessage = root.root.lookupType('xyz.aspens.arborter.v1.Order');
  }
  return OrderMessage;
}

// New function that matches aspens SDK exactly - protobuf encoding + direct signing
export async function signOrderWithProtobuf(
  orderData: OrderData,
  chainId: number
): Promise<Uint8Array> {
  // Convert side to number
  const side = orderData.side === 'SIDE_BID' ? 1 : 2;
  
  // Convert execution type to number
  const executionType = orderData.executionType === 'EXECUTION_TYPE_DISCRETIONARY' ? 1 : 0;

  console.log('Execution type conversion:', {
    original: orderData.executionType,
    converted: executionType
  });

  // Create the order object for signing (matching aspens SDK structure exactly)
  const orderForSigning = {
    side: side,
    quantity: orderData.quantity, // Keep as string (SDK expects string)
    price: orderData.price || '', // Keep as string (SDK expects string)
    market_id: orderData.marketId, // Use snake_case (SDK expects snake_case)
    base_account_address: orderData.baseAccountAddress, // Use snake_case (SDK expects snake_case)
    quote_account_address: orderData.quoteAccountAddress, // Use snake_case (SDK expects snake_case)
    execution_type: executionType, // Use snake_case (SDK expects snake_case)
    matching_order_ids: orderData.matchingOrderIds || [], // Use snake_case (SDK expects snake_case)
  };

  // Also try with string enum values to see if that helps
  const orderForSigningWithStrings = {
    side: side === 1 ? 'SIDE_BID' : 'SIDE_ASK',
    quantity: orderData.quantity,
    price: orderData.price || '',
    market_id: orderData.marketId,
    base_account_address: orderData.baseAccountAddress,
    quote_account_address: orderData.quoteAccountAddress,
    execution_type: executionType === 0 ? 'EXECUTION_TYPE_UNSPECIFIED' : 'EXECUTION_TYPE_DISCRETIONARY',
    matching_order_ids: orderData.matchingOrderIds || [],
  };

  console.log('Order object keys:', Object.keys(orderForSigning));
  console.log('Order object values:', Object.values(orderForSigning));
  console.log('Order with string enums:', orderForSigningWithStrings);

  console.log('Order for protobuf encoding (detailed):', {
    side: orderForSigning.side,
    quantity: orderForSigning.quantity,
    price: orderForSigning.price,
    market_id: orderForSigning.market_id,
    base_account_address: orderForSigning.base_account_address,
    quote_account_address: orderForSigning.quote_account_address,
    execution_type: orderForSigning.execution_type,
    matching_order_ids: orderForSigning.matching_order_ids,
  });

  console.log('Order for protobuf encoding:', orderForSigning);

  // Check if MetaMask is available
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

    try {
    // Load protobuf definition
    const OrderType = await loadProtobufDefinition();
    
    let buffer: Uint8Array;
    
    // Try with string enum values first
    const errMsgWithStrings = OrderType.verify(orderForSigningWithStrings);
    if (!errMsgWithStrings) {
      console.log('Protobuf verification passed with string enums');
      const messageWithStrings = OrderType.create(orderForSigningWithStrings);
      buffer = OrderType.encode(messageWithStrings).finish();
      console.log('Protobuf with strings - length:', buffer.length);
      console.log('Protobuf with strings - bytes:', Array.from(buffer));
    } else {
      console.log('String enum verification failed:', errMsgWithStrings);
      
      // Try with numeric enums
      const errMsg = OrderType.verify(orderForSigning);
      if (errMsg) {
        throw new Error(`Invalid order: ${errMsg}`);
      }

      console.log('Protobuf verification passed with numeric enums');

      // Create protobuf message
      const message = OrderType.create(orderForSigning);
      
      console.log('Protobuf message created:', message);
      
      // Encode to bytes (matching aspens SDK approach)
      buffer = OrderType.encode(message).finish();
    }
    
    console.log('Final protobuf encoded bytes length:', buffer.length);
    console.log('Final protobuf encoded bytes:', Array.from(buffer));

    // Convert protobuf bytes to hex string for MetaMask personal_sign
    const hexString = '0x' + Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Hex string for signing:', hexString);
    console.log('Protobuf bytes length:', buffer.length);
    console.log('Protobuf bytes (hex):', hexString);
    
    // Sign the protobuf bytes directly (matching aspens SDK approach)
    // personal_sign adds EIP-191 prefix, backend will fall back to EIP-191 verification
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [hexString, orderData.baseAccountAddress],
    });

    console.log('MetaMask signature received:', signature);
    console.log('Signature length:', signature.length);

    // Convert the signature to bytes
    // Remove the '0x' prefix and convert to Uint8Array
    const signatureBytes = new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
    
    console.log('Signature bytes length:', signatureBytes.length);
    console.log('Signature bytes:', Array.from(signatureBytes));
    
    return signatureBytes;
  } catch (error) {
    console.error('Protobuf signing error:', error);
    throw new Error('Failed to sign order with protobuf encoding');
  }
}

export async function signOrderWithMetaMask(
  orderData: OrderData,
  chainId: number
): Promise<Uint8Array> {
  // Convert side to number
  const side = orderData.side === 'SIDE_BID' ? 1 : 2;
  
  // Convert execution type to number
  const executionType = orderData.executionType === 'EXECUTION_TYPE_DISCRETIONARY' ? 1 : 0;

  // Create the order object for signing (matching aspens SDK structure exactly)
  const orderForSigning = {
    side,
    quantity: orderData.quantity, // Keep as string (SDK expects string)
    price: orderData.price || '', // Keep as string (SDK expects string)
    marketId: orderData.marketId, // Use marketId (SDK expects marketId)
    baseAccountAddress: orderData.baseAccountAddress,
    quoteAccountAddress: orderData.quoteAccountAddress,
    executionType,
    matchingOrderIds: orderData.matchingOrderIds || [],
  };

  // Check if MetaMask is available
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  // Create the EIP-712 typed data with string types for quantity and price
  const typedData = {
    types: {
      Order: [
        { name: 'side', type: 'uint8' },
        { name: 'quantity', type: 'string' }, // string, not uint256
        { name: 'price', type: 'string' }, // string, not uint256
        { name: 'marketId', type: 'string' },
        { name: 'baseAccountAddress', type: 'address' },
        { name: 'quoteAccountAddress', type: 'address' },
        { name: 'executionType', type: 'uint8' },
        { name: 'matchingOrderIds', type: 'uint64[]' },
      ],
    },
    primaryType: 'Order',
    domain: {
      name: 'Aspens Order',
      version: '1',
      chainId: chainId,
    },
    message: orderForSigning,
  };

  try {
    console.log('Requesting signature from MetaMask with data:', typedData);
    console.log('Account address:', orderData.baseAccountAddress);
    
    // Request signature from MetaMask
    const signature = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [orderData.baseAccountAddress, JSON.stringify(typedData)],
    });

    console.log('MetaMask signature received:', signature);
    console.log('Signature length:', signature.length);

    // Convert the signature to bytes
    // Remove the '0x' prefix and convert to Uint8Array
    const signatureBytes = new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
    
    console.log('Signature bytes length:', signatureBytes.length);
    console.log('Signature bytes:', Array.from(signatureBytes));
    
    return signatureBytes;
  } catch (error) {
    console.error('MetaMask signing error:', error);
    throw new Error('Failed to sign order with MetaMask');
  }
}

// Legacy function for backward compatibility
export async function signOrder(
  orderData: OrderData,
  chainId: number,
  privateKey: string
): Promise<Uint8Array> {
  // Use the new protobuf signing function instead
  return signOrderWithProtobuf(orderData, chainId);
} 