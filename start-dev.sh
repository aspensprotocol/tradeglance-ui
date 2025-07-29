#!/bin/bash

# Start Envoy in the background
echo "Starting Envoy proxy..."
# Stop and remove existing container if it exists
docker stop envoy-grpc-web 2>/dev/null
docker rm envoy-grpc-web 2>/dev/null

docker run -d --name envoy-grpc-web \
  -v "$(pwd)/envoy.yaml:/etc/envoy/envoy.yaml:ro" \
  -p 8811:8811 \
  envoyproxy/envoy:distroless-v1.34-latest

# Start the frontend development server
echo "Starting frontend development server..."
npm run dev

# When the frontend server is stopped, also stop the proxy server
echo "Stopping services..."

# Stop and remove the Envoy container
docker stop envoy-grpc-web 2>/dev/null
docker rm envoy-grpc-web 2>/dev/null

echo "All services stopped."
