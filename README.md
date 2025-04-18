# Food Delivery Application

A microservices-based food delivery application with separate services for cart, payment, and order management.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (running locally or accessible via connection string)
- Stripe account (for payment processing)

## Project Structure

```
.
├── cart-service/         # Cart management service
├── payment-service/      # Payment processing service
├── order-service/        # Order management service
└── frontend/            # React frontend application
```

## Environment Setup

1. Create `.env` files in each service directory with the following variables:

### Cart Service (.env)

```
PORT=5002
MONGODB_URI=mongodb://localhost:27017/cart-service
```

### Payment Service (.env)

```
PORT=5003
MONGODB_URI=mongodb://localhost:27017/payment-service
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Order Service (.env)

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/order-service
```

### Frontend (.env)

```
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_CART_SERVICE_URL=http://localhost:5002
VITE_ORDER_SERVICE_URL=http://localhost:5001
VITE_PAYMENT_SERVICE_URL=http://localhost:5003
```

## Starting the Backend Services

1. Start MongoDB if not already running
2. Open separate terminal windows for each service

### Cart Service

```bash
cd cart-service
npm install
npm start
```

### Payment Service

```bash
cd payment-service
npm install
npm start
```

### Order Service

```bash
cd order-service
npm install
npm start
```

## Starting the Frontend

1. Open a new terminal window
2. Navigate to the frontend directory and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

## API Endpoints

### Cart Service

- GET /api/cart/:userId - Get user's cart
- POST /api/cart/:userId - Add item to cart
- PUT /api/cart/:userId - Update cart
- DELETE /api/cart/:userId - Clear cart

### Payment Service

- POST /api/payment/create-intent/:orderId - Create payment intent
- GET /api/payment/status/:orderId - Check payment status

### Order Service

- POST /api/order - Create new order
- GET /api/order/user/:userId - Get user's orders
- GET /api/order/:orderId - Get order details
- PUT /api/order/:orderId - Update order status

## Health Check Endpoints

Each service has a health check endpoint:

- Cart Service: http://localhost:5002/health
- Payment Service: http://localhost:5003/health
- Order Service: http://localhost:5001/health

## Troubleshooting

1. If you encounter port conflicts:

   - Check if any service is already running on the required ports
   - Use `netstat -ano | findstr :PORT` to find processes using the port
   - Use `taskkill /F /PID PROCESS_ID` to terminate the process

2. If MongoDB connection fails:

   - Ensure MongoDB is running
   - Verify the connection string in .env files
   - Check if MongoDB port (27017) is accessible

3. If Stripe integration fails:
   - Verify Stripe API keys in environment variables
   - Check Stripe dashboard for any errors
   - Ensure proper CORS configuration

## Development

- The frontend uses Vite for development
- Backend services use Express.js
- All services use MongoDB for data storage
- Payment processing is handled by Stripe

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
