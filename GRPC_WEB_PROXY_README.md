# gRPC-Web Proxy Setup for Arborter Service

This setup provides a gRPC-Web proxy that bridges your frontend application with the local arborter gRPC service running in Docker.

## Overview

The setup includes:
- **Envoy Proxy**: A production-ready gRPC-Web proxy (recommended)
- **Node.js Proxy**: A simple alternative proxy for development
- **Docker Compose**: Easy orchestration of all services

## Prerequisites

- Docker and Docker Compose installed
- Your arborter service running on `localhost:50051`
- Node.js (for the alternative proxy)

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup-grpc-proxy.sh
   ```

2. **Or manually start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify the proxy is running:**
   ```bash
   curl http://localhost:8080/health
   ```

## Configuration

### Environment Variables

- `GRPC_TARGET`: Target gRPC service (default: `localhost:50051`)
- `PORT`: Proxy port (default: `8080`)

### Frontend Configuration

Update your frontend to use the proxy URL:

```typescript
// In your environment variables or config
REACT_APP_GRPC_WEB_PROXY_URL=http://localhost:8080
```

## Available Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Envoy Proxy | `http://localhost:8080` | Main gRPC-Web proxy |
| Envoy Admin | `http://localhost:9901` | Envoy admin interface |
| Node.js Proxy | `http://localhost:8081` | Alternative proxy |
| Health Check | `http://localhost:8080/health` | Health status |

## Architecture

```
Frontend (React) 
    ↓ (gRPC-Web)
Envoy Proxy (port 8080)
    ↓ (gRPC)
Arborter Service (port 50051)
```

## Services

### Envoy Proxy (Recommended)

The Envoy proxy is configured in `envoy.yaml` and provides:
- Full gRPC-Web protocol support
- Streaming support
- CORS handling
- Production-ready performance

### Node.js Proxy (Alternative)

A simple Express.js proxy for development:
- Basic gRPC-Web support
- Easy to customize
- Good for development and testing

## Troubleshooting

### Common Issues

1. **Connection refused to arborter service**
   - Ensure your arborter service is running on port 50051
   - Check Docker container status: `docker-compose ps`

2. **CORS errors**
   - The proxy includes CORS headers
   - Check that your frontend URL is in the allowed origins

3. **gRPC-Web protocol errors**
   - Ensure you're using the correct gRPC-Web client
   - Check that the proxy URL is correct in your frontend

### Debugging

1. **View logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Check Envoy admin:**
   - Visit `http://localhost:9901`
   - Check cluster health and statistics

3. **Test connection:**
   ```bash
   curl -X POST http://localhost:8080/grpc \
     -H "Content-Type: application/grpc-web+proto" \
     -d '{"test": "data"}'
   ```

## Development

### Modifying the Proxy

1. **Envoy configuration**: Edit `envoy.yaml`
2. **Node.js proxy**: Edit `grpc-web-proxy.js`
3. **Docker setup**: Edit `docker-compose.yml`

### Adding New Services

To add new gRPC services:

1. Update `envoy.yaml` with new clusters
2. Add new routes in the virtual hosts section
3. Update the Docker Compose file if needed

## Production Deployment

For production:

1. **Use Envoy proxy** (not the Node.js alternative)
2. **Configure proper TLS/SSL**
3. **Set up monitoring and logging**
4. **Use environment-specific configurations**

## Files Overview

| File | Purpose |
|------|---------|
| `envoy.yaml` | Envoy proxy configuration |
| `grpc-web-proxy.js` | Node.js proxy implementation |
| `docker-compose.yml` | Service orchestration |
| `proxy-package.json` | Node.js proxy dependencies |
| `setup-grpc-proxy.sh` | Setup automation script |
| `src/lib/grpc-client.ts` | Frontend gRPC client |

## Next Steps

1. **Test the connection** using the provided hooks
2. **Implement error handling** in your frontend
3. **Add authentication** if required
4. **Set up monitoring** for production use

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify your arborter service is running
3. Test the health endpoint: `curl http://localhost:8080/health`
4. Check the Envoy admin interface: `http://localhost:9901` 