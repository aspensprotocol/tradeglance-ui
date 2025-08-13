#!/bin/bash

# TradeGlance Deployment Script
set -e

echo "🚀 Starting TradeGlance deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t tradeglance-ui:latest .

# Stop and remove existing container if it exists
echo "🛑 Stopping existing container..."
docker-compose down || true

# Start the new container
echo "▶️  Starting new container..."
docker-compose up -d

# Wait for the container to be healthy
echo "⏳ Waiting for container to be healthy..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✅ Container is healthy!"
        break
    fi
    echo "⏳ Waiting for health check... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -eq $timeout ]; then
    echo "⚠️  Container health check timed out. Checking logs..."
    docker-compose logs
    exit 1
fi

# Show container status
echo "📊 Container status:"
docker-compose ps

echo "🎉 Deployment completed successfully!"
echo "🌐 Application is available at: http://localhost"
echo "🔍 Health check endpoint: http://localhost/health" 
