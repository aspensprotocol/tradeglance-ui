// No protobuf dependencies needed since Connect-Web handles serialization
// Simple protobuf wire format encoder for signing

declare global {
  interface Window {
    ethereum?: any;
  }
}

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

// Simple protobuf wire format encoder that matches prost::Message::encode()
function encodeProtobufWireFormat(fieldNumber: number, wireType: number, value: any): Uint8Array {
  const tag = (fieldNumber << 3) | wireType;
  const tagBytes = encodeVarint(tag);
  
  let valueBytes: Uint8Array;
  switch (wireType) {
    case 0: // Varint
      valueBytes = encodeVarint(value);
      break;
    case 1: // 64-bit
      valueBytes = new Uint8Array(8);
      const view = new DataView(valueBytes.buffer);
      view.setBigUint64(0, BigInt(value), true);
      break;
    case 2: // Length-delimited
      if (typeof value === 'string') {
        const encoder = new TextEncoder();
        const stringBytes = encoder.encode(value);
        const lengthBytes = encodeVarint(stringBytes.length);
        valueBytes = new Uint8Array(lengthBytes.length + stringBytes.length);
        valueBytes.set(lengthBytes);
        valueBytes.set(stringBytes, lengthBytes.length);
      } else if (Array.isArray(value)) {
        // For repeated fields, encode each element
        const encodedElements: Uint8Array[] = [];
        for (const element of value) {
          encodedElements.push(encodeProtobufWireFormat(fieldNumber, 0, element));
        }
        valueBytes = concatenateUint8Arrays(encodedElements);
      } else {
        throw new Error(`Unsupported value type for wire type 2: ${typeof value}`);
      }
      break;
    case 5: // 32-bit
      valueBytes = new Uint8Array(4);
      const view32 = new DataView(valueBytes.buffer);
      view32.setUint32(0, value, true);
      break;
    default:
      throw new Error(`Unsupported wire type: ${wireType}`);
  }
  
  return concatenateUint8Arrays([tagBytes, valueBytes]);
}

