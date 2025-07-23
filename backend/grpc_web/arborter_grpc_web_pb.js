/**
 * @fileoverview gRPC-Web generated client stub for xyz.aspens.arborter.v1
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
proto.xyz.aspens.arborter = {};
proto.xyz.aspens.arborter.v1 = require('./arborter_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient =
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
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient =
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
 *   !proto.xyz.aspens.arborter.v1.SendOrderRequest,
 *   !proto.xyz.aspens.arborter.v1.SendOrderResponse>}
 */
const methodDescriptor_ArborterService_SendOrder = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/SendOrder',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter.v1.SendOrderRequest,
  proto.xyz.aspens.arborter.v1.SendOrderResponse,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.SendOrderRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.SendOrderResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.SendOrderRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter.v1.SendOrderResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.SendOrderResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.sendOrder =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/SendOrder',
      request,
      metadata || {},
      methodDescriptor_ArborterService_SendOrder,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.SendOrderRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter.v1.SendOrderResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.sendOrder =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/SendOrder',
      request,
      metadata || {},
      methodDescriptor_ArborterService_SendOrder);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter.v1.CancelOrderRequest,
 *   !proto.xyz.aspens.arborter.v1.CancelOrderResponse>}
 */
const methodDescriptor_ArborterService_CancelOrder = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/CancelOrder',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter.v1.CancelOrderRequest,
  proto.xyz.aspens.arborter.v1.CancelOrderResponse,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.CancelOrderRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.CancelOrderResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.CancelOrderRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter.v1.CancelOrderResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.CancelOrderResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.cancelOrder =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/CancelOrder',
      request,
      metadata || {},
      methodDescriptor_ArborterService_CancelOrder,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.CancelOrderRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter.v1.CancelOrderResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.cancelOrder =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/CancelOrder',
      request,
      metadata || {},
      methodDescriptor_ArborterService_CancelOrder);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter.v1.TradeRequest,
 *   !proto.xyz.aspens.arborter.v1.Trade>}
 */
const methodDescriptor_ArborterService_Trades = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/Trades',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.xyz.aspens.arborter.v1.TradeRequest,
  proto.xyz.aspens.arborter.v1.Trade,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.TradeRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.Trade.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.TradeRequest} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.Trade>}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.trades =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/Trades',
      request,
      metadata || {},
      methodDescriptor_ArborterService_Trades);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.TradeRequest} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.Trade>}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.trades =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/Trades',
      request,
      metadata || {},
      methodDescriptor_ArborterService_Trades);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter.v1.OrderbookRequest,
 *   !proto.xyz.aspens.arborter.v1.OrderbookEntry>}
 */
const methodDescriptor_ArborterService_Orderbook = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/Orderbook',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.xyz.aspens.arborter.v1.OrderbookRequest,
  proto.xyz.aspens.arborter.v1.OrderbookEntry,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.OrderbookRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.OrderbookEntry.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.OrderbookRequest} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.OrderbookEntry>}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.orderbook =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/Orderbook',
      request,
      metadata || {},
      methodDescriptor_ArborterService_Orderbook);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.OrderbookRequest} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.OrderbookEntry>}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.orderbook =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/Orderbook',
      request,
      metadata || {},
      methodDescriptor_ArborterService_Orderbook);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter.v1.AddOrderbookRequest,
 *   !proto.xyz.aspens.arborter.v1.AddOrderbookResponse>}
 */
const methodDescriptor_ArborterService_AddOrderbook = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/AddOrderbook',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter.v1.AddOrderbookRequest,
  proto.xyz.aspens.arborter.v1.AddOrderbookResponse,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.AddOrderbookRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.AddOrderbookResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.AddOrderbookRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter.v1.AddOrderbookResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.AddOrderbookResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.addOrderbook =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/AddOrderbook',
      request,
      metadata || {},
      methodDescriptor_ArborterService_AddOrderbook,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.AddOrderbookRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter.v1.AddOrderbookResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.addOrderbook =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/AddOrderbook',
      request,
      metadata || {},
      methodDescriptor_ArborterService_AddOrderbook);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter.v1.RemoveOrderbookRequest,
 *   !proto.xyz.aspens.arborter.v1.RemoveOrderbookResponse>}
 */
const methodDescriptor_ArborterService_RemoveOrderbook = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/RemoveOrderbook',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter.v1.RemoveOrderbookRequest,
  proto.xyz.aspens.arborter.v1.RemoveOrderbookResponse,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.RemoveOrderbookRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.RemoveOrderbookResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.RemoveOrderbookRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter.v1.RemoveOrderbookResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.RemoveOrderbookResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.removeOrderbook =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/RemoveOrderbook',
      request,
      metadata || {},
      methodDescriptor_ArborterService_RemoveOrderbook,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.RemoveOrderbookRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter.v1.RemoveOrderbookResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.removeOrderbook =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/RemoveOrderbook',
      request,
      metadata || {},
      methodDescriptor_ArborterService_RemoveOrderbook);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsRequest,
 *   !proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsResponse>}
 */
const methodDescriptor_ArborterService_UnNormalizeDecimals = new grpc.web.MethodDescriptor(
  '/xyz.aspens.arborter.v1.ArborterService/UnNormalizeDecimals',
  grpc.web.MethodType.UNARY,
  proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsRequest,
  proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsResponse,
  /**
   * @param {!proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsResponse.deserializeBinary
);


/**
 * @param {!proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.xyz.aspens.arborter.v1.ArborterServiceClient.prototype.unNormalizeDecimals =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/UnNormalizeDecimals',
      request,
      metadata || {},
      methodDescriptor_ArborterService_UnNormalizeDecimals,
      callback);
};


/**
 * @param {!proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.xyz.aspens.arborter.v1.UnNormalizeDecimalsResponse>}
 *     Promise that resolves to the response
 */
proto.xyz.aspens.arborter.v1.ArborterServicePromiseClient.prototype.unNormalizeDecimals =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/xyz.aspens.arborter.v1.ArborterService/UnNormalizeDecimals',
      request,
      metadata || {},
      methodDescriptor_ArborterService_UnNormalizeDecimals);
};


module.exports = proto.xyz.aspens.arborter.v1;

