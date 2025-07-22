import * as jspb from 'google-protobuf'



export class Empty extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Empty.AsObject;
  static toObject(includeInstance: boolean, msg: Empty): Empty.AsObject;
  static serializeBinaryToWriter(message: Empty, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Empty;
  static deserializeBinaryFromReader(message: Empty, reader: jspb.BinaryReader): Empty;
}

export namespace Empty {
  export type AsObject = {
  }
}

export class CancelOrderRequest extends jspb.Message {
  getOrder(): OrderToCancel | undefined;
  setOrder(value?: OrderToCancel): CancelOrderRequest;
  hasOrder(): boolean;
  clearOrder(): CancelOrderRequest;

  getSignatureHash(): Uint8Array | string;
  getSignatureHash_asU8(): Uint8Array;
  getSignatureHash_asB64(): string;
  setSignatureHash(value: Uint8Array | string): CancelOrderRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CancelOrderRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CancelOrderRequest): CancelOrderRequest.AsObject;
  static serializeBinaryToWriter(message: CancelOrderRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CancelOrderRequest;
  static deserializeBinaryFromReader(message: CancelOrderRequest, reader: jspb.BinaryReader): CancelOrderRequest;
}

export namespace CancelOrderRequest {
  export type AsObject = {
    order?: OrderToCancel.AsObject,
    signatureHash: Uint8Array | string,
  }
}

export class CancelOrderResponse extends jspb.Message {
  getOrderCanceled(): boolean;
  setOrderCanceled(value: boolean): CancelOrderResponse;

  getTransactionHashesList(): Array<TransactionHash>;
  setTransactionHashesList(value: Array<TransactionHash>): CancelOrderResponse;
  clearTransactionHashesList(): CancelOrderResponse;
  addTransactionHashes(value?: TransactionHash, index?: number): TransactionHash;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CancelOrderResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CancelOrderResponse): CancelOrderResponse.AsObject;
  static serializeBinaryToWriter(message: CancelOrderResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CancelOrderResponse;
  static deserializeBinaryFromReader(message: CancelOrderResponse, reader: jspb.BinaryReader): CancelOrderResponse;
}

export namespace CancelOrderResponse {
  export type AsObject = {
    orderCanceled: boolean,
    transactionHashesList: Array<TransactionHash.AsObject>,
  }
}

export class OrderbookRequest extends jspb.Message {
  getContinueStream(): boolean;
  setContinueStream(value: boolean): OrderbookRequest;

  getMarketId(): string;
  setMarketId(value: string): OrderbookRequest;

  getHistoricalOpenOrders(): boolean;
  setHistoricalOpenOrders(value: boolean): OrderbookRequest;
  hasHistoricalOpenOrders(): boolean;
  clearHistoricalOpenOrders(): OrderbookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderbookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: OrderbookRequest): OrderbookRequest.AsObject;
  static serializeBinaryToWriter(message: OrderbookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderbookRequest;
  static deserializeBinaryFromReader(message: OrderbookRequest, reader: jspb.BinaryReader): OrderbookRequest;
}

export namespace OrderbookRequest {
  export type AsObject = {
    continueStream: boolean,
    marketId: string,
    historicalOpenOrders?: boolean,
  }

  export enum HistoricalOpenOrdersCase { 
    _HISTORICAL_OPEN_ORDERS_NOT_SET = 0,
    HISTORICAL_OPEN_ORDERS = 3,
  }
}

export class SendOrderRequest extends jspb.Message {
  getOrder(): Order | undefined;
  setOrder(value?: Order): SendOrderRequest;
  hasOrder(): boolean;
  clearOrder(): SendOrderRequest;

  getSignatureHash(): Uint8Array | string;
  getSignatureHash_asU8(): Uint8Array;
  getSignatureHash_asB64(): string;
  setSignatureHash(value: Uint8Array | string): SendOrderRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendOrderRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SendOrderRequest): SendOrderRequest.AsObject;
  static serializeBinaryToWriter(message: SendOrderRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendOrderRequest;
  static deserializeBinaryFromReader(message: SendOrderRequest, reader: jspb.BinaryReader): SendOrderRequest;
}

export namespace SendOrderRequest {
  export type AsObject = {
    order?: Order.AsObject,
    signatureHash: Uint8Array | string,
  }
}

