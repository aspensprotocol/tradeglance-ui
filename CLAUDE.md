# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server on localhost:8080
- `./start-dev.sh` - Start development with Envoy proxy (for backend connection)

**Build & Deploy:**
- `npm run build` - Production build
- `npm run build:dev` - Development mode build
- `npm run preview` - Preview production build locally

**Code Quality:**
- `npm run lint` - Run ESLint

**Environment Setup:**
- Copy `env.example` to `.env.local` and configure `VITE_GRPC_WEB_PROXY_URL`

## Architecture

### Core Stack
- **React 18** with TypeScript and Vite
- **Routing**: React Router DOM with pages in `src/pages/`
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Web3**: Wagmi + Web3Modal for wallet connections

### Backend Communication
- **gRPC-Web**: Uses Connect-Web (@connectrpc/connect-web) for type-safe gRPC communication
- **Envoy Proxy**: Docker-based proxy converts gRPC-Web to gRPC (port 8811)
- **Services**: Two main services defined in `src/protos/`:
  - `ArborterService` - Trading operations (orders, orderbook, trades)
  - `ConfigService` - Configuration management (chains, markets, tokens)

### Key Directories
- `src/lib/grpc-client.ts` - Main gRPC client with all service functions
- `src/hooks/` - Custom React hooks for data fetching and trading logic
- `src/components/ui/` - shadcn/ui component library
- `src/protos/gen/` - Generated TypeScript files from protobuf definitions

### Data Flow
1. Backend gRPC service runs on port 50051
2. Envoy proxy (port 8811) converts gRPC-Web ↔ gRPC  
3. Frontend connects via `VITE_GRPC_WEB_PROXY_URL`
4. TanStack Query handles caching and reactivity
5. Custom hooks provide trading-specific logic

### Trading Features
- **Orderbook**: Real-time order data with snapshot/streaming support
- **Trading**: Place/cancel orders with Web3 signature verification
- **Balances**: Multi-chain token balance tracking
- **Markets**: Dynamic trading pair configuration

### Web3 Integration
- **Chains**: Supports mainnet, sepolia, polygon, base, baseSepolia + dynamic chains
- **Wallets**: MetaMask, WalletConnect, Coinbase Wallet
- **Contracts**: MidribV2 ABI in `src/lib/abi/`

### Configuration
- **TypeScript**: Path aliases `@/` for src/, loose type checking enabled
- **Vite**: SWC React plugin, git commit hash injection
- **ESLint**: React hooks + refresh rules, unused vars disabled
- **Docker**: Nginx-based production deployment

### Error Handling
- Fallback mode when backend unavailable
- Stream timeout handling (10s) with partial data return
- Graceful degradation for missing gRPC services

### Development Workflow
Use `./start-dev.sh` for full stack development (starts both Envoy proxy and frontend). For frontend-only development, use `npm run dev` with appropriate backend URL configuration.