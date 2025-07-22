import * as jspb from 'google-protobuf'



export class DeployContractRequest extends jspb.Message {
  getChainNetwork(): string;
  setChainNetwork(value: string): DeployContractRequest;

  getBaseOrQuote(): string;
  setBaseOrQuote(value: string): DeployContractRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeployContractRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeployContractRequest): DeployContractRequest.AsObject;
  static serializeBinaryToWriter(message: DeployContractRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeployContractRequest;
  static deserializeBinaryFromReader(message: DeployContractRequest, reader: jspb.BinaryReader): DeployContractRequest;
}

export namespace DeployContractRequest {
  export type AsObject = {
    chainNetwork: string,
    baseOrQuote: string,
  }
}

export class DeployContractResponse extends jspb.Message {
  getBaseAddress(): string;
  setBaseAddress(value: string): DeployContractResponse;

  getQuoteAddress(): string;
  setQuoteAddress(value: string): DeployContractResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeployContractResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeployContractResponse): DeployContractResponse.AsObject;
  static serializeBinaryToWriter(message: DeployContractResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeployContractResponse;
  static deserializeBinaryFromReader(message: DeployContractResponse, reader: jspb.BinaryReader): DeployContractResponse;
}

export namespace DeployContractResponse {
  export type AsObject = {
    baseAddress: string,
    quoteAddress: string,
  }
}

export class AddChainRequest extends jspb.Message {
  getChain(): Chain | undefined;
  setChain(value?: Chain): AddChainRequest;
  hasChain(): boolean;
  clearChain(): AddChainRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddChainRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AddChainRequest): AddChainRequest.AsObject;
  static serializeBinaryToWriter(message: AddChainRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddChainRequest;
  static deserializeBinaryFromReader(message: AddChainRequest, reader: jspb.BinaryReader): AddChainRequest;
}

export namespace AddChainRequest {
  export type AsObject = {
    chain?: Chain.AsObject,
  }
}

export class AddChainResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): AddChainResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): AddChainResponse;
  hasConfig(): boolean;
  clearConfig(): AddChainResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddChainResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AddChainResponse): AddChainResponse.AsObject;
  static serializeBinaryToWriter(message: AddChainResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddChainResponse;
  static deserializeBinaryFromReader(message: AddChainResponse, reader: jspb.BinaryReader): AddChainResponse;
}

export namespace AddChainResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

export class AddTokenRequest extends jspb.Message {
  getChainNetwork(): string;
  setChainNetwork(value: string): AddTokenRequest;

  getToken(): Token | undefined;
  setToken(value?: Token): AddTokenRequest;
  hasToken(): boolean;
  clearToken(): AddTokenRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddTokenRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AddTokenRequest): AddTokenRequest.AsObject;
  static serializeBinaryToWriter(message: AddTokenRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddTokenRequest;
  static deserializeBinaryFromReader(message: AddTokenRequest, reader: jspb.BinaryReader): AddTokenRequest;
}

export namespace AddTokenRequest {
  export type AsObject = {
    chainNetwork: string,
    token?: Token.AsObject,
  }
}

export class AddTokenResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): AddTokenResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): AddTokenResponse;
  hasConfig(): boolean;
  clearConfig(): AddTokenResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddTokenResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AddTokenResponse): AddTokenResponse.AsObject;
  static serializeBinaryToWriter(message: AddTokenResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddTokenResponse;
  static deserializeBinaryFromReader(message: AddTokenResponse, reader: jspb.BinaryReader): AddTokenResponse;
}

export namespace AddTokenResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

export class AddMarketRequest extends jspb.Message {
  getBaseChainNetwork(): string;
  setBaseChainNetwork(value: string): AddMarketRequest;

  getQuoteChainNetwork(): string;
  setQuoteChainNetwork(value: string): AddMarketRequest;

  getBaseChainTokenSymbol(): string;
  setBaseChainTokenSymbol(value: string): AddMarketRequest;

  getQuoteChainTokenSymbol(): string;
  setQuoteChainTokenSymbol(value: string): AddMarketRequest;

