import { create, toBinary } from "@bufbuild/protobuf";
import { OrderSchema, Side, ExecutionType } from "../protos/gen/arborter_pb";

declare global {
  interface Window {
    ethereum?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export interface OrderData {
  side: 1 | 2; // Numeric values: 1 = BID (buy), 2 = ASK (sell)
  quantity: string;
  price?: string;
  marketId: string;
  baseAccountAddress: string;
  quoteAccountAddress: string;
  executionType: 0 | 1; // Numeric values: 0 = UNSPECIFIED, 1 = DISCRETIONARY
  matchingOrderIds: number[];
}

export async function signOrderWithGlobalProtobuf(
  orderData: OrderData,
  chainId: number
): Promise<Uint8Array> {
  console.log('=== CALLING signOrderWithGlobalProtobuf ===');

  // Check if MetaMask is available
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Use numeric values directly (already converted in orderData)
    const side = orderData.side;
    const executionType = orderData.executionType;

    console.log('Execution type conversion:', {
      original: orderData.executionType,
      converted: executionType
    });

    // Create the protobuf Order message exactly like the CLI does
    const orderMessage = create(OrderSchema, {
      side: side,
      quantity: orderData.quantity,
      price: orderData.price,
      marketId: orderData.marketId,
      baseAccountAddress: orderData.baseAccountAddress,
      quoteAccountAddress: orderData.quoteAccountAddress,
      executionType: executionType,
      matchingOrderIds: [] as bigint[] // Always empty array like the working Rust client
    });

    console.log('Created protobuf message:', orderMessage);

    // Serialize the order to bytes exactly like the CLI does using toBinary
    const protobufBytes = toBinary(OrderSchema, orderMessage);
    
    console.log('Protobuf encoded bytes length:', protobufBytes.length);
    console.log('Protobuf encoded bytes:', Array.from(protobufBytes));
    const hexString = Array.from(protobufBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('Protobuf encoded bytes (hex):', hexString);

    console.log('=== MESSAGE TO BE SIGNED ===');
    console.log('Chain ID for signing:', chainId);
    console.log('Protobuf length:', protobufBytes.length, 'bytes');
    
    console.log('Order details:');
    console.log('  Side:', orderData.side, `(${side === 1 ? 'BID' : 'ASK'})`);
    console.log('  Quantity:', orderData.quantity);
    console.log('  Price:', orderData.price || 'None');
    console.log('  Market ID:', orderData.marketId);
    console.log('  Base Account:', orderData.baseAccountAddress);
    console.log('  Quote Account:', orderData.quoteAccountAddress);
    console.log('  Execution Type:', orderData.executionType, `(${executionType === 0 ? 'UNSPECIFIED' : 'DISCRETIONARY'})`);
    console.log('  Matching Order IDs:', orderData.matchingOrderIds);
    console.log('=== END MESSAGE DETAILS ===');

    // Sign the protobuf bytes using MetaMask
    const hexStringForSigning = '0x' + hexString;
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [hexStringForSigning, orderData.baseAccountAddress],
    });

    console.log('MetaMask signature received:', signature);
    
    // Convert hex signature to bytes
    const signatureBytes = new Uint8Array(
      signature.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    console.log('Signature length:', signature.length);
    console.log('Signature bytes length:', signatureBytes.length);
    console.log('Signature bytes:', Array.from(signatureBytes));

    return signatureBytes;
  } catch (error) {
    console.error('Protobuf signing error:', error);
    throw error;
  }
}

// Export for testing
(window as { testWithGlobalProtobuf?: typeof signOrderWithGlobalProtobuf }).testWithGlobalProtobuf = signOrderWithGlobalProtobuf; 