import { create, toBinary } from "@bufbuild/protobuf";
import { OrderSchema } from "../protos/gen/arborter_pb";
import type { OrderCreationData } from "./shared-types";

// Define proper types for MetaMask ethereum object
interface MetaMaskEthereumProvider {
  request: (args: { method: string; params: string[] }) => Promise<string>;
  isMetaMask?: boolean;
  selectedAddress?: string;
  networkVersion?: string;
  chainId?: string;
}

// Type assertion for the ethereum object
const getEthereumProvider = (): MetaMaskEthereumProvider => {
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum as MetaMaskEthereumProvider;
  }
  throw new Error("MetaMask is not installed");
};

export async function signOrderWithGlobalProtobuf(
  orderData: OrderCreationData,
  chainId: number,
  signMessage: (message: string) => Promise<string>,
): Promise<Uint8Array> {
  // Check if MetaMask is available
  getEthereumProvider();

  try {
    // Use proto enum values directly
    const { side } = orderData;
    const { executionType } = orderData;

    // Create the protobuf Order message exactly like the CLI does
    const orderMessage = create(OrderSchema, {
      side,
      quantity: orderData.quantity,
      price: orderData.price,
      marketId: orderData.marketId,
      baseAccountAddress: orderData.baseAccountAddress,
      quoteAccountAddress: orderData.quoteAccountAddress,
      executionType,
      matchingOrderIds:
        orderData.matchingOrderIds?.map((id) => BigInt(id)) || [], // Convert number[] to bigint[]
    });

    // Serialize the order to bytes exactly like the CLI does using toBinary
    const protobufBytes: Uint8Array = toBinary(OrderSchema, orderMessage);

    // IMPORTANT: We need to sign the exact same bytes that the CLI signs
    // The CLI uses order_for_sending.encode(&mut buffer) which creates raw protobuf bytes
    // Then signs those raw bytes directly with sign_transaction(&buffer, &privkey)

    // MetaMask removed eth_sign in August 2025, so we must use personal_sign
    // personal_sign adds a prefix, but we'll work around this by using a different approach
    // The backend expects signatures of raw protobuf bytes, so we need to sign them directly

    // Convert the raw protobuf bytes to a hex string for personal_sign
    const hexString = `0x${Array.from(protobufBytes)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("")}`;

    console.log("🔍 signing-utils: About to sign hex string:", hexString);

    // Use personal_sign to sign the hex data
    // Note: personal_sign adds a prefix, but we'll handle this in the backend
    // The backend will need to be updated to handle personal_sign signatures
    const signature = await signMessage(hexString);

    console.log("✅ signing-utils: Signature received:", signature);

    // Convert the signature to bytes
    const signatureBytes: Uint8Array = new Uint8Array(
      signature
        .slice(2)
        .match(/.{1,2}/g)
        ?.map((byte: string) => parseInt(byte, 16)) || [],
    );

    return signatureBytes;
  } catch (error: unknown) {
    console.error("Error signing order:", error);
    throw error;
  }
}

// Export for testing
(
  window as { testWithGlobalProtobuf?: typeof signOrderWithGlobalProtobuf }
).testWithGlobalProtobuf = signOrderWithGlobalProtobuf;
