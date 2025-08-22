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
): Promise<Uint8Array> {
  console.log("=== CALLING signOrderWithGlobalProtobuf ===");

  // Check if MetaMask is available
  const ethereum: MetaMaskEthereumProvider = getEthereumProvider();

  try {
    // Use proto enum values directly
    const { side } = orderData;
    const { executionType } = orderData;

    console.log("Execution type conversion:", {
      original: orderData.executionType,
      converted: executionType,
    });

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

    console.log("Created protobuf message:", orderMessage);

    // Serialize the order to bytes exactly like the CLI does using toBinary
    const protobufBytes: Uint8Array = toBinary(OrderSchema, orderMessage);

    console.log("Protobuf encoded bytes length:", protobufBytes.length);
    console.log("Protobuf encoded bytes:", Array.from(protobufBytes));
    const hexString: string = Array.from(protobufBytes)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");
    console.log("Protobuf encoded bytes (hex):", hexString);

    console.log("=== MESSAGE TO BE SIGNED ===");
    console.log("Chain ID for signing:", chainId);
    console.log("Protobuf length:", protobufBytes.length, "bytes");

    console.log("Order details:");
    console.log("  Side:", orderData.side, `(${side === 1 ? "BID" : "ASK"})`);
    console.log("  Quantity:", orderData.quantity);
    console.log("  Price:", orderData.price || "None");
    console.log("  Market ID:", orderData.marketId);
    console.log("  Base Account:", orderData.baseAccountAddress);
    console.log("  Quote Account:", orderData.quoteAccountAddress);
    console.log(
      "  Execution Type:",
      orderData.executionType,
      `(${executionType === 0 ? "UNSPECIFIED" : "DISCRETIONARY"})`,
    );
    console.log("  Matching Order IDs:", orderData.matchingOrderIds || []);
    console.log("=== END MESSAGE DETAILS ===");

    // Sign the protobuf bytes using MetaMask
    const hexStringForSigning = `0x${hexString}`;
    const signature: string = await ethereum.request({
      method: "personal_sign",
      params: [hexStringForSigning, orderData.baseAccountAddress],
    });

    console.log("MetaMask signature received:", signature);

    // Convert hex signature to bytes
    const hexPairs = signature.slice(2).match(/.{1,2}/g);
    if (!hexPairs) {
      throw new Error("Invalid signature format");
    }
    const signatureBytes: Uint8Array = new Uint8Array(
      hexPairs.map((byte: string) => parseInt(byte, 16)),
    );

    console.log("Signature converted to bytes:", Array.from(signatureBytes));
    console.log("=== SIGNING COMPLETE ===");

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
