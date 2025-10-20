#!/bin/bash

echo "🚀 Starting Chirp Application Setup..."
echo "======================================"

# Check if node_modules exist, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Check server dependencies
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

# Check scripts dependencies
if [ ! -d "scripts/node_modules" ]; then
    echo "📦 Installing scripts dependencies..."
    cd scripts && npm install && cd ..
fi

# Ask if we should seed the database
echo ""
echo "🌱 Do you want to seed the database with enhanced 18-level structure? (y/n)"
read -r SEED_CHOICE

if [ "$SEED_CHOICE" = "y" ] || [ "$SEED_CHOICE" = "Y" ]; then
    echo "🌱 Seeding database with enhanced levels..."
    node scripts/seedEnhanced.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully!"
    else
        echo "❌ Database seeding failed. Check the error above."
        exit 1
    fi
fi

# Start the backend server
echo ""
echo "🖥️  Starting backend server on port 3001..."
cd server && npm run dev &
SERVER_PID=$!
cd ..

# Give the backend a moment to start
sleep 3

# Start the frontend
echo "🎨 Starting frontend on port 5173..."
echo ""
echo "======================================"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run frontend (this will block)
npm run dev

# When frontend is stopped, also stop the backend
kill $SERVER_PID 2>/dev/null
echo "👋 All services stopped"