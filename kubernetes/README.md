# MadeMe Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the MadeMe food delivery application.

## Prerequisites

- Kubernetes cluster (Minikube, Docker Desktop with Kubernetes, or a cloud provider)
- kubectl installed and configured
- Docker installed (for building images)

## Building Docker Images

Before deploying to Kubernetes, you need to build the Docker images for each service:

```bash
# Build all images
docker build -t mademe/api-gateway:latest ./api-gateway
docker build -t mademe/user-service:latest ./user-service
docker build -t mademe/restaurant-service:latest ./restaurant-service
docker build -t mademe/order-service:latest ./order-service
docker build -t mademe/payment-service:latest ./payment-service
docker build -t mademe/delivery-service:latest ./delivery-service
docker build -t mademe/frontend:latest ./frontend
```

If you're using Minikube, you need to use the Minikube Docker daemon:

```bash
eval $(minikube docker-env)
# Build images as above
```

## Deployment

### Option 1: Using the deployment script

Make the script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual deployment

Apply resources in the following order:

1. ConfigMaps and Secrets:

   ```bash
   kubectl apply -f config.yaml
   kubectl apply -f secrets.yaml
   ```

2. Persistent Volumes:

   ```bash
   kubectl apply -f mongodb-pv.yaml
   ```

3. MongoDB:

   ```bash
   kubectl apply -f mongodb.yaml
   ```

4. Microservices:

   ```bash
   kubectl apply -f user-service.yaml
   kubectl apply -f restaurant-service.yaml
   kubectl apply -f order-service.yaml
   kubectl apply -f payment-service.yaml
   kubectl apply -f delivery-service.yaml
   ```

5. API Gateway:

   ```bash
   kubectl apply -f api-gateway.yaml
   ```

6. Frontend and Ingress:
   ```bash
   kubectl apply -f frontend.yaml
   ```

## Accessing the Application

The application is configured to be accessed via the domain `mademe.local`. Add this to your hosts file:

```
127.0.0.1 mademe.local
```

- Windows: Edit `C:\Windows\System32\drivers\etc\hosts`
- Linux/Mac: Edit `/etc/hosts`

If you're using Minikube, get the IP address with:

```bash
minikube ip
```

Then use that IP instead of 127.0.0.1 in your hosts file.

### Viewing the Application

Once deployed, you can access:

- Frontend: http://mademe.local
- API Gateway: http://mademe.local/api

## Monitoring Deployments

Check the status of deployments:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress
```

## Scaling Services

To scale a service (for example, the restaurant service):

```bash
kubectl scale deployment/restaurant-service --replicas=3
```

## Cleanup

To remove all deployed resources:

```bash
kubectl delete -f frontend.yaml
kubectl delete -f api-gateway.yaml
kubectl delete -f user-service.yaml
kubectl delete -f restaurant-service.yaml
kubectl delete -f order-service.yaml
kubectl delete -f payment-service.yaml
kubectl delete -f delivery-service.yaml
kubectl delete -f mongodb.yaml
kubectl delete -f mongodb-pv.yaml
kubectl delete -f secrets.yaml
kubectl delete -f config.yaml
```

Or use the `kubectl delete -f <directory>` command to delete all resources at once:

```bash
kubectl delete -f .
```
