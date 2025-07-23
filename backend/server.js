const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const ENVOY_PROXY_URL = process.env.ENVOY_PROXY_URL || 'http://localhost:8811';

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Next.js dev server
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Import fetch for making HTTP requests to Envoy
const fetch = require('node-fetch');
const protobuf = require('protobufjs');

// Load proto files
const protoRoot = protobuf.loadSync('./proto/arborter_config.proto');

// Utility function to encode protobuf message
function encodeProtobufMessage(messageType, data) {
  try {
    console.log('Encoding message type:', messageType.name);
    console.log('Data:', data);
    const message = messageType.create(data);
    console.log('Created message:', message);
    const buffer = messageType.encode(message).finish();
    console.log('Encoded buffer length:', buffer.length);
    return buffer;
  } catch (error) {
    console.error('Protobuf encoding error:', error);
    throw new Error('Failed to encode protobuf message');
  }
}

// Utility function to decode protobuf message
function decodeProtobufMessage(messageType, buffer) {
  try {
    const message = messageType.decode(buffer);
    return messageType.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
    });
  } catch (error) {
    console.error('Protobuf decoding error:', error);
    throw new Error('Failed to decode protobuf message');
  }
}

// Utility function to make gRPC-Web requests through Envoy
async function makeGrpcWebRequest(service, method, request, token) {
  const url = `${ENVOY_PROXY_URL}/${service}/${method}`;
  
  const headers = {
    'Content-Type': 'application/grpc-web+proto',
    'X-Grpc-Web': '1'
  };
  
  if (token) {
    headers['Authorization'] = token;
  }
  
  // Encode the request as protobuf
  let requestBuffer;
  if (method === 'GetConfig') {
    const GetConfigRequest = protoRoot.lookupType('xyz.aspens.arborter_config.v1.GetConfigRequest');
    requestBuffer = encodeProtobufMessage(GetConfigRequest, request || {});
  } else if (method === 'GetVersion') {
    const Empty = protoRoot.lookupType('xyz.aspens.arborter_config.v1.Empty');
    requestBuffer = encodeProtobufMessage(Empty, request || {});
  } else {
    // For other methods, use empty request for now
    requestBuffer = Buffer.alloc(0);
  }
  
  // If the buffer is empty, create a minimal protobuf message
  if (requestBuffer.length === 0) {
    // Create a minimal protobuf message with a dummy field
    requestBuffer = Buffer.from([0x08, 0x01]); // Field 1, wire type 0, value 1
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: requestBuffer
  });
  
  if (!response.ok) {
    throw new Error(`gRPC-Web request failed: ${response.status} ${response.statusText}`);
  }
  
  // Check gRPC status
  const grpcStatus = response.headers.get('grpc-status');
  const grpcMessage = response.headers.get('grpc-message');
  
  console.log('gRPC status:', grpcStatus);
  console.log('gRPC message:', grpcMessage);
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (grpcStatus && grpcStatus !== '0') {
    throw new Error(`gRPC error ${grpcStatus}: ${grpcMessage || 'Unknown error'}`);
  }
  
  // Get the response body as buffer
  const responseBuffer = await response.buffer();
  console.log('Response buffer length:', responseBuffer.length);
  console.log('Response buffer:', responseBuffer);
  
  // Decode the response based on the method
  if (method === 'GetConfig') {
    const GetConfigResponse = protoRoot.lookupType('xyz.aspens.arborter_config.v1.GetConfigResponse');
    return decodeProtobufMessage(GetConfigResponse, responseBuffer);
  } else if (method === 'GetVersion') {
    const VersionInfo = protoRoot.lookupType('xyz.aspens.arborter_config.v1.VersionInfo');
    return decodeProtobufMessage(VersionInfo, responseBuffer);
  } else {
    // For other methods, return the raw response for now
    return responseBuffer.toString('utf8');
  }
}

// Utility function to create streaming connection through Envoy
function createGrpcWebStream(service, method, request, token) {
  // For now, return a simple fetch request
  // TODO: Implement proper gRPC-Web streaming
  const url = `${ENVOY_PROXY_URL}/${service}/${method}`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = token;
  }
  
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    envoy_proxy_url: ENVOY_PROXY_URL
  });
});

// Config Service Routes
app.get('/api/config', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'GetConfig',
      null, // GetConfigRequest is empty, so we pass null
      token
    );
    res.json(response);
  } catch (error) {
    console.error('GetConfig error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config/version', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter_config.v1.ConfigService',
      'GetVersion',
      null, // GetVersion takes Empty message, so we pass null
      token
    );
    res.json(response);
  } catch (error) {
    console.error('GetVersion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Arborter Service Routes
app.post('/api/arborter/send-order', async (req, res) => {
  try {
    const { order, signatureHash } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      order: order,
      signatureHash: signatureHash
    };
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter.v1.ArborterService',
      'SendOrder',
      request,
      token
    );
    res.json(response);
  } catch (error) {
    console.error('SendOrder error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/arborter/cancel-order', async (req, res) => {
  try {
    const { order, signatureHash } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      order: order,
      signatureHash: signatureHash
    };
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter.v1.ArborterService',
      'CancelOrder',
      request,
      token
    );
    res.json(response);
  } catch (error) {
    console.error('CancelOrder error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/arborter/add-orderbook', async (req, res) => {
  try {
    const { marketId, decimalPlaces } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      marketId: marketId,
      decimalPlaces: decimalPlaces
    };
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter.v1.ArborterService',
      'AddOrderbook',
      request,
      token
    );
    res.json(response);
  } catch (error) {
    console.error('AddOrderbook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/arborter/remove-orderbook', async (req, res) => {
  try {
    const { marketId } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      marketId: marketId
    };
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter.v1.ArborterService',
      'RemoveOrderbook',
      request,
      token
    );
    res.json(response);
  } catch (error) {
    console.error('RemoveOrderbook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/arborter/unnormalize-decimals', async (req, res) => {
  try {
    const { marketId, side, quantity, price } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      marketId: marketId,
      side: side,
      quantity: quantity,
      price: price
    };
    
    const response = await makeGrpcWebRequest(
      'xyz.aspens.arborter.v1.ArborterService',
      'UnNormalizeDecimals',
      request,
      token
    );
    res.json(response);
  } catch (error) {
    console.error('UnNormalizeDecimals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming endpoints using Server-Sent Events through Envoy
app.post('/api/arborter/orderbook-stream', (req, res) => {
  try {
    const { continueStream, marketId, historicalOpenOrders, filterByTrader } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      continueStream: continueStream,
      marketId: marketId,
      historicalOpenOrders: historicalOpenOrders,
      filterByTrader: filterByTrader
    };
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Send initial connection message
    res.write('data: {"type": "connected", "message": "Orderbook stream connected"}\n\n');
    
    // Create gRPC-Web stream through Envoy
    const streamResponse = createGrpcWebStream(
      'xyz.aspens.arborter.v1.ArborterService',
      'Orderbook',
      request,
      token
    );
    
    streamResponse.then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      function readStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            const endData = JSON.stringify({ type: 'end', message: 'Stream ended' });
            res.write(`data: ${endData}\n\n`);
            res.end();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonData);
                
                // Skip connection messages
                if (data.type === 'connected') {
                  continue;
                }
                
                // Handle error messages
                if (data.type === 'error') {
                  const errorData = JSON.stringify({ type: 'error', error: data.error });
                  res.write(`data: ${errorData}\n\n`);
                  res.end();
                  return;
                }
                
                // Handle end messages
                if (data.type === 'end') {
                  const endData = JSON.stringify({ type: 'end', message: 'Stream ended' });
                  res.write(`data: ${endData}\n\n`);
                  res.end();
                  return;
                }
                
                // Handle actual data
                const eventData = JSON.stringify(data);
                res.write(`data: ${eventData}\n\n`);
              } catch (error) {
                console.error('Error parsing SSE data:', error);
                const errorData = JSON.stringify({ type: 'error', error: error.message });
                res.write(`data: ${errorData}\n\n`);
                res.end();
                return;
              }
            }
          }

          // Continue reading
          readStream();
        }).catch(error => {
          console.error('Stream read error:', error);
          const errorData = JSON.stringify({ type: 'error', error: error.message });
          res.write(`data: ${errorData}\n\n`);
          res.end();
        });
      }

      readStream();
    }).catch(error => {
      console.error('Stream setup error:', error);
      const errorData = JSON.stringify({ type: 'error', error: error.message });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected from orderbook stream');
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
    });
    
  } catch (error) {
    console.error('Orderbook stream setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/arborter/trades-stream', (req, res) => {
  try {
    const { continueStream, marketId, historicalClosedTrades, filterByTrader } = req.body;
    const token = req.headers.authorization;
    
    const request = {
      continueStream: continueStream,
      marketId: marketId,
      historicalClosedTrades: historicalClosedTrades,
      filterByTrader: filterByTrader
    };
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Send initial connection message
    res.write('data: {"type": "connected", "message": "Trades stream connected"}\n\n');
    
    // Create gRPC-Web stream through Envoy
    const streamResponse = createGrpcWebStream(
      'xyz.aspens.arborter.v1.ArborterService',
      'Trades',
      request,
      token
    );
    
    streamResponse.then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      function readStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            const endData = JSON.stringify({ type: 'end', message: 'Stream ended' });
            res.write(`data: ${endData}\n\n`);
            res.end();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonData);
                
                // Skip connection messages
                if (data.type === 'connected') {
                  continue;
                }
                
                // Handle error messages
                if (data.type === 'error') {
                  const errorData = JSON.stringify({ type: 'error', error: data.error });
                  res.write(`data: ${errorData}\n\n`);
                  res.end();
                  return;
                }
                
                // Handle end messages
                if (data.type === 'end') {
                  const endData = JSON.stringify({ type: 'end', message: 'Stream ended' });
                  res.write(`data: ${endData}\n\n`);
                  res.end();
                  return;
                }
                
                // Handle actual data
                const eventData = JSON.stringify(data);
                res.write(`data: ${eventData}\n\n`);
              } catch (error) {
                console.error('Error parsing SSE data:', error);
                const errorData = JSON.stringify({ type: 'error', error: error.message });
                res.write(`data: ${errorData}\n\n`);
                res.end();
                return;
              }
            }
          }

          // Continue reading
          readStream();
        }).catch(error => {
          console.error('Stream read error:', error);
          const errorData = JSON.stringify({ type: 'error', error: error.message });
          res.write(`data: ${errorData}\n\n`);
          res.end();
        });
      }

      readStream();
    }).catch(error => {
      console.error('Stream setup error:', error);
      const errorData = JSON.stringify({ type: 'error', error: error.message });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected from trades stream');
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
    });
    
  } catch (error) {
    console.error('Trades stream setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Envoy proxy URL: ${ENVOY_PROXY_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
}); 