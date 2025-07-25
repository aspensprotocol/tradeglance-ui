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

// Simple protobuf wire format encoder
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
  
  // Convert side to number (enum)
  const side = orderData.side === 'SIDE_BID' ? 1 : 2;
  
  // Convert execution type to number (enum)
  const executionType = orderData.executionType === 'EXECUTION_TYPE_DISCRETIONARY' ? 1 : 0;

  console.log('Execution type conversion:', {
    original: orderData.executionType,
    converted: executionType
  });

  // Check if MetaMask is available
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Create a simple JSON-like structure that matches the expected order format
    // This approach avoids complex protobuf wire format encoding issues
    const orderObject = {
      side: side,
      quantity: orderData.quantity,
      price: orderData.price || '',
      marketId: orderData.marketId,
      baseAccountAddress: orderData.baseAccountAddress,
      quoteAccountAddress: orderData.quoteAccountAddress,
      executionType: executionType,
      matchingOrderIds: orderData.matchingOrderIds || []
    };

    // Convert to JSON string and then to bytes
    const jsonString = JSON.stringify(orderObject);
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(jsonString);
    
    console.log('JSON message to sign:', jsonString);
    console.log('Message bytes length:', messageBytes.length);
    console.log('Message bytes:', Array.from(messageBytes));
    
    // Convert bytes to hex string for MetaMask
    const hexString = '0x' + Array.from(messageBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Hex string for signing:', hexString);
    
    // Log the exact message that should be signed (for debugging)
    console.log('=== MESSAGE TO BE SIGNED (JSON) ===');
    console.log('Message length:', messageBytes.length, 'bytes');
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
    
    // Sign the message bytes with MetaMask
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
    console.error('JSON signing error:', error);
    throw new Error('Failed to sign order with JSON encoding');
  }
}

// Export for testing
(window as any).testWithGlobalProtobuf = signOrderWithGlobalProtobuf; 