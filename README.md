# TradeGlance UI

A frontend application for the TradeGlance trading platform using gRPC-Web with Envoy proxy.

## Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Docker (for running Envoy proxy)

## Quick Start

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Install proxy server dependencies
cd proxy-server && npm install && cd ..

# Step 5: Start everything with the provided script
./start-dev.sh
```

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Architecture

This project uses Envoy proxy for gRPC-Web support, allowing the frontend to communicate directly with the gRPC backend.

```
Frontend (Vite + React)
    ↓ (gRPC-Web calls)
Envoy Proxy (port 8811)
    ↓ (gRPC calls)
Arborter Service (port 50051)

    Alternative for non-gRPC calls:
Frontend (Vite + React)
    ↓ (REST API calls)
Proxy Server (port 8083)
    ↓ (gRPC calls)
Arborter Service (port 50051)
```

## Setup

### Using the Start Script (Recommended)

The easiest way to run the application:

```sh
# Make the script executable (first time only)
chmod +x start-dev.sh

# Start everything
./start-dev.sh
```

This script will:
1. Start Envoy proxy in a Docker container (port 8811)
2. Start the proxy server (port 8083)
3. Start the frontend development server (port 8080)

### Manual Setup

If you prefer to start components manually:

#### 1. Start Envoy Proxy
```sh
docker run -d --name envoy-grpc-web \
  -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  -p 8811:8811 \
  --network host \
  envoyproxy/envoy:v1.28-latest
```

#### 2. Start Proxy Server
```sh
cd proxy-server
npm install
npm start
```

#### 3. Start Frontend
```sh
# In a new terminal
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# gRPC-Web Configuration (points to Envoy proxy)
VITE_GRPC_WEB_PROXY_URL=http://localhost:8811

# API Configuration (points to proxy server)
VITE_API_BASE_URL=http://localhost:8083/api

# Other configuration variables...
```

### Proxy Server Environment
The proxy server uses these environment variables:

```env
PORT=8083
GRPC_TARGET=localhost:50051
```

## Troubleshooting

### Connection Issues

1. **Check Envoy is running:**
   ```sh
   docker ps | grep envoy
   ```

2. **Check proxy server is running:**
   ```sh
   lsof -i :8083
   ```

3. **Check Envoy logs:**
   ```sh
   docker logs envoy-grpc-web
   ```

4. **Verify gRPC backend is accessible:**
   ```sh
   telnet localhost 50051
   ```

### CORS Issues

If you encounter CORS issues, check:
- Envoy configuration in `envoy.yaml`
- Proxy server CORS settings in `proxy-server/server.cjs`

### Clean Restart

To completely restart all services:

```sh
# Stop and remove Envoy container
docker stop envoy-grpc-web
docker rm envoy-grpc-web

# Kill any running proxy servers
pkill -f "node server.cjs"

# Restart everything
./start-dev.sh
```