export class Order extends jspb.Message {
  getSide(): Side;
  setSide(value: Side): Order;

  getQuantity(): string;
  setQuantity(value: string): Order;

  getPrice(): string;
  setPrice(value: string): Order;
  hasPrice(): boolean;
  clearPrice(): Order;

  getMarketId(): string;
  setMarketId(value: string): Order;

  getBaseAccountAddress(): string;
  setBaseAccountAddress(value: string): Order;

  getQuoteAccountAddress(): string;
  setQuoteAccountAddress(value: string): Order;

  getExecutionType(): ExecutionType;
  setExecutionType(value: ExecutionType): Order;

  getMatchingOrderIdsList(): Array<number>;
  setMatchingOrderIdsList(value: Array<number>): Order;
  clearMatchingOrderIdsList(): Order;
  addMatchingOrderIds(value: number, index?: number): Order;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Order.AsObject;
  static toObject(includeInstance: boolean, msg: Order): Order.AsObject;
  static serializeBinaryToWriter(message: Order, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Order;
  static deserializeBinaryFromReader(message: Order, reader: jspb.BinaryReader): Order;
}

export namespace Order {
  export type AsObject = {
    side: Side,
    quantity: string,
    price?: string,
    marketId: string,
    baseAccountAddress: string,
    quoteAccountAddress: string,
    executionType: ExecutionType,
    matchingOrderIdsList: Array<number>,
  }

  export enum PriceCase { 
    _PRICE_NOT_SET = 0,
    PRICE = 3,
  }
}

export class Trade extends jspb.Message {
  getTimestamp(): number;
  setTimestamp(value: number): Trade;

  getPrice(): string;
  setPrice(value: string): Trade;

  getQty(): string;
  setQty(value: string): Trade;

  getMaker(): string;
  setMaker(value: string): Trade;

  getTaker(): string;
  setTaker(value: string): Trade;

  getMakerBaseAddress(): string;
  setMakerBaseAddress(value: string): Trade;

  getMakerQuoteAddress(): string;
  setMakerQuoteAddress(value: string): Trade;

  getBuyer(): string;
  setBuyer(value: string): Trade;

  getSeller(): string;
  setSeller(value: string): Trade;

  getOrderHit(): number;
  setOrderHit(value: number): Trade;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Trade.AsObject;
  static toObject(includeInstance: boolean, msg: Trade): Trade.AsObject;
  static serializeBinaryToWriter(message: Trade, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Trade;
  static deserializeBinaryFromReader(message: Trade, reader: jspb.BinaryReader): Trade;
}

export namespace Trade {
  export type AsObject = {
    timestamp: number,
    price: string,
    qty: string,
    maker: string,
    taker: string,
    makerBaseAddress: string,
    makerQuoteAddress: string,
    buyer: string,
    seller: string,
    orderHit: number,
  }
}

export class TransactionHash extends jspb.Message {
  getHashType(): string;
  setHashType(value: string): TransactionHash;

  getHashValue(): string;
  setHashValue(value: string): TransactionHash;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransactionHash.AsObject;
  static toObject(includeInstance: boolean, msg: TransactionHash): TransactionHash.AsObject;
  static serializeBinaryToWriter(message: TransactionHash, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransactionHash;
  static deserializeBinaryFromReader(message: TransactionHash, reader: jspb.BinaryReader): TransactionHash;
}

export namespace TransactionHash {
  export type AsObject = {
    hashType: string,
    hashValue: string,
  }
}

export class SendOrderResponse extends jspb.Message {
  getOrderInBook(): boolean;
  setOrderInBook(value: boolean): SendOrderResponse;

  getOrder(): Order | undefined;
  setOrder(value?: Order): SendOrderResponse;
  hasOrder(): boolean;
  clearOrder(): SendOrderResponse;

  getTradesList(): Array<Trade>;
  setTradesList(value: Array<Trade>): SendOrderResponse;
  clearTradesList(): SendOrderResponse;
  addTrades(value?: Trade, index?: number): Trade;

