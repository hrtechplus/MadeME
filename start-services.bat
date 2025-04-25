@echo off
echo Starting MadeME Food Delivery System...

REM Start MongoDB if not already running
echo Starting MongoDB...
start /b mongod || echo MongoDB might already be running

REM Start Backend Services with proper environment variables
echo Starting Order Service...
start cmd /k "cd order-service && set NODE_ENV=development&& set BYPASS_AUTH=true&& npm start"

echo Starting Payment Service...
start cmd /k "cd payment-service && set NODE_ENV=development&& set BYPASS_AUTH=true&& npm start"

echo Starting Cart Service...
start cmd /k "cd cart-service && set NODE_ENV=development&& set BYPASS_AUTH=true&& npm start"

REM Start Frontend
echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo All services started successfully!
echo Frontend: http://localhost:5173
echo Order Service: http://localhost:5001
echo Payment Service: http://localhost:5003
echo Cart Service: http://localhost:5003