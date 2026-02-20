# Deployment Guide

This guide explains how to deploy the Carousel application to various environments.

## Local Development with Docker Compose

### Prerequisites
- Docker
- Docker Compose

### Steps

1. Build the backend services:
```bash
cd backend

# Auth Service
cd auth-service && mvn clean package -DskipTests && cd ..

# User Service
cd user-service && mvn clean package -DskipTests && cd ..

# Approval Service
cd approval-service && mvn clean package -DskipTests && cd ..

# API Gateway
cd api-gateway && mvn clean package -DskipTests && cd ..

cd ..
```

2. Start all services:
```bash
docker-compose up
```

3. Build and run frontend:
```bash
cd frontend
npm install
npm start
```

Services will be available at:
- API Gateway: http://localhost:8000
- Frontend: http://localhost:3000

## Docker Image Build

### Building Individual Service Images

```bash
# Build auth-service image
cd backend/auth-service
mvn clean package
docker build -t carousel/auth-service:1.0.0 .

# Build user-service image
cd ../user-service
mvn clean package
docker build -t carousel/user-service:1.0.0 .

# Build approval-service image
cd ../approval-service
mvn clean package
docker build -t carousel/approval-service:1.0.0 .

# Build api-gateway image
cd ../api-gateway
mvn clean package
docker build -t carousel/api-gateway:1.0.0 .
```

### Publishing to Docker Registry

```bash
# Tag images for registry
docker tag carousel/auth-service:1.0.0 myregistry/carousel/auth-service:1.0.0
docker tag carousel/user-service:1.0.0 myregistry/carousel/user-service:1.0.0
docker tag carousel/approval-service:1.0.0 myregistry/carousel/approval-service:1.0.0
docker tag carousel/api-gateway:1.0.0 myregistry/carousel/api-gateway:1.0.0

# Push to registry
docker push myregistry/carousel/auth-service:1.0.0
docker push myregistry/carousel/user-service:1.0.0
docker push myregistry/carousel/approval-service:1.0.0
docker push myregistry/carousel/api-gateway:1.0.0
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster
- kubectl
- Helm (optional)

### Basic Deployment YAML

Create `k8s-deployment.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: carousel-config
data:
  MONGODB_URI: "mongodb://mongodb:27017/carousel"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: carousel-api-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: carousel/api-gateway:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: SPRING_DATA_MONGODB_URI
          valueFrom:
            configMapKeyRef:
              name: carousel-config
              key: MONGODB_URI

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: api-gateway
```

Deploy to Kubernetes:
```bash
kubectl create namespace carousel
kubectl apply -f k8s-deployment.yaml -n carousel
```

## Environment Variables

### Backend Services

Required environment variables for each service:

```bash
# MongoDB Connection
SPRING_DATA_MONGODB_URI=mongodb://username:password@host:port/database

# Server Port
SERVER_PORT=8001

# JWT Secret (Auth Service)
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# Environment
SPRING_PROFILES_ACTIVE=prod
```

### Frontend

```bash
# API Base URL
REACT_APP_API_URL=http://api.example.com/api
```

## Production Checklist

- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Environment variables secured (secrets management)
- [ ] Logging configured and monitored
- [ ] Health checks endpoint enabled
- [ ] Rate limiting configured
- [ ] CORS configured appropriately
- [ ] Security headers configured
- [ ] Database migrations tested
- [ ] Load balancer configured
- [ ] Monitoring and alerting set up
- [ ] Disaster recovery plan documented

## Scaling

### Load Balancing

Use a reverse proxy (Nginx, HAProxy) or cloud load balancer to distribute traffic:

```nginx
upstream api_gateway {
  server api-gateway-1:8000;
  server api-gateway-2:8000;
  server api-gateway-3:8000;
}

server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://api_gateway;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Database Scaling

- Implement MongoDB sharding for horizontal scaling
- Set up replication for high availability
- Monitor database performance and index optimization

### Microservice Scaling

Scale individual services based on demand:

```bash
# Kubernetes
kubectl scale deployment carousel-auth-service --replicas=3 -n carousel
```

## Monitoring and Logging

### Application Metrics

Access metrics at each service's actuator endpoint:

```
GET /actuator/metrics
GET /actuator/health
GET /actuator/prometheus
```

### Log Aggregation

Configure centralized logging:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- DataDog
- CloudWatch (AWS)

## Backup and Recovery

### Database Backups

```bash
# MongoDB backup
mongodump --uri "mongodb://username:password@host:port/database" --out ./backup

# MongoDB restore
mongorestore --uri "mongodb://username:password@host:port/database" ./backup
```

### Application Backups

- Backup configuration files
- Document infrastructure-as-code
- Version control all source code

