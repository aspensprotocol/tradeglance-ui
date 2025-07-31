# 🚀 TradeGlance UI Documentation

## 📋 Overview

TradeGlance UI is a modern, real-time trading interface built with React, TypeScript, and Vite. It provides a comprehensive trading experience with order book visualization, real-time trade execution, and multi-chain support.

## 📝 How to Write Documentation

### Quick Start
1. **Create a new doc**: `./docs/create-doc.sh my-topic "My Topic Title"`
2. **Edit the file**: `docs/my-topic.md`
3. **View online**: Navigate to `/docs` in the app

### Documentation System
- **Location**: All docs go in the `docs/` directory
- **Format**: Markdown with emojis and proper headers
- **Template**: Use `docs/template.md` as a starting point
- **Script**: Use `docs/create-doc.sh` to create new docs

### Writing Guidelines
- Use emojis for section headers (🚀, 📋, 🏗️, etc.)
- Follow the markdown structure from the template
- Include code examples where helpful
- Keep content clear and concise
- Update the "Last updated" date

## 🏗️ Architecture

### Core Technologies
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Connect-Web** for gRPC communication
- **Wagmi** for Web3 integration
- **Viem** for blockchain interactions
- **MetaMask** for wallet connectivity

### Key Features
- 🔄 Real-time order book updates
- 📊 Live trading activity monitoring
- 💰 Multi-chain balance management
- 🎯 Limit and market order support
- 🔐 Secure transaction signing
- 📱 Responsive design

## 🗂️ Project Structure

```
tradeglance-ui/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   └── main.tsx           # Application entry point
├── docs/                   # Documentation
│   ├── README.md          # This file
│   ├── template.md        # Documentation template
│   └── create-doc.sh     # Script to create new docs
└── public/                # Static assets
```

## 🔧 Core Components

### 📊 Trading Interface (`src/pages/Index.tsx`)
The main trading interface with three panels:
- **Activity Panel**: Recent trades, open orders, and balances
- **Order Book**: Real-time bid/ask visualization
- **Trade Form**: Order placement interface

### 💼 Trade Form (`src/components/TradeForm.tsx`)
Advanced trading component with:
- Limit and market order types
- Buy/sell side switching with network auto-switching
- Percentage-based amount selection
- Real-time balance validation
- MetaMask transaction signing

### 📈 Order Book (`src/components/VerticalOrderBook.tsx`)
Real-time order book display with:
- Bid/ask price visualization
- Spread calculation
- Trading pair selection
- Responsive design

### 📋 Activity Panel (`src/components/ActivityPanel.tsx`)
Multi-tab activity monitoring:
- Recent trades with filtering
- Open orders management
- Balance overview
- Deposit/withdraw functionality

## 🔌 Data Management

### 📡 gRPC Communication (`src/lib/grpc-client.ts`)
Custom gRPC-Web client using Connect-Web:
- Real-time order book streaming
- Trade execution
- Configuration management
- Protobuf message handling

### 🎣 Custom Hooks

#### `useOrderbook` (`src/hooks/useOrderbook.ts`)
Manages real-time order book data:
- Fetches order book snapshots
- Processes bid/ask data
- Calculates spreads
- Handles data formatting

#### `useDataFetching` (`src/hooks/useDataFetching.ts`)
Generic data fetching hook with:
- Optimized polling
- Debounced updates
- Error handling
- Performance monitoring

#### `useTradingPairs` (`src/hooks/useTradingPairs.ts`)
Trading pair management:
- Dynamic pair loading from config
- Market ID resolution
- Chain configuration mapping

## 🔐 Security & Signing

### Transaction Signing (`src/lib/signing-utils.ts`)
Secure order signing with MetaMask:
- Protobuf message encoding
- EIP-191 signature compatibility
- Multi-chain support
- Error handling

### Configuration Management (`src/lib/config-utils.ts`)
Dynamic configuration system:
- Chain configuration
- Market definitions
- Token metadata
- Network switching

## 🌐 Web3 Integration

### Wallet Connectivity
- MetaMask integration via Wagmi
- Multi-chain support
- Automatic network switching
- Balance monitoring

### Smart Contract Interaction
- Viem for contract calls
- ABI management
- Transaction monitoring
- Gas estimation

## 🎨 UI/UX Design

### Design System
- **Shadcn/ui** components
- **Tailwind CSS** for styling
- **Radix UI** primitives
- **Lucide React** icons

### Color Scheme
- Dark theme optimized
- High contrast for trading data
- Semantic colors (green/red for buy/sell)
- Accessible design

## 🔄 Real-time Features

### Data Streaming
- WebSocket-like gRPC streaming
- Optimized polling intervals
- Debounced updates
- Performance monitoring

### State Management
- React Query for server state
- Local state with hooks
- Optimistic updates
- Error boundaries

## 🚀 Performance Optimizations

### Data Fetching
- Intelligent polling
- Request deduplication
- Cache management
- Background updates

### UI Performance
- Virtual scrolling for large datasets
- Memoized components
- Optimized re-renders
- Lazy loading

## 🔧 Development

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Key Dependencies
- `@connectrpc/connect-web`: gRPC-Web client
- `@tanstack/react-query`: Server state management
- `wagmi`: Web3 hooks
- `viem`: Ethereum interactions
- `tailwindcss`: Styling framework

## 📝 Configuration

### Environment Variables
- `VITE_GRPC_WEB_PROXY_URL`: gRPC-Web proxy endpoint
- Chain-specific RPC URLs
- Contract addresses

### Network Configuration
- Multi-chain support
- Dynamic chain switching
- Network validation
- RPC endpoint management

## 🧪 Testing

### Component Testing
- React Testing Library
- Jest for unit tests
- Integration testing
- E2E testing with Playwright

### Performance Testing
- Lighthouse audits
- Bundle analysis
- Memory profiling
- Network optimization

## 🚀 Deployment

### Build Process
- Vite for fast builds
- TypeScript compilation
- Asset optimization
- Environment configuration

### Hosting
- Static file hosting
- CDN integration
- SSL configuration
- Performance monitoring

## 🔮 Future Enhancements

### Planned Features
- Advanced order types
- Portfolio management
- Chart integration
- Mobile optimization
- Multi-language support

### Technical Improvements
- Service worker caching
- WebAssembly integration
- Advanced analytics
- Machine learning integration

## 📚 API Reference

### gRPC Services
- `ArborterService`: Trading operations
- `ConfigService`: Configuration management
- Streaming endpoints for real-time data

### Web3 Methods
- `sendOrder`: Submit trading orders
- `cancelOrder`: Cancel existing orders
- `getOrderbook`: Fetch order book data
- `getTrades`: Retrieve trade history

## 🤝 Contributing

### Development Guidelines
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### Code Standards
- Functional components
- Custom hooks for logic
- Proper error handling
- Performance optimization

## 📄 License

This project is proprietary software. All rights reserved.

---

*Last updated: December 2024* 