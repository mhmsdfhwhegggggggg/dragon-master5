#!/bin/bash

echo "🚀 Starting Redis for Dragon Telegram Pro..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not installed"
    echo "Please install Docker Desktop first"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ ERROR: Docker is not running"
    echo "Please start Docker Desktop first"
    exit 1
fi

# Start Redis container
echo "📦 Starting Redis container on port 6379..."
docker run -d --name dragon-redis -p 6379:6379 redis:7-alpine

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to start Redis container"
    exit 1
fi

echo "✅ Redis is now running on port 6379"
echo "🔗 Connection URL: redis://localhost:6379"
echo ""
echo "🎯 Next steps:"
echo "1. Add to your .env file: REDIS_URL=redis://localhost:6379"
echo "2. Start the Dragon Telegram Pro server: npm run dev:server"
echo ""
echo "🚀 Dragon Telegram Pro is ready!"
