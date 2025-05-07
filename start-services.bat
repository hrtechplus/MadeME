@echo off
echo Starting MadeME Food Delivery System...

echo.
echo Option 1: Run with Docker Compose (recommended)
echo Option 2: Run services individually
echo.

set /p CHOICE=Enter your choice (1 or 2): 

if "%CHOICE%"=="1" (
    echo Starting all services with Docker Compose...
    docker-compose up
) else if "%CHOICE%"=="2" (
    echo Starting MongoDB...
    start mongod --fork --logpath C:\tmp\mongod.log

    echo Starting Order Service...
    cd order-service
    start cmd /k "set NODE_ENV=development && set BYPASS_AUTH=true && set PORT=8004 && npm start"
    cd ..

    echo Starting Payment Service...
    cd payment-service
    start cmd /k "set NODE_ENV=development && set BYPASS_AUTH=true && set PORT=8005 && npm start"
    cd ..

    echo Starting Cart Service...
    cd cart-service
    start cmd /k "set NODE_ENV=development && set BYPASS_AUTH=true && set PORT=8003 && npm start"
    cd ..

    echo Starting User Service...
    cd user-service
    start cmd /k "set NODE_ENV=development && set PORT=8001 && npm start"
    cd ..

    echo Starting Restaurant Service...
    cd restaurant-service
    start cmd /k "set NODE_ENV=development && set PORT=8002 && npm start"
    cd ..

    echo Starting Delivery Service...
    cd deliveryservicev1
    if not exist venv (
        python -m venv venv
    )
    start cmd /k "venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8016 --reload"
    cd ..

    echo Starting Notification Service...
    cd notificationservicev1
    if not exist venv (
        python -m venv venv
    )
    start cmd /k "venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8015 --reload"
    cd ..

    echo Starting Frontend...
    cd frontend
    start cmd /k "npm run dev"
    cd ..

    echo.
    echo All services started successfully!
    echo Frontend: http://localhost:3000
    echo Order Service: http://localhost:8004
    echo Payment Service: http://localhost:8005
    echo Cart Service: http://localhost:8003
    echo User Service: http://localhost:8001
    echo Restaurant Service: http://localhost:8002
    echo Delivery Service: http://localhost:8016
    echo Notification Service: http://localhost:8015
    echo.
    echo Press any key to stop all services...
    pause > nul
) else (
    echo Invalid choice. Please run the script again and enter 1 or 2.
    exit /b 1
)