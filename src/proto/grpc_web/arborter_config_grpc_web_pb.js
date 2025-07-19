/**
 * @fileoverview gRPC-Web generated client stub for xyz.aspens.arborter_config.v1
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');

const proto = {};
proto.xyz = {};
proto.xyz.aspens = {};
proto.xyz.aspens.arborter_config = {};
proto.xyz.aspens.arborter_config.v1 = require('./arborter_config_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options.format = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options.format = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.DeployContractRequest,
 *   !proto.xyz.aspens.arborter_config.v1.DeployContractResponse>}
 */
const methodDescriptor_ConfigService_DeployContract = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/DeployContract',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.DeployContractRequest,
  proto.xyz.aspens.arborter_config.v1.DeployContractResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.DeployContractRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.DeployContractResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeployContractRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.DeployContractResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.DeployContractResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.deployContract =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeployContract',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeployContract,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeployContractRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.DeployContractResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.deployContract =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeployContract',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeployContract);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.AddChainRequest,
 *   !proto.xyz.aspens.arborter_config.v1.AddChainResponse>}
 */
const methodDescriptor_ConfigService_AddChain = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/AddChain',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.AddChainRequest,
  proto.xyz.aspens.arborter_config.v1.AddChainResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.AddChainRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.AddChainResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddChainRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.AddChainResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.AddChainResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.addChain =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddChain',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddChain,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddChainRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.AddChainResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.addChain =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddChain',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddChain);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.AddTokenRequest,
 *   !proto.xyz.aspens.arborter_config.v1.AddTokenResponse>}
 */
const methodDescriptor_ConfigService_AddToken = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/AddToken',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.AddTokenRequest,
  proto.xyz.aspens.arborter_config.v1.AddTokenResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.AddTokenRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.AddTokenResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddTokenRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.AddTokenResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.AddTokenResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.addToken =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddToken',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddToken,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddTokenRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.AddTokenResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.addToken =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddToken',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddToken);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.AddMarketRequest,
 *   !proto.xyz.aspens.arborter_config.v1.AddMarketResponse>}
 */
const methodDescriptor_ConfigService_AddMarket = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/AddMarket',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.AddMarketRequest,
  proto.xyz.aspens.arborter_config.v1.AddMarketResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.AddMarketRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.AddMarketResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddMarketRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.AddMarketResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.AddMarketResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.addMarket =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddMarket',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddMarket,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddMarketRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.AddMarketResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.addMarket =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddMarket',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddMarket);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.AddTradeContractRequest,
 *   !proto.xyz.aspens.arborter_config.v1.AddTradeContractResponse>}
 */
const methodDescriptor_ConfigService_AddTradeContract = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/AddTradeContract',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.AddTradeContractRequest,
  proto.xyz.aspens.arborter_config.v1.AddTradeContractResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.AddTradeContractRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.AddTradeContractResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddTradeContractRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.AddTradeContractResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.AddTradeContractResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.addTradeContract =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddTradeContract',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddTradeContract,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.AddTradeContractRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.AddTradeContractResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.addTradeContract =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/AddTradeContract',
      request,
      metadata || {},
      methodDescriptor_ConfigService_AddTradeContract);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.GetConfigRequest,
 *   !proto.xyz.aspens.arborter_config.v1.GetConfigResponse>}
 */
const methodDescriptor_ConfigService_GetConfig = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/GetConfig',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.GetConfigRequest,
  proto.xyz.aspens.arborter_config.v1.GetConfigResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.GetConfigRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.GetConfigResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.GetConfigRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.GetConfigResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.GetConfigResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.getConfig =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/GetConfig',
      request,
      metadata || {},
      methodDescriptor_ConfigService_GetConfig,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.GetConfigRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.GetConfigResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.getConfig =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/GetConfig',
      request,
      metadata || {},
      methodDescriptor_ConfigService_GetConfig);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.Empty,
 *   !proto.xyz.aspens.arborter_config.v1.VersionInfo>}
 */
const methodDescriptor_ConfigService_GetVersion = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/GetVersion',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.Empty,
  proto.xyz.aspens.arborter_config.v1.VersionInfo,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.VersionInfo.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.VersionInfo)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.VersionInfo>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.getVersion =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/GetVersion',
      request,
      metadata || {},
      methodDescriptor_ConfigService_GetVersion,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.Empty} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.VersionInfo>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.getVersion =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/GetVersion',
      request,
      metadata || {},
      methodDescriptor_ConfigService_GetVersion);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.DeleteMarketRequest,
 *   !proto.xyz.aspens.arborter_config.v1.DeleteMarketResponse>}
 */
const methodDescriptor_ConfigService_DeleteMarket = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/DeleteMarket',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.DeleteMarketRequest,
  proto.xyz.aspens.arborter_config.v1.DeleteMarketResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.DeleteMarketRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.DeleteMarketResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteMarketRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.DeleteMarketResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.DeleteMarketResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.deleteMarket =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteMarket',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteMarket,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteMarketRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.DeleteMarketResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.deleteMarket =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteMarket',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteMarket);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.DeleteTokenRequest,
 *   !proto.xyz.aspens.arborter_config.v1.DeleteTokenResponse>}
 */
const methodDescriptor_ConfigService_DeleteToken = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/DeleteToken',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.DeleteTokenRequest,
  proto.xyz.aspens.arborter_config.v1.DeleteTokenResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.DeleteTokenRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.DeleteTokenResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteTokenRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.DeleteTokenResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.DeleteTokenResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.deleteToken =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteToken',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteToken,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteTokenRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.DeleteTokenResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.deleteToken =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteToken',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteToken);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.DeleteChainRequest,
 *   !proto.xyz.aspens.arborter_config.v1.DeleteChainResponse>}
 */
const methodDescriptor_ConfigService_DeleteChain = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/DeleteChain',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.DeleteChainRequest,
  proto.xyz.aspens.arborter_config.v1.DeleteChainResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.DeleteChainRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.DeleteChainResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteChainRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.DeleteChainResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.DeleteChainResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.deleteChain =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteChain',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteChain,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteChainRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.DeleteChainResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.deleteChain =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteChain',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteChain);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter_config.v1.DeleteTradeContractRequest,
 *   !proto.xyz.aspens.arborter_config.v1.DeleteTradeContractResponse>}
 */
const methodDescriptor_ConfigService_DeleteTradeContract = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter_config.v1.ConfigService/DeleteTradeContract',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter_config.v1.DeleteTradeContractRequest,
  proto.xyz.aspens.arborter_config.v1.DeleteTradeContractResponse,
  /**
   * @param {!proto.xyz.aspens.arborter_config.v1.DeleteTradeContractRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter_config.v1.DeleteTradeContractResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteTradeContractRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter_config.v1.DeleteTradeContractResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter_config.v1.DeleteTradeContractResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter_config.v1.ConfigServiceClient.prototype.deleteTradeContract =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteTradeContract',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteTradeContract,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter_config.v1.DeleteTradeContractRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter_config.v1.DeleteTradeContractResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter_config.v1.ConfigServicePromiseClient.prototype.deleteTradeContract =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter_config.v1.ConfigService/DeleteTradeContract',
      request,
      metadata || {},
      methodDescriptor_ConfigService_DeleteTradeContract);
};


module.exports = proto.xyz.aspens.arborter_config.v1;

