# TradeGlance Backend Server

This is the backend server for TradeGlance UI that handles gRPC interactions with the Arborter service. It provides REST APIs to the frontend, eliminating the need for gRPC-Web and CommonJS compatibility issues.

## Architecture

```
Frontend (Vite + React) 
    ↓ (REST API calls)
Backend Server (Express + gRPC-Web client)
    ↓ (gRPC-Web calls via Envoy)
Envoy Proxy
    ↓ (gRPC calls)
Arborter Service
```

## Features

- **REST API endpoints** for all Arborter service methods
- **Server-Sent Events (SSE)** for streaming orderbook and trades data
- **CommonJS compatibility** for gRPC libraries
- **CORS support** for frontend integration
- **Error handling** and logging
- **Health check endpoint**

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Copy proto files:
```bash
cp ../proxy-server/proto/*.proto proto/
```

3. Set environment variables (create `.env` file):
```env
PORT=3001
ENVOY_PROXY_URL=http://localhost:8811
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Config Service
- `GET /api/config` - Get configuration
- `GET /api/config/version` - Get version

### Arborter Service
- `POST /api/arborter/send-order` - Send an order
- `POST /api/arborter/cancel-order` - Cancel an order
- `POST /api/arborter/add-orderbook` - Add orderbook
- `POST /api/arborter/remove-orderbook` - Remove orderbook
- `POST /api/arborter/unnormalize-decimals` - Unnormalize decimals

### Streaming Endpoints
- `POST /api/arborter/orderbook-stream` - Stream orderbook data (SSE)
- `POST /api/arborter/trades-stream` - Stream trades data (SSE)

### Health Check
- `GET /health` - Server health status

## Frontend Integration

Update your frontend environment variables:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

The frontend should now use the new `api-client.ts` instead of `grpc-client.ts`.

## Benefits

1. **No CommonJS issues** - Backend handles all gRPC interactions
2. **Simpler frontend** - No need for gRPC-Web libraries
3. **Better error handling** - Centralized error handling on backend
4. **Easier debugging** - Clear separation of concerns
5. **Scalability** - Backend can be scaled independently 