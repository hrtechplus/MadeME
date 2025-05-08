#!/bin/bash

# Apply ConfigMaps and Secrets
kubectl apply -f config.yaml
kubectl apply -f secrets.yaml

# Apply Persistent Volumes
kubectl apply -f mongodb-pv.yaml

# Apply MongoDB
kubectl apply -f mongodb.yaml

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
kubectl wait --for=condition=available --timeout=300s deployment/mongodb

# Apply Microservices
kubectl apply -f user-service.yaml
kubectl apply -f restaurant-service.yaml
kubectl apply -f order-service.yaml
kubectl apply -f payment-service.yaml
kubectl apply -f delivery-service.yaml

# Apply API Gateway
kubectl apply -f api-gateway.yaml

# Apply Frontend and Ingress
kubectl apply -f frontend.yaml

echo "Kubernetes deployment completed!"
echo "Add 'mademe.local' to your hosts file to access the application."
echo "For example, add this line to /etc/hosts (Linux/Mac) or C:\\Windows\\System32\\drivers\\etc\\hosts (Windows):"
echo "127.0.0.1 mademe.local" 