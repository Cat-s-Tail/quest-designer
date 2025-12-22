#!/bin/bash

# Quest Designer MongoDB Setup Script

echo "🚀 Setting up Quest Designer with MongoDB..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env with your MongoDB connection string"
else
    echo "✅ .env file already exists"
fi

# Check if frontend/.env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local file..."
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local file"
else
    echo "✅ frontend/.env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your MongoDB connection string (if not using default)"
echo "2. Start MongoDB (if running locally): brew services start mongodb-community"
echo "3. Start the backend: cd backend && pnpm dev"
echo "4. Start the frontend: cd frontend && pnpm dev"
echo "5. Upload your JSON data via the web interface at http://localhost:3000"
echo ""

