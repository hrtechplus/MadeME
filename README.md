# Food Delivery System

A microservices-based food delivery system with a modern React frontend.

## System Architecture

The system consists of the following services:

1. **Frontend** (React)

   - User interface for customers and restaurants
   - Real-time order tracking
   - Payment processing
   - Order management

2. **Order Service**

   - Order creation and management
   - Restaurant order handling
   - Order status updates

3. **Payment Service**
   - Payment processing
   - Transaction management
   - Payment status tracking

## Features

### Customer Features

- Browse restaurants and menus
- Add items to cart
- Place orders
- Track order status
- View order history
- Make payments
- Manage delivery addresses

### Restaurant Features

- View incoming orders
- Accept/reject orders
- Update order status
- View order history
- Manage menu items

## API Documentation

### Order Service

#### Create Order

```http
POST /api/order
```

Request Body:

```json
{
  "userId": "string",
  "restaurantId": "string",
  "items": [
    {
      "itemId": "string",
      "name": "string",
      "price": number,
      "quantity": number
    }
  ],
  "total": number,
  "deliveryAddress": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  }
}
```

#### Restaurant Response

```http
POST /api/order/:id/restaurant-response
```

Request Body:

```json
{
  "response": "ACCEPTED" | "REJECTED",
  "reason": "string" // Optional, required for rejection
}
```

#### Update Order Status

```http
PATCH /api/order/:id/status
```

Request Body:

```json
{
  "status": "PENDING" | "CONFIRMED" | "REJECTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED"
}
```

#### Get User Orders

```http
GET /api/order/user/:userId
```

#### Get Restaurant Orders

```http
GET /api/order/restaurant/:restaurantId
```

### Payment Service

#### Process Payment

```http
POST /api/payment
```

Request Body:

```json
{
  "orderId": "string",
  "amount": number,
  "cardDetails": {
    "number": "string",
    "expiry": "string",
    "cvv": "string",
    "name": "string"
  }
}
```

## Order Status Flow

1. **PENDING**

   - Initial state when order is created
   - Waiting for restaurant response

2. **CONFIRMED**

   - Restaurant has accepted the order
   - Payment is processed
   - Order is being prepared

3. **REJECTED**

   - Restaurant has rejected the order
   - Includes rejection reason
   - Payment is refunded if already processed

4. **PREPARING**

   - Restaurant is preparing the order
   - Food is being cooked

5. **OUT_FOR_DELIVERY**

   - Order is being delivered
   - Driver is assigned

6. **DELIVERED**
   - Order has been delivered
   - Transaction is complete

## Restaurant Response Flow

1. **PENDING**

   - Initial state
   - Restaurant needs to respond

2. **ACCEPTED**

   - Restaurant accepts the order
   - Order status moves to CONFIRMED
   - Payment processing begins

3. **REJECTED**
   - Restaurant rejects the order
   - Order status moves to REJECTED
   - Rejection reason is recorded
   - Payment is refunded if processed

## Data Models

### Order Model

```javascript
{
  userId: String,
  restaurantId: String,
  items: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: String, // PENDING, CONFIRMED, REJECTED, PREPARING, OUT_FOR_DELIVERY, DELIVERED
  restaurantResponse: String, // PENDING, ACCEPTED, REJECTED
  rejectionReason: String,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  paymentId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model

```javascript
{
  orderId: String,
  amount: Number,
  status: String, // PENDING, COMPLETED, FAILED
  transactionId: String,
  paymentMethod: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Order Service Setup

```bash
cd order-service
npm install
npm start
```

### Payment Service Setup

```bash
cd payment-service
npm install
npm start
```

### Environment Variables

#### Order Service

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/order-service
```

#### Payment Service

```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/payment-service
```

## Testing

### Order Service Tests

```bash
cd order-service
npm test
```

### Payment Service Tests

```bash
cd payment-service
npm test
```

## Error Handling

The system implements comprehensive error handling:

1. **Validation Errors**

   - Input validation for all API endpoints
   - Clear error messages for invalid data

2. **Business Logic Errors**

   - Order status validation
   - Payment processing errors
   - Restaurant response validation

3. **System Errors**
   - Database connection errors
   - Service communication errors
   - Network errors

## Security

1. **Data Validation**

   - Input sanitization
   - Schema validation
   - Type checking

2. **Error Handling**

   - Secure error messages
   - No sensitive data exposure

3. **API Security**
   - Rate limiting
   - CORS configuration
   - Request validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
