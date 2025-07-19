const express = require('express');
const cors = require('cors');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
const PORT = process.env.PORT || 8080;
const GRPC_TARGET = process.env.GRPC_TARGET || 'host.docker.internal:50051';

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Load proto files
const CONFIG_PROTO_PATH = path.join(__dirname, 'src/proto/arborter_config.proto');
const ARBORTER_PROTO_PATH = path.join(__dirname, 'src/proto/arborter.proto');

const configPackageDefinition = protoLoader.loadSync(CONFIG_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const arborterPackageDefinition = protoLoader.loadSync(ARBORTER_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const configProtoDescriptor = grpc.loadPackageDefinition(configPackageDefinition);
const arborterProtoDescriptor = grpc.loadPackageDefinition(arborterPackageDefinition);

const configService = configProtoDescriptor.xyz.aspens.arborter_config.v1.ConfigService;
const arborterService = arborterProtoDescriptor.xyz.aspens.arborter.v1.ArborterService;

// Create gRPC clients
const configClient = new configService(
  GRPC_TARGET,
  grpc.credentials.createInsecure()
);

const arborterClient = new arborterService(
  GRPC_TARGET,
  grpc.credentials.createInsecure()
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    grpc_target: GRPC_TARGET
  });
});

// gRPC-Web proxy
app.use('/grpc', async (req, res) => {
  try {
    console.log(`Proxying gRPC-Web request: ${req.method} ${req.url}`);
    
    // Parse the service and method from the URL
    const urlParts = req.url.split('/');
    if (urlParts.length < 3) {
      return res.status(400).json({ error: 'Invalid gRPC service/method path' });
    }
    
    const serviceName = urlParts[1];
    const methodName = urlParts[2];
    
    console.log(`Service: ${serviceName}, Method: ${methodName}`);
    
    // Handle different services
    if (serviceName === 'xyz.aspens.arborter_config.v1.ConfigService') {
      // Set appropriate headers for gRPC-Web
      res.setHeader('Content-Type', 'application/grpc-web+proto');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Grpc-Web');
      
      if (methodName === 'GetVersion') {
        // Call the real GetVersion method
        configClient.getVersion({}, (err, response) => {
          if (err) {
            console.error('gRPC GetVersion error:', err);
            res.status(500).json({ error: err.message });
          } else {
            res.json(response);
          }
        });
      } else if (methodName === 'GetConfig') {
        // Call the real GetConfig method
        configClient.getConfig({}, (err, response) => {
          if (err) {
            console.error('gRPC GetConfig error:', err);
            res.status(500).json({ error: err.message });
          } else {
            res.json(response);
          }
        });
      } else {
        res.status(404).json({ error: `Method ${methodName} not found` });
      }
    } else if (serviceName === 'xyz.aspens.arborter.v1.ArborterService') {
      if (methodName === 'Orderbook') {
        // Handle streaming orderbook
        const request = req.body;
        console.log('Orderbook request:', request);
        
        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Grpc-Web');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        
        // Send initial connection message
        res.write('data: {"type": "connected", "message": "Orderbook stream connected"}\n\n');
        
        const stream = arborterClient.orderbook(request);
        
        // Handle stream events
        stream.on('data', (data) => {
          console.log('Orderbook data received:', data);
          const eventData = JSON.stringify(data);
          res.write(`data: ${eventData}\n\n`);
        });
        
        stream.on('error', (error) => {
          console.error('Orderbook stream error:', error);
          const errorData = JSON.stringify({ type: 'error', error: error.message });
          res.write(`data: ${errorData}\n\n`);
          res.end();
        });
        
        stream.on('end', () => {
          console.log('Orderbook stream ended');
          const endData = JSON.stringify({ type: 'end', message: 'Stream ended' });
          res.write(`data: ${endData}\n\n`);
          res.end();
        });
        
        // Handle client disconnect
        req.on('close', () => {
          console.log('Client disconnected from orderbook stream');
          stream.destroy();
        });
        
        req.on('error', (error) => {
          console.error('Request error:', error);
          stream.destroy();
        });
        
      } else if (methodName === 'Trades') {
        // Handle streaming trades
        const request = req.body;
        console.log('Trades request:', request);
        
        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Grpc-Web');
        res.setHeader('X-Accel-Buffering', 'no');
        
        // Send initial connection message
        res.write('data: {"type": "connected", "message": "Trades stream connected"}\n\n');
        
        const stream = arborterClient.trades(request);
        
        // Handle stream events
        stream.on('data', (data) => {
          console.log('Trades data received:', data);
          const eventData = JSON.stringify(data);
          res.write(`data: ${eventData}\n\n`);
        });
        
        stream.on('error', (error) => {
          console.error('Trades stream error:', error);
          const errorData = JSON.stringify({ type: 'error', error: error.message });
          res.write(`data: ${errorData}\n\n`);
          res.end();
        });
        
        stream.on('end', () => {
          console.log('Trades stream ended');
          const endData = JSON.stringify({ type: 'end', message: 'Stream ended' });
          res.write(`data: ${endData}\n\n`);
          res.end();
        });
        
        // Handle client disconnect
        req.on('close', () => {
          console.log('Client disconnected from trades stream');
          stream.destroy();
        });
        
        req.on('error', (error) => {
          console.error('Request error:', error);
          stream.destroy();
        });
        
      } else {
        // Handle other arborter service methods (non-streaming)
        res.setHeader('Content-Type', 'application/grpc-web+proto');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Grpc-Web');
        
        const request = req.body;
        console.log(`${methodName} request:`, request);
        
        arborterClient[methodName.toLowerCase()](request, (err, response) => {
          if (err) {
            console.error(`gRPC ${methodName} error:`, err);
            res.status(500).json({ error: err.message });
          } else {
            res.json(response);
          }
        });
      }
    } else {
      res.status(404).json({ error: `Service ${serviceName} not found` });
    }
    
  } catch (error) {
    console.error('gRPC-Web proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Serve static files (optional, for serving the frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`gRPC-Web proxy server running on port ${PORT}`);
  console.log(`Target gRPC service: ${GRPC_TARGET}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`gRPC-Web endpoint: http://localhost:${PORT}/grpc`);
}); 