# TradeGlance UI

A modern React-based frontend application for the TradeGlance trading platform, built with TypeScript, Vite, and gRPC-Web communication via Envoy proxy.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for containerized deployment)

### Development Setup

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd tradeglance-ui
npm install
```

2. **Environment Configuration:**
   - Copy `env.example` to `.env.local`
   - Set `VITE_GRPC_WEB_PROXY_URL` to point to your backend service
   - Example: `VITE_GRPC_WEB_PROXY_URL=http://localhost:8811`

3. **Start Development Server:**
```bash
npm run dev
```

### Backend Connection

The frontend requires a backend gRPC service to function fully. If you encounter "unsupported content type application/grpc" errors:

**Option 1: Start Backend Service**
- Ensure your `arborter` backend service is running
- Start Envoy proxy: `./start-dev.sh`
- The frontend will automatically connect

**Option 2: Use Fallback Mode**
- If no backend is available, the frontend will use fallback configuration
- You'll see a warning message but the app will still function
- Set `VITE_GRPC_WEB_PROXY_URL` to an empty value or non-existent URL

**Option 3: Point to External Backend**
- Update `VITE_GRPC_WEB_PROXY_URL` to point to your deployed backend
- Ensure CORS is properly configured on the backend

### Production Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Docker deployment:**
```bash
docker build -t tradeglance:latest .
docker run -p 80:80 tradeglance:latest
```

## 🛠️ Troubleshooting

### Common Issues

**"unsupported content type application/grpc" Error**
- **Cause**: Frontend can't connect to backend gRPC service
- **Solution**: 
  - Start your backend service
  - Check `VITE_GRPC_WEB_PROXY_URL` environment variable
  - Ensure Envoy proxy is running if using local development

**Frontend Shows "Backend not available" Warning**
- **Cause**: Backend service is not running or unreachable
- **Solution**: 
  - Start your backend service
  - Check network connectivity
  - Verify proxy configuration

**Build Fails with Import Errors**
- **Cause**: Missing dependencies or incorrect imports
- **Solution**: 
  - Run `npm install` to ensure all dependencies are installed
  - Check that all import paths are correct
  - Verify protobuf files are properly generated

## 📚 Additional Resources

- [Aspens Documentation](https://docs.aspens.xyz)
- [Connect-Web Documentation](https://connectrpc.com/docs/web/)
- [Vite Configuration](https://vitejs.dev/config/)