  getTransactionHashesList(): Array<TransactionHash>;
  setTransactionHashesList(value: Array<TransactionHash>): SendOrderResponse;
  clearTransactionHashesList(): SendOrderResponse;
  addTransactionHashes(value?: TransactionHash, index?: number): TransactionHash;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendOrderResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SendOrderResponse): SendOrderResponse.AsObject;
  static serializeBinaryToWriter(message: SendOrderResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendOrderResponse;
  static deserializeBinaryFromReader(message: SendOrderResponse, reader: jspb.BinaryReader): SendOrderResponse;
}

export namespace SendOrderResponse {
  export type AsObject = {
    orderInBook: boolean,
    order?: Order.AsObject,
    tradesList: Array<Trade.AsObject>,
    transactionHashesList: Array<TransactionHash.AsObject>,
  }

  export enum OrderCase { 
    _ORDER_NOT_SET = 0,
    ORDER = 2,
  }
}

export class OrderToCancel extends jspb.Message {
  getMarketId(): string;
  setMarketId(value: string): OrderToCancel;

  getSide(): Side;
  setSide(value: Side): OrderToCancel;

  getTokenAddress(): string;
  setTokenAddress(value: string): OrderToCancel;

  getOrderId(): number;
  setOrderId(value: number): OrderToCancel;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderToCancel.AsObject;
  static toObject(includeInstance: boolean, msg: OrderToCancel): OrderToCancel.AsObject;
  static serializeBinaryToWriter(message: OrderToCancel, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderToCancel;
  static deserializeBinaryFromReader(message: OrderToCancel, reader: jspb.BinaryReader): OrderToCancel;
}

export namespace OrderToCancel {
  export type AsObject = {
    marketId: string,
    side: Side,
    tokenAddress: string,
    orderId: number,
  }
}

export class OrderbookEntry extends jspb.Message {
  getTimestamp(): number;
  setTimestamp(value: number): OrderbookEntry;

  getOrderId(): number;
  setOrderId(value: number): OrderbookEntry;

  getPrice(): string;
  setPrice(value: string): OrderbookEntry;

  getQuantity(): string;
  setQuantity(value: string): OrderbookEntry;

  getSide(): Side;
  setSide(value: Side): OrderbookEntry;

  getMakerBaseAddress(): string;
  setMakerBaseAddress(value: string): OrderbookEntry;

  getMakerQuoteAddress(): string;
  setMakerQuoteAddress(value: string): OrderbookEntry;

  getStatus(): OrderStatus;
  setStatus(value: OrderStatus): OrderbookEntry;

  getMarketId(): string;
  setMarketId(value: string): OrderbookEntry;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderbookEntry.AsObject;
  static toObject(includeInstance: boolean, msg: OrderbookEntry): OrderbookEntry.AsObject;
  static serializeBinaryToWriter(message: OrderbookEntry, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderbookEntry;
  static deserializeBinaryFromReader(message: OrderbookEntry, reader: jspb.BinaryReader): OrderbookEntry;
}

export namespace OrderbookEntry {
  export type AsObject = {
    timestamp: number,
    orderId: number,
    price: string,
    quantity: string,
    side: Side,
    makerBaseAddress: string,
    makerQuoteAddress: string,
    status: OrderStatus,
    marketId: string,
  }
}

export class AddOrderbookRequest extends jspb.Message {
  getMarketId(): string;
  setMarketId(value: string): AddOrderbookRequest;

  getDecimalPlaces(): number;
  setDecimalPlaces(value: number): AddOrderbookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddOrderbookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AddOrderbookRequest): AddOrderbookRequest.AsObject;
  static serializeBinaryToWriter(message: AddOrderbookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddOrderbookRequest;
  static deserializeBinaryFromReader(message: AddOrderbookRequest, reader: jspb.BinaryReader): AddOrderbookRequest;
}

export namespace AddOrderbookRequest {
  export type AsObject = {
    marketId: string,
    decimalPlaces: number,
  }
}

export class AddOrderbookResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): AddOrderbookResponse;

