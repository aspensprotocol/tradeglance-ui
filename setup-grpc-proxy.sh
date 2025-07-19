#!/bin/bash

echo "Setting up gRPC-Web proxy for arborter service..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "Installing proxy dependencies..."
cd "$(dirname "$0")"

# Install proxy dependencies
if [ -f "proxy-package.json" ]; then
    echo "Installing Node.js proxy dependencies..."
    npm install --prefix . --package-lock-only
    npm ci --prefix . || npm install --prefix .
fi

echo "Starting gRPC-Web proxy with Docker Compose..."
echo "This will start:"
echo "  - Envoy proxy on port 8080 (gRPC-Web)"
echo "  - Envoy admin interface on port 9901"
echo "  - Node.js proxy on port 8081 (alternative)"

# Start the services
docker-compose up -d

echo ""
echo "gRPC-Web proxy setup complete!"
echo ""
echo "Available endpoints:"
echo "  - gRPC-Web proxy: http://localhost:8080"
echo "  - Envoy admin: http://localhost:9901"
echo "  - Node.js proxy: http://localhost:8081"
echo "  - Health check: http://localhost:8080/health"
echo ""
echo "To stop the services:"
echo "  docker-compose down"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "Make sure your arborter service is running on localhost:50051"
echo "Update your frontend to use the proxy URL: http://localhost:8080" 