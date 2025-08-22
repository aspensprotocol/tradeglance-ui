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
    const hexString: string = Array.from(protobufBytes)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");

    // Create the message to be signed
    const messageToSign = `Order: ${chainId}:${hexString}`;

    // Sign the message using MetaMask
    const signature = await signMessage(messageToSign);

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
