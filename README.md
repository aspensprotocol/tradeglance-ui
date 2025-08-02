# TradeGlance UI

A modern React-based frontend application for the TradeGlance trading platform, built with TypeScript, Vite, and gRPC-Web communication via Envoy proxy.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Docker** - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd tradeglance-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   cp env.example .env
   ```
   Edit `.env` if you need to customize the gRPC proxy URL.

4. **Start the application**
   ```bash
   ./start-dev.sh
   ```

5. **Access the application**
   - Open your browser and navigate to: **http://localhost:8080**
   - The application will be available on your local network at: **http://192.168.50.253:8080**

## 🏗️ Architecture

This project uses a modern microservices architecture with gRPC-Web communication:

```
┌─────────────────┐    gRPC-Web    ┌──────────────┐    gRPC     ┌─────────────────┐
│   Frontend      │ ──────────────► │   Envoy      │ ──────────► │   Backend       │
│   (React/Vite)  │                 │   Proxy      │             │   Service       │
│   Port 8080     │                 │   Port 8811  │             │   Port 50051    │
└─────────────────┘                 └──────────────┘             └─────────────────┘
```

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **gRPC Communication**: Connect-Web library
- **Web3 Integration**: Viem + Wagmi + Web3Modal
- **Proxy**: Envoy (Docker container)
- **Package Manager**: npm

## 📁 Project Structure

```
tradeglance-ui/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── TradeForm.tsx   # Pro trading interface
│   │   ├── WalletButton.tsx # Web3 wallet integration
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   │   ├── grpc-client.ts  # gRPC communication
│   │   ├── config.ts       # Environment configuration
│   │   └── ...
│   └── pages/              # Page components
├── envoy.yaml              # Envoy proxy configuration
├── start-dev.sh            # Development startup script
└── package.json            # Dependencies and scripts
```

## 🔧 Development

### Using the Start Script (Recommended)

The `start-dev.sh` script automates the entire startup process:

```bash
./start-dev.sh
```

This script will:
1. Stop and remove any existing Envoy containers
2. Start Envoy proxy in a Docker container (port 8811)
3. Start the Vite development server (port 8080)
4. Clean up containers when you stop the script

### Manual Setup

If you prefer to start components manually:

#### 1. Start Envoy Proxy
```bash
# Stop any existing containers
docker stop envoy-grpc-web 2>/dev/null
docker rm envoy-grpc-web 2>/dev/null

# Start Envoy
docker run -d --name envoy-grpc-web \
  -v "$(pwd)/envoy.yaml:/etc/envoy/envoy.yaml:ro" \
  -p 8811:8811 \
  envoyproxy/envoy:distroless-v1.34-latest
```

#### 2. Start Frontend (in a new terminal)
```bash
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# gRPC-Web Proxy Configuration
VITE_GRPC_WEB_PROXY_URL=http://localhost:8811

# Blockchain Configuration (optional)
VITE_MIDRIB_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_FLARE_RPC_URL=https://flare-api.flare.network/ext/C/rpc
```

### Envoy Configuration

The `envoy.yaml` file configures the proxy to:
- Route gRPC-Web requests from the frontend to the backend
- Handle CORS for cross-origin requests
- Support multiple gRPC services (ConfigService, ArborterService)

## 🔍 Troubleshooting

### Common Issues

#### 1. Envoy Container Won't Start
```bash
# Check if Docker is running
docker --version

# Check Envoy logs
docker logs envoy-grpc-web

# Restart Envoy manually
docker stop envoy-grpc-web
docker rm envoy-grpc-web
docker run -d --name envoy-grpc-web \
  -v "$(pwd)/envoy.yaml:/etc/envoy/envoy.yaml:ro" \
  -p 8811:8811 \
  envoyproxy/envoy:distroless-v1.34-latest
```

#### 2. Frontend Can't Connect to Backend
```bash
# Check if Envoy is running
docker ps | grep envoy

# Check if backend service is accessible
telnet localhost 50051

# Check Envoy logs for routing issues
docker logs envoy-grpc-web
```

#### 3. Port Already in Use
```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 8811
lsof -i :8811

# Kill processes if needed
kill -9 <PID>
```

#### 4. CORS Issues
- Verify Envoy configuration in `envoy.yaml`
- Check browser console for CORS errors
- Ensure backend service is running on port 50051

### Clean Restart

To completely restart all services:

```bash
# Stop all containers
docker stop $(docker ps -q)

# Remove Envoy container
docker rm envoy-grpc-web

# Kill any running Node processes
pkill -f "vite"

# Restart everything
./start-dev.sh
```

### Debug Mode

To run with verbose logging:

```bash
# Check Envoy logs in real-time
docker logs -f envoy-grpc-web

# Run frontend with debug logging
DEBUG=vite:* npm run dev
```

## 🐳 Docker Deployment

### Quick Deployment

Use the automated deployment script:

```bash
./deploy.sh
```

This script will:
1. Build the Docker image
2. Stop any existing containers
3. Start the new container
4. Wait for health checks to pass
5. Display deployment status

### Manual Deployment

#### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

#### Using Docker directly

```bash
# Build the image
docker build -t tradeglance-ui .

# Run the container
docker run -d -p 80:80 --name tradeglance-ui tradeglance-ui

# View logs
docker logs -f tradeglance-ui

# Stop and remove container
docker stop tradeglance-ui
docker rm tradeglance-ui
```

### Production Deployment

For production environments, consider:

1. **Environment Variables**: Set production environment variables
2. **SSL/TLS**: Use a reverse proxy (nginx, traefik) with SSL certificates
3. **Monitoring**: Set up health checks and monitoring
4. **Logging**: Configure log aggregation
5. **Backup**: Set up regular backups of any persistent data

### Health Checks

The application includes health check endpoints:
- **Health Check**: http://localhost/health
- **Main Application**: http://localhost

## 🌐 Network Access

The application is accessible on:
- **Local**: http://localhost:8080 (development)
- **Network**: http://192.168.50.253:8080 (development)
- **Production**: http://localhost (Docker deployment)

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Connect-Web Documentation](https://connectrpc.com/docs/web/)
- [Envoy Proxy Documentation](https://www.envoyproxy.io/docs/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]