  getBaseChainTokenAddress(): string;
  setBaseChainTokenAddress(value: string): AddMarketRequest;

  getQuoteChainTokenAddress(): string;
  setQuoteChainTokenAddress(value: string): AddMarketRequest;

  getBaseChainTokenDecimals(): number;
  setBaseChainTokenDecimals(value: number): AddMarketRequest;

  getQuoteChainTokenDecimals(): number;
  setQuoteChainTokenDecimals(value: number): AddMarketRequest;

  getPairDecimals(): number;
  setPairDecimals(value: number): AddMarketRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddMarketRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AddMarketRequest): AddMarketRequest.AsObject;
  static serializeBinaryToWriter(message: AddMarketRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddMarketRequest;
  static deserializeBinaryFromReader(message: AddMarketRequest, reader: jspb.BinaryReader): AddMarketRequest;
}

export namespace AddMarketRequest {
  export type AsObject = {
    baseChainNetwork: string,
    quoteChainNetwork: string,
    baseChainTokenSymbol: string,
    quoteChainTokenSymbol: string,
    baseChainTokenAddress: string,
    quoteChainTokenAddress: string,
    baseChainTokenDecimals: number,
    quoteChainTokenDecimals: number,
    pairDecimals: number,
  }
}

export class AddMarketResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): AddMarketResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): AddMarketResponse;
  hasConfig(): boolean;
  clearConfig(): AddMarketResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddMarketResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AddMarketResponse): AddMarketResponse.AsObject;
  static serializeBinaryToWriter(message: AddMarketResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddMarketResponse;
  static deserializeBinaryFromReader(message: AddMarketResponse, reader: jspb.BinaryReader): AddMarketResponse;
}

export namespace AddMarketResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

export class AddTradeContractRequest extends jspb.Message {
  getAddress(): string;
  setAddress(value: string): AddTradeContractRequest;

  getChainId(): number;
  setChainId(value: number): AddTradeContractRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddTradeContractRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AddTradeContractRequest): AddTradeContractRequest.AsObject;
  static serializeBinaryToWriter(message: AddTradeContractRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddTradeContractRequest;
  static deserializeBinaryFromReader(message: AddTradeContractRequest, reader: jspb.BinaryReader): AddTradeContractRequest;
}

export namespace AddTradeContractRequest {
  export type AsObject = {
    address: string,
    chainId: number,
  }
}

export class AddTradeContractResponse extends jspb.Message {
  getTradeContract(): TradeContract | undefined;
  setTradeContract(value?: TradeContract): AddTradeContractResponse;
  hasTradeContract(): boolean;
  clearTradeContract(): AddTradeContractResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddTradeContractResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AddTradeContractResponse): AddTradeContractResponse.AsObject;
  static serializeBinaryToWriter(message: AddTradeContractResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddTradeContractResponse;
  static deserializeBinaryFromReader(message: AddTradeContractResponse, reader: jspb.BinaryReader): AddTradeContractResponse;
}

export namespace AddTradeContractResponse {
  export type AsObject = {
    tradeContract?: TradeContract.AsObject,
  }
}

export class GetConfigRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetConfigRequest): GetConfigRequest.AsObject;
  static serializeBinaryToWriter(message: GetConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetConfigRequest;
  static deserializeBinaryFromReader(message: GetConfigRequest, reader: jspb.BinaryReader): GetConfigRequest;
}

export namespace GetConfigRequest {
  export type AsObject = {
  }
}

export class GetConfigResponse extends jspb.Message {
  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): GetConfigResponse;
  hasConfig(): boolean;
  clearConfig(): GetConfigResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetConfigResponse): GetConfigResponse.AsObject;
  static serializeBinaryToWriter(message: GetConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetConfigResponse;
  static deserializeBinaryFromReader(message: GetConfigResponse, reader: jspb.BinaryReader): GetConfigResponse;
}

export namespace GetConfigResponse {
  export type AsObject = {
    config?: Configuration.AsObject,
  }
}

export class Configuration extends jspb.Message {
  getChainsList(): Array<Chain>;
  setChainsList(value: Array<Chain>): Configuration;
  clearChainsList(): Configuration;
  addChains(value?: Chain, index?: number): Chain;

  getMarketsList(): Array<Market>;
  setMarketsList(value: Array<Market>): Configuration;
  clearMarketsList(): Configuration;
  addMarkets(value?: Market, index?: number): Market;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Configuration.AsObject;
  static toObject(includeInstance: boolean, msg: Configuration): Configuration.AsObject;
  static serializeBinaryToWriter(message: Configuration, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Configuration;
  static deserializeBinaryFromReader(message: Configuration, reader: jspb.BinaryReader): Configuration;
}

export namespace Configuration {
  export type AsObject = {
    chainsList: Array<Chain.AsObject>,
    marketsList: Array<Market.AsObject>,
  }
}

export class TradeContract extends jspb.Message {
  getContractId(): string;
  setContractId(value: string): TradeContract;
  hasContractId(): boolean;
  clearContractId(): TradeContract;

  getAddress(): string;
  setAddress(value: string): TradeContract;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TradeContract.AsObject;
  static toObject(includeInstance: boolean, msg: TradeContract): TradeContract.AsObject;
  static serializeBinaryToWriter(message: TradeContract, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TradeContract;
  static deserializeBinaryFromReader(message: TradeContract, reader: jspb.BinaryReader): TradeContract;
}

export namespace TradeContract {
  export type AsObject = {
    contractId?: string,
    address: string,
  }

  export enum ContractIdCase { 
    _CONTRACT_ID_NOT_SET = 0,
    CONTRACT_ID = 1,
  }
}

export class Chain extends jspb.Message {
  getArchitecture(): string;
  setArchitecture(value: string): Chain;

  getCanonicalName(): string;
  setCanonicalName(value: string): Chain;

  getNetwork(): string;
  setNetwork(value: string): Chain;

  getChainId(): number;
  setChainId(value: number): Chain;

  getContractOwnerAddress(): string;
  setContractOwnerAddress(value: string): Chain;

  getExplorerUrl(): string;
  setExplorerUrl(value: string): Chain;
  hasExplorerUrl(): boolean;
  clearExplorerUrl(): Chain;

  getRpcUrl(): string;
  setRpcUrl(value: string): Chain;

  getServiceAddress(): string;
  setServiceAddress(value: string): Chain;

  getTradeContract(): TradeContract | undefined;
  setTradeContract(value?: TradeContract): Chain;
  hasTradeContract(): boolean;
  clearTradeContract(): Chain;

  getTokensMap(): jspb.Map<string, Token>;
  clearTokensMap(): Chain;

  getBaseOrQuote(): BaseOrQuote;
  setBaseOrQuote(value: BaseOrQuote): Chain;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Chain.AsObject;
  static toObject(includeInstance: boolean, msg: Chain): Chain.AsObject;
  static serializeBinaryToWriter(message: Chain, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Chain;
  static deserializeBinaryFromReader(message: Chain, reader: jspb.BinaryReader): Chain;
}

export namespace Chain {
  export type AsObject = {
    architecture: string,
    canonicalName: string,
    network: string,
    chainId: number,
    contractOwnerAddress: string,
    explorerUrl?: string,
    rpcUrl: string,
    serviceAddress: string,
    tradeContract?: TradeContract.AsObject,
    tokensMap: Array<[string, Token.AsObject]>,
    baseOrQuote: BaseOrQuote,
  }

  export enum ExplorerUrlCase { 
    _EXPLORER_URL_NOT_SET = 0,
    EXPLORER_URL = 6,
  }
}

export class Market extends jspb.Message {
  getSlug(): string;
  setSlug(value: string): Market;

  getName(): string;
  setName(value: string): Market;

  getBaseChainNetwork(): string;
  setBaseChainNetwork(value: string): Market;

  getQuoteChainNetwork(): string;
  setQuoteChainNetwork(value: string): Market;

  getBaseChainTokenSymbol(): string;
  setBaseChainTokenSymbol(value: string): Market;

  getQuoteChainTokenSymbol(): string;
  setQuoteChainTokenSymbol(value: string): Market;

  getBaseChainTokenDecimals(): number;
  setBaseChainTokenDecimals(value: number): Market;

  getQuoteChainTokenDecimals(): number;
  setQuoteChainTokenDecimals(value: number): Market;

  getPairDecimals(): number;
  setPairDecimals(value: number): Market;

  getMarketId(): string;
  setMarketId(value: string): Market;
  hasMarketId(): boolean;
  clearMarketId(): Market;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Market.AsObject;
  static toObject(includeInstance: boolean, msg: Market): Market.AsObject;
  static serializeBinaryToWriter(message: Market, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Market;
  static deserializeBinaryFromReader(message: Market, reader: jspb.BinaryReader): Market;
}

export namespace Market {
  export type AsObject = {
    slug: string,
    name: string,
    baseChainNetwork: string,
    quoteChainNetwork: string,
    baseChainTokenSymbol: string,
    quoteChainTokenSymbol: string,
    baseChainTokenDecimals: number,
    quoteChainTokenDecimals: number,
    pairDecimals: number,
    marketId?: string,
  }

  export enum MarketIdCase { 
    _MARKET_ID_NOT_SET = 0,
    MARKET_ID = 10,
  }
}

export class Token extends jspb.Message {
  getName(): string;
  setName(value: string): Token;

  getSymbol(): string;
  setSymbol(value: string): Token;

  getAddress(): string;
  setAddress(value: string): Token;

  getTokenId(): string;
  setTokenId(value: string): Token;
  hasTokenId(): boolean;
  clearTokenId(): Token;

  getDecimals(): number;
  setDecimals(value: number): Token;

  getTradePrecision(): number;
  setTradePrecision(value: number): Token;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Token.AsObject;
  static toObject(includeInstance: boolean, msg: Token): Token.AsObject;
  static serializeBinaryToWriter(message: Token, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Token;
  static deserializeBinaryFromReader(message: Token, reader: jspb.BinaryReader): Token;
}

export namespace Token {
  export type AsObject = {
    name: string,
    symbol: string,
    address: string,
    tokenId?: string,
    decimals: number,
    tradePrecision: number,
  }

  export enum TokenIdCase { 
    _TOKEN_ID_NOT_SET = 0,
    TOKEN_ID = 4,
  }
}

export class DeleteMarketRequest extends jspb.Message {
  getMarketId(): string;
  setMarketId(value: string): DeleteMarketRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteMarketRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteMarketRequest): DeleteMarketRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteMarketRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteMarketRequest;
  static deserializeBinaryFromReader(message: DeleteMarketRequest, reader: jspb.BinaryReader): DeleteMarketRequest;
}

export namespace DeleteMarketRequest {
  export type AsObject = {
    marketId: string,
  }
}

export class DeleteMarketResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): DeleteMarketResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): DeleteMarketResponse;
  hasConfig(): boolean;
  clearConfig(): DeleteMarketResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteMarketResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteMarketResponse): DeleteMarketResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteMarketResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteMarketResponse;
  static deserializeBinaryFromReader(message: DeleteMarketResponse, reader: jspb.BinaryReader): DeleteMarketResponse;
}

export namespace DeleteMarketResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

export class DeleteTokenRequest extends jspb.Message {
  getChainNetwork(): string;
  setChainNetwork(value: string): DeleteTokenRequest;

  getTokenSymbol(): string;
  setTokenSymbol(value: string): DeleteTokenRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTokenRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTokenRequest): DeleteTokenRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteTokenRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTokenRequest;
  static deserializeBinaryFromReader(message: DeleteTokenRequest, reader: jspb.BinaryReader): DeleteTokenRequest;
}

export namespace DeleteTokenRequest {
  export type AsObject = {
    chainNetwork: string,
    tokenSymbol: string,
  }
}

export class DeleteTokenResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): DeleteTokenResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): DeleteTokenResponse;
  hasConfig(): boolean;
  clearConfig(): DeleteTokenResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTokenResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTokenResponse): DeleteTokenResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteTokenResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTokenResponse;
  static deserializeBinaryFromReader(message: DeleteTokenResponse, reader: jspb.BinaryReader): DeleteTokenResponse;
}

export namespace DeleteTokenResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

export class DeleteChainRequest extends jspb.Message {
  getChainNetwork(): string;
  setChainNetwork(value: string): DeleteChainRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteChainRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteChainRequest): DeleteChainRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteChainRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteChainRequest;
  static deserializeBinaryFromReader(message: DeleteChainRequest, reader: jspb.BinaryReader): DeleteChainRequest;
}

export namespace DeleteChainRequest {
  export type AsObject = {
    chainNetwork: string,
  }
}

export class DeleteChainResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): DeleteChainResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): DeleteChainResponse;
  hasConfig(): boolean;
  clearConfig(): DeleteChainResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteChainResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteChainResponse): DeleteChainResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteChainResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteChainResponse;
  static deserializeBinaryFromReader(message: DeleteChainResponse, reader: jspb.BinaryReader): DeleteChainResponse;
}

export namespace DeleteChainResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

export class DeleteTradeContractRequest extends jspb.Message {
  getChainId(): number;
  setChainId(value: number): DeleteTradeContractRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTradeContractRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTradeContractRequest): DeleteTradeContractRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteTradeContractRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTradeContractRequest;
  static deserializeBinaryFromReader(message: DeleteTradeContractRequest, reader: jspb.BinaryReader): DeleteTradeContractRequest;
}

export namespace DeleteTradeContractRequest {
  export type AsObject = {
    chainId: number,
  }
}

export class DeleteTradeContractResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): DeleteTradeContractResponse;

  getConfig(): Configuration | undefined;
  setConfig(value?: Configuration): DeleteTradeContractResponse;
  hasConfig(): boolean;
  clearConfig(): DeleteTradeContractResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTradeContractResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTradeContractResponse): DeleteTradeContractResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteTradeContractResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTradeContractResponse;
  static deserializeBinaryFromReader(message: DeleteTradeContractResponse, reader: jspb.BinaryReader): DeleteTradeContractResponse;
}

export namespace DeleteTradeContractResponse {
  export type AsObject = {
    success: boolean,
    config?: Configuration.AsObject,
  }
}

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

export class VersionInfo extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): VersionInfo;

  getGitCommitHash(): string;
  setGitCommitHash(value: string): VersionInfo;

  getGitCommitDate(): string;
  setGitCommitDate(value: string): VersionInfo;

  getGitBranch(): string;
  setGitBranch(value: string): VersionInfo;

  getBuildTimestamp(): string;
  setBuildTimestamp(value: string): VersionInfo;

  getTargetTriple(): string;
  setTargetTriple(value: string): VersionInfo;

  getRustcVersion(): string;
  setRustcVersion(value: string): VersionInfo;

  getCargoFeaturesList(): Array<string>;
  setCargoFeaturesList(value: Array<string>): VersionInfo;
  clearCargoFeaturesList(): VersionInfo;
  addCargoFeatures(value: string, index?: number): VersionInfo;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VersionInfo.AsObject;
  static toObject(includeInstance: boolean, msg: VersionInfo): VersionInfo.AsObject;
  static serializeBinaryToWriter(message: VersionInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VersionInfo;
  static deserializeBinaryFromReader(message: VersionInfo, reader: jspb.BinaryReader): VersionInfo;
}

export namespace VersionInfo {
  export type AsObject = {
    version: string,
    gitCommitHash: string,
    gitCommitDate: string,
    gitBranch: string,
    buildTimestamp: string,
    targetTriple: string,
    rustcVersion: string,
    cargoFeaturesList: Array<string>,
  }
}

export enum BaseOrQuote { 
  BASE_OR_QUOTE_UNSPECIFIED = 0,
  BASE_OR_QUOTE_BASE = 1,
  BASE_OR_QUOTE_QUOTE = 2,
}