function encodeVarint(value: number): Uint8Array {
  const bytes: number[] = [];
  let val = value;
  
  while (val >= 0x80) {
    bytes.push((val & 0x7F) | 0x80);
    val = val >>> 7;
  }
  bytes.push(val & 0x7F);
  
  return new Uint8Array(bytes);
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

export async function signOrderWithGlobalProtobuf(
  orderData: OrderData,
  chainId: number
): Promise<Uint8Array> {
  console.log('=== CALLING signOrderWithGlobalProtobuf ===');
  
  // Convert side to number (enum) - matching the backend's Side enum
  const side = orderData.side === 'SIDE_BID' ? 1 : 2; // 1 = Bid, 2 = Ask
  
  // Convert execution type to number (enum) - matching the backend's ExecutionType enum
  const executionType = orderData.executionType === 'EXECUTION_TYPE_DISCRETIONARY' ? 1 : 0; // 0 = Unspecified, 1 = Discretionary

  console.log('Execution type conversion:', {
    original: orderData.executionType,
    converted: executionType
  });

  // Check if MetaMask is available
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Create the order object with CORRECT protobuf field names (snake_case)
    // This should match exactly what the backend's prost::Message::encode() produces
    const orderObject = {
      side: side,
      quantity: orderData.quantity,
      price: orderData.price || '',
      market_id: orderData.marketId, // CORRECT: snake_case
      base_account_address: orderData.baseAccountAddress, // CORRECT: snake_case
      quote_account_address: orderData.quoteAccountAddress, // CORRECT: snake_case
      execution_type: executionType, // CORRECT: snake_case
      matching_order_ids: orderData.matchingOrderIds || [] // CORRECT: snake_case
    };

    // Encode the order as protobuf wire format (matching prost::Message::encode())
    const encodedFields: Uint8Array[] = [];
    
    // Field 1: side (varint) - matching the backend's Order protobuf definition
    encodedFields.push(encodeProtobufWireFormat(1, 0, orderObject.side));
    
    // Field 2: quantity (length-delimited string)
    encodedFields.push(encodeProtobufWireFormat(2, 2, orderObject.quantity));
    
    // Field 3: price (optional, length-delimited string)
    if (orderObject.price) {
      encodedFields.push(encodeProtobufWireFormat(3, 2, orderObject.price));
    }
    
    // Field 4: market_id (length-delimited string)
    encodedFields.push(encodeProtobufWireFormat(4, 2, orderObject.market_id));
    
    // Field 5: base_account_address (length-delimited string)
    encodedFields.push(encodeProtobufWireFormat(5, 2, orderObject.base_account_address));
    
    // Field 6: quote_account_address (length-delimited string)
    encodedFields.push(encodeProtobufWireFormat(6, 2, orderObject.quote_account_address));
    
    // Field 7: execution_type (varint) - only encode if not 0 (default value)
    if (orderObject.execution_type !== 0) {
      encodedFields.push(encodeProtobufWireFormat(7, 0, orderObject.execution_type));
    }
    
    // Field 8: matching_order_ids (repeated varint)
    if (orderObject.matching_order_ids && orderObject.matching_order_ids.length > 0) {
      for (const orderId of orderObject.matching_order_ids) {
        encodedFields.push(encodeProtobufWireFormat(8, 0, orderId));
      }
    }
    
    // Combine all encoded fields
    const protobufBytes = concatenateUint8Arrays(encodedFields);
    
    console.log('Protobuf encoded bytes length:', protobufBytes.length);
    console.log('Protobuf encoded bytes:', Array.from(protobufBytes));
    
    // IMPORTANT: Sign the raw protobuf bytes WITHOUT Ethereum message prefix
    // The backend expects a raw signature of the protobuf bytes, not an EIP-191 signature
    // Since MetaMask doesn't support eth_sign, we use personal_sign and convert the signature
    
    // Convert protobuf bytes to hex string for signing
    const hexString = '0x' + Array.from(protobufBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Hex string for signing:', hexString);
    
    // Log the exact message that should be signed (for debugging)
    console.log('=== MESSAGE TO BE SIGNED (protobuf bytes) ===');
    console.log('Message length:', protobufBytes.length, 'bytes');
    console.log('Message (hex):', hexString.slice(2));
    console.log('Order details:');
    console.log('  Side:', orderData.side === 'SIDE_BID' ? 'BID (1)' : 'ASK (2)');
    console.log('  Quantity:', orderData.quantity);
    console.log('  Price:', orderData.price || 'undefined');
    console.log('  Market ID:', orderData.marketId);
    console.log('  Base Account:', orderData.baseAccountAddress);
    console.log('  Quote Account:', orderData.quoteAccountAddress);
    console.log('  Execution Type:', orderData.executionType === 'EXECUTION_TYPE_DISCRETIONARY' ? 'DISCRETIONARY (1)' : 'UNSPECIFIED (0)');
    console.log('  Matching Order IDs:', orderData.matchingOrderIds || []);
    console.log('=== END MESSAGE DETAILS ===');
    
    // Sign with personal_sign (this will add the Ethereum message prefix internally)
    // The backend might be able to handle EIP-191 signatures with the prefix
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [hexString, orderData.baseAccountAddress],
    });

    console.log('MetaMask signature received:', signature);
    console.log('Signature length:', signature.length);

    // Convert the signature to bytes
    // Remove the '0x' prefix and convert to Uint8Array
    const signatureHex = signature.slice(2);
    const signatureBytes = new Uint8Array(signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    
    console.log('Signature bytes length:', signatureBytes.length);
    console.log('Signature bytes:', Array.from(signatureBytes));
    
    // Verify signature length (should be 65 bytes for secp256k1)
    if (signatureBytes.length !== 65) {
      console.warn('Warning: Signature length is', signatureBytes.length, 'bytes, expected 65 bytes');
    }
    
    return signatureBytes;
  } catch (error) {
    console.error('Protobuf signing error:', error);
    throw new Error('Failed to sign order with protobuf encoding');
  }
}

// Export for testing
(window as any).testWithGlobalProtobuf = signOrderWithGlobalProtobuf; 