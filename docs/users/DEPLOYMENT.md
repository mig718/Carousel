# Deployment Guide

This guide explains how to deploy the Carousel application to various environments.

For interview/quick-reference CI/CD context, see [docs/reference/CI_CD_BASICS_STUDY_GUIDE.md](../reference/CI_CD_BASICS_STUDY_GUIDE.md).

## Local Deployment (Recommended)

### Prerequisites
- Docker
- Docker Compose

### Steps

1. Start the full deployable stack:
```bash
npm run compose:app:up
```

2. Stop the full stack:
```bash
npm run compose:app:down
```

### Debug Profile (DBs only)

Use this when you want to run backend/frontend from local scripts but keep PostgreSQL in containers:

```bash
npm run dev:up
# run local services with npm run backend / npm run frontend
npm run dev:down
```

Services will be available at:
- API Gateway: http://localhost:8000
- Frontend: http://localhost:3000

Compose files:
- `docker-compose.app.yml`: full deployable package
- `docker-compose.debug.yml`: debug data stack (PostgreSQL)

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
  SPRING_DATASOURCE_URL: "jdbc:postgresql://postgres:5432/carousel_roles"
  SPRING_DATASOURCE_USERNAME: "postgres"
  SPRING_DATASOURCE_PASSWORD: "postgres"

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
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            configMapKeyRef:
              name: carousel-config
              key: SPRING_DATASOURCE_URL
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            configMapKeyRef:
              name: carousel-config
              key: SPRING_DATASOURCE_USERNAME
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            configMapKeyRef:
              name: carousel-config
              key: SPRING_DATASOURCE_PASSWORD

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
# PostgreSQL Connection
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/carousel_roles
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

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

- Use PostgreSQL read replicas/partitioning for horizontal scaling
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
# PostgreSQL backup
pg_dump -h host -U username -d database_name > backup.sql

# PostgreSQL restore
psql -h host -U username -d database_name -f backup.sql
```

### Application Backups

- Backup configuration files
- Document infrastructure-as-code
- Version control all source code

