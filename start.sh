#!/bin/bash

# Event Processing System Startup Script
# This script ensures all services start in the correct order

echo "Starting Event Processing System..."

# Function to check if a service is healthy
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✓ $service is healthy"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts - $service not ready yet..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "✗ $service failed to become healthy"
    return 1
}

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down

# Start infrastructure services
echo ""
echo "Starting infrastructure services..."
docker-compose up -d postgres nats

# Wait for infrastructure to be ready
echo "Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "  PostgreSQL not ready yet..."
    sleep 3
done
echo "✓ PostgreSQL is ready"

echo "Waiting for NATS..."
until curl -f -s http://localhost:8222/healthz > /dev/null 2>&1; do
    echo "  NATS not ready yet..."
    sleep 3
done
echo "✓ NATS is ready"

# Start gateway
echo ""
echo "Starting gateway service..."
docker-compose up -d gateway

# Wait for gateway to be healthy
if ! check_health "Gateway" "http://localhost:3001/health/ready"; then
    echo "Gateway failed to start. Check logs with: docker-compose logs gateway"
    exit 1
fi

# Start collectors
echo ""
echo "Starting collector services..."
docker-compose up -d fb-collector ttk-collector

# Wait for collectors to be healthy
if ! check_health "Facebook Collector" "http://localhost:3002/health/ready"; then
    echo "Facebook Collector failed to start. Check logs with: docker-compose logs fb-collector"
    exit 1
fi

if ! check_health "TikTok Collector" "http://localhost:3003/health/ready"; then
    echo "TikTok Collector failed to start. Check logs with: docker-compose logs ttk-collector"
    exit 1
fi

# Start reporter
echo ""
echo "Starting reporter service..."
docker-compose up -d reporter

# Wait for reporter to be healthy
if ! check_health "Reporter" "http://localhost:3004/health/ready"; then
    echo "Reporter failed to start. Check logs with: docker-compose logs reporter"
    exit 1
fi

# Start monitoring services
echo ""
echo "Starting monitoring services..."
docker-compose up -d prometheus grafana

# Start publisher last
echo ""
echo "Starting publisher service..."
docker-compose up -d publisher

echo ""
echo "✓ All services started successfully!"
echo ""
echo "Service URLs:"
echo "  - Gateway API: http://localhost:3001/api"
echo "  - Reporter API: http://localhost:3004/api" 
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "To view logs: docker-compose logs -f [service-name]"
echo "To stop all services: docker-compose down"