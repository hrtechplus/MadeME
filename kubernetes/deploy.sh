#!/bin/bash

# Create namespace first
echo "Creating MadeME namespace..."
kubectl apply -f kubernetes/mademe-namespace.yaml

# Wait for namespace to be fully created
sleep 5

# Deploy MongoDB first as other services depend on it
echo "Deploying MongoDB..."
kubectl apply -f kubernetes/mongodb.yaml

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
kubectl wait --namespace mademe --for=condition=ready pod -l app=mongodb --timeout=120s

# Deploy backend services
echo "Deploying backend services..."
kubectl apply -f kubernetes/user-service.yaml
kubectl apply -f kubernetes/restaurant-service.yaml
kubectl apply -f kubernetes/payment-service.yaml
kubectl apply -f kubernetes/order-service.yaml
kubectl apply -f kubernetes/cart-service.yaml

# Deploy frontend service
echo "Deploying frontend service..."
kubectl apply -f kubernetes/frontend.yaml

# Wait for all services to be ready
echo "Waiting for all services to be ready..."
kubectl wait --namespace mademe --for=condition=ready pod -l app=user-service --timeout=120s
kubectl wait --namespace mademe --for=condition=ready pod -l app=restaurant-service --timeout=120s
kubectl wait --namespace mademe --for=condition=ready pod -l app=payment-service --timeout=120s
kubectl wait --namespace mademe --for=condition=ready pod -l app=order-service --timeout=120s
kubectl wait --namespace mademe --for=condition=ready pod -l app=cart-service --timeout=120s
kubectl wait --namespace mademe --for=condition=ready pod -l app=frontend --timeout=120s

# Deploy Ingress last
echo "Deploying Ingress controller..."
kubectl apply -f kubernetes/ingress.yaml

echo "MadeME application deployment complete!"
echo "Access the application at http://mademe.example.com (after configuring domain DNS)"