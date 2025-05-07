# MadeMe Kubernetes Resources

This document provides an overview of all Kubernetes resources included in this deployment.

## Configuration Resources

| Resource Type | Name                | Purpose                                         |
| ------------- | ------------------- | ----------------------------------------------- |
| ConfigMap     | mademe-config       | Stores non-sensitive configuration for services |
| Secret        | mongodb-credentials | MongoDB username and password                   |
| Secret        | api-secrets         | JWT secret for authentication                   |
| Secret        | payment-secrets     | Stripe API keys                                 |

## Storage Resources

| Resource Type         | Name        | Purpose                              |
| --------------------- | ----------- | ------------------------------------ |
| PersistentVolume      | mongodb-pv  | Persistent storage for MongoDB data  |
| PersistentVolumeClaim | mongodb-pvc | Claim for MongoDB persistent storage |

## Backend Services

| Resource Type | Name               | Container Port | Purpose                                  |
| ------------- | ------------------ | -------------- | ---------------------------------------- |
| Deployment    | mongodb            | 27017          | Database for all services                |
| Service       | mongodb            | 27017          | Internal MongoDB access                  |
| Deployment    | user-service       | 5002           | Manages user accounts and authentication |
| Service       | user-service       | 5002           | Internal User Service access             |
| Deployment    | restaurant-service | 5003           | Manages restaurant data and menus        |
| Service       | restaurant-service | 5003           | Internal Restaurant Service access       |
| Deployment    | order-service      | 5001           | Manages customer orders                  |
| Service       | order-service      | 5001           | Internal Order Service access            |
| Deployment    | payment-service    | 5004           | Handles payment processing               |
| Service       | payment-service    | 5004           | Internal Payment Service access          |
| Deployment    | delivery-service   | 5005           | Manages delivery tracking                |
| Service       | delivery-service   | 5005           | Internal Delivery Service access         |

## Gateway and Frontend

| Resource Type | Name           | Container Port | Purpose                                     |
| ------------- | -------------- | -------------- | ------------------------------------------- |
| Deployment    | api-gateway    | 5000           | API Gateway for all backend services        |
| Service       | api-gateway    | 5000           | Internal API Gateway access                 |
| Deployment    | frontend       | 5173           | Web frontend for the application            |
| Service       | frontend       | 5173           | Internal Frontend access                    |
| Ingress       | mademe-ingress | N/A            | External access to Frontend and API Gateway |

## Deployment Order

For proper deployment, resources should be created in the following order:

1. ConfigMap and Secrets
2. PersistentVolume and PersistentVolumeClaim
3. MongoDB
4. Backend Microservices
5. API Gateway
6. Frontend
7. Ingress

This order ensures dependencies are met during the deployment process.