  getMarketId(): string;
  setMarketId(value: string): AddOrderbookResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddOrderbookResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AddOrderbookResponse): AddOrderbookResponse.AsObject;
  static serializeBinaryToWriter(message: AddOrderbookResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddOrderbookResponse;
  static deserializeBinaryFromReader(message: AddOrderbookResponse, reader: jspb.BinaryReader): AddOrderbookResponse;
}

export namespace AddOrderbookResponse {
  export type AsObject = {
    success: boolean,
    marketId: string,
  }
}

export class RemoveOrderbookRequest extends jspb.Message {
  getMarketId(): string;
  setMarketId(value: string): RemoveOrderbookRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveOrderbookRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveOrderbookRequest): RemoveOrderbookRequest.AsObject;
  static serializeBinaryToWriter(message: RemoveOrderbookRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveOrderbookRequest;
  static deserializeBinaryFromReader(message: RemoveOrderbookRequest, reader: jspb.BinaryReader): RemoveOrderbookRequest;
}

export namespace RemoveOrderbookRequest {
  export type AsObject = {
    marketId: string,
  }
}

export class RemoveOrderbookResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): RemoveOrderbookResponse;

  getMarketId(): string;
  setMarketId(value: string): RemoveOrderbookResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveOrderbookResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveOrderbookResponse): RemoveOrderbookResponse.AsObject;
  static serializeBinaryToWriter(message: RemoveOrderbookResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveOrderbookResponse;
  static deserializeBinaryFromReader(message: RemoveOrderbookResponse, reader: jspb.BinaryReader): RemoveOrderbookResponse;
}

export namespace RemoveOrderbookResponse {
  export type AsObject = {
    success: boolean,
    marketId: string,
  }
}

export class UnNormalizeDecimalsRequest extends jspb.Message {
  getMarketId(): string;
  setMarketId(value: string): UnNormalizeDecimalsRequest;

  getSide(): string;
  setSide(value: string): UnNormalizeDecimalsRequest;

  getQuantity(): string;
  setQuantity(value: string): UnNormalizeDecimalsRequest;

  getPrice(): string;
  setPrice(value: string): UnNormalizeDecimalsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnNormalizeDecimalsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UnNormalizeDecimalsRequest): UnNormalizeDecimalsRequest.AsObject;
  static serializeBinaryToWriter(message: UnNormalizeDecimalsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnNormalizeDecimalsRequest;
  static deserializeBinaryFromReader(message: UnNormalizeDecimalsRequest, reader: jspb.BinaryReader): UnNormalizeDecimalsRequest;
}

export namespace UnNormalizeDecimalsRequest {
  export type AsObject = {
    marketId: string,
    side: string,
    quantity: string,
    price: string,
  }
}

export class UnNormalizeDecimalsResponse extends jspb.Message {
  getBaseTokenQuantity(): string;
  setBaseTokenQuantity(value: string): UnNormalizeDecimalsResponse;

  getQuoteTokenQuantity(): string;
  setQuoteTokenQuantity(value: string): UnNormalizeDecimalsResponse;

  getBaseTokenDecimals(): number;
  setBaseTokenDecimals(value: number): UnNormalizeDecimalsResponse;

  getQuoteTokenDecimals(): number;
  setQuoteTokenDecimals(value: number): UnNormalizeDecimalsResponse;

  getPairDecimals(): number;
  setPairDecimals(value: number): UnNormalizeDecimalsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnNormalizeDecimalsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UnNormalizeDecimalsResponse): UnNormalizeDecimalsResponse.AsObject;
  static serializeBinaryToWriter(message: UnNormalizeDecimalsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnNormalizeDecimalsResponse;
  static deserializeBinaryFromReader(message: UnNormalizeDecimalsResponse, reader: jspb.BinaryReader): UnNormalizeDecimalsResponse;
}

export namespace UnNormalizeDecimalsResponse {
  export type AsObject = {
    baseTokenQuantity: string,
    quoteTokenQuantity: string,
    baseTokenDecimals: number,
    quoteTokenDecimals: number,
    pairDecimals: number,
  }
}

export enum Side { 
  SIDE_UNSPECIFIED = 0,
  SIDE_BID = 1,
  SIDE_ASK = 2,
}
export enum ExecutionType { 
  EXECUTION_TYPE_UNSPECIFIED = 0,
  EXECUTION_TYPE_DISCRETIONARY = 1,
}
export enum OrderStatus { 
  ORDER_STATUS_UNSPECIFIED = 0,
  ORDER_STATUS_ADDED = 1,
  ORDER_STATUS_UPDATED = 2,
  ORDER_STATUS_REMOVED = 3,
}
