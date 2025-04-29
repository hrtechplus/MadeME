@echo off
echo Starting MadeME[SLIIT] Food...

echo.
echo Option 1: Run with Docker Compose (recommended)
echo Option 2: Run services individually with npm
echo.
SET /P CHOICE="Enter your choice (1 or 2): "

IF "%CHOICE%"=="1" (
    echo Starting all services with Docker Compose...
    docker-compose up
) ELSE IF "%CHOICE%"=="2" (
    REM Start MongoDB if not already running
    echo Starting MongoDB...
    start /b mongod || echo MongoDB might already be running
    
    REM Start Backend Services with proper environment variables
    echo Starting Order Service...
    start cmd /k "cd order-service && set NODE_ENV=development&& set BYPASS_AUTH=true&& set PORT=5001&& npm run dev"
    
    echo Starting Payment Service...
    start cmd /k "cd payment-service && set NODE_ENV=development&& set BYPASS_AUTH=true&& set PORT=5003&& npm run dev"
    
    echo Starting Cart Service...
    start cmd /k "cd cart-service && set NODE_ENV=development&& set BYPASS_AUTH=true&& set PORT=5002&& npm run dev"
    
    echo Starting User Service...
    start cmd /k "cd user-service && set NODE_ENV=development&& set PORT=5004&& npm run dev"
    
    echo Starting Restaurant Service...
    start cmd /k "cd restaurant-service && set NODE_ENV=development&& set PORT=5005&& npm run dev"
    
    REM Start Frontend
    echo Starting Frontend...
    start cmd /k "cd frontend && npm run dev"
    
    echo All services started successfully!
    echo Frontend: http://localhost:5173
    echo Order Service: http://localhost:5001
    echo Payment Service: http://localhost:5003
    echo Cart Service: http://localhost:5002
    echo User Service: http://localhost:5004
    echo Restaurant Service: http://localhost:5005
) ELSE (
    echo Invalid choice. Please run the script again and enter 1 or 2.
    exit /b 1
)