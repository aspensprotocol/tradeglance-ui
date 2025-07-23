#!/bin/bash

echo "Setting up TradeGlance Backend Server..."

# Create backend directory if it doesn't exist
if [ ! -d "backend" ]; then
    echo "Backend directory not found. Please run this script from the project root."
    exit 1
fi

# Navigate to backend directory
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
PORT=3001
ENVOY_PROXY_URL=http://localhost:8811
EOF
    echo "Created .env file with default settings"
else
    echo ".env file already exists"
fi

# Copy proto files if they don't exist
if [ ! -d "proto" ]; then
    echo "Creating proto directory..."
    mkdir -p proto
fi

if [ ! -f "proto/arborter_config.proto" ] || [ ! -f "proto/arborter.proto" ]; then
    echo "Copying proto files..."
    cp ../proxy-server/proto/*.proto proto/
    echo "Proto files copied"
else
    echo "Proto files already exist"
fi

echo ""
echo "Backend setup complete!"
echo ""
echo "To start the backend server:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "The server will be available at: http://localhost:3001"
echo "API endpoints will be at: http://localhost:3001/api"
echo ""
echo "Don't forget to update your frontend .env file with:"
echo "  VITE_API_BASE_URL=http://localhost:3001/api" 