#!/bin/bash

echo "🚀 Starting MCP AWS re:Invent Demo with AWS Bedrock LLM Integration"
echo ""

# Check AWS configuration
if command -v aws &> /dev/null; then
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ AWS CLI configured and credentials valid"
    else
        echo "⚠️  AWS CLI found but credentials not configured"
        echo "   Please run: aws configure"
        echo "   Or set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
        exit 1
    fi
else
    echo "⚠️  AWS CLI not found. Checking environment variables..."
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        echo "❌ No AWS credentials found"
        echo "   Option 1: Install AWS CLI and run 'aws configure'"
        echo "   Option 2: Set environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
        echo "   Option 3: Create .env file with credentials"
        exit 1
    else
        echo "✅ AWS credentials found in environment variables"
    fi
fi

# Create .env file if it doesn't exist (for region setting)
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if uvx is available for remote MCP servers
if ! command -v uvx &> /dev/null; then
    echo "⚠️  uvx not found. AWS Documentation MCP server will use fallback data."
    echo "   To install uvx: curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "   Or via pip: pip install uv"
else
    echo "✅ uvx found - remote MCP servers available"
fi

echo "🔧 Starting backend server with LLM agent..."
npm run start:backend &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🎨 Starting frontend..."
npm run start:frontend &
FRONTEND_PID=$!

echo ""
echo "🎉 Demo is starting!"
echo "📊 Backend (LLM + MCP): http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait