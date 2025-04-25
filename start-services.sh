#!/bin/bash

echo "Starting MadeME Food Delivery System..."

echo
echo "Option 1: Run with Docker Compose (recommended)"
echo "Option 2: Run services individually with npm"
echo

read -p "Enter your choice (1 or 2): " CHOICE

if [ "$CHOICE" = "1" ]; then
    echo "Starting all services with Docker Compose..."
    docker-compose up
elif [ "$CHOICE" = "2" ]; then
    # Start MongoDB if not already running
    echo "Starting MongoDB..."
    mongod --fork --logpath /tmp/mongod.log || echo "MongoDB might already be running"
    
    # Start Backend Services with proper environment variables
    echo "Starting Order Service..."
    cd order-service && NODE_ENV=development BYPASS_AUTH=true PORT=5001 npm start &
    cd ..
    
    echo "Starting Payment Service..."
    cd payment-service && NODE_ENV=development BYPASS_AUTH=true PORT=5003 npm start &
    cd ..
    
    echo "Starting Cart Service..."
    cd cart-service && NODE_ENV=development BYPASS_AUTH=true PORT=5002 npm start &
    cd ..
    
    echo "Starting User Service..."
    cd user-service && NODE_ENV=development PORT=5004 npm start &
    cd ..
    
    echo "Starting Restaurant Service..."
    cd restaurant-service && NODE_ENV=development PORT=5005 npm start &
    cd ..
    
    # Start Frontend
    echo "Starting Frontend..."
    cd frontend && npm run dev &
    cd ..
    
    echo "All services started successfully!"
    echo "Frontend: http://localhost:5173"
    echo "Order Service: http://localhost:5001"
    echo "Payment Service: http://localhost:5003"
    echo "Cart Service: http://localhost:5002"
    echo "User Service: http://localhost:5004"
    echo "Restaurant Service: http://localhost:5005"
    
    echo "Press Ctrl+C to stop all services"
    wait
else
    echo "Invalid choice. Please run the script again and enter 1 or 2."
    exit 1
fi