#!/bin/bash

# Health Check Script for Event Processing System

echo "Event Processing System Health Check"
echo "===================================="
echo ""

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo "✓ $name: HEALTHY"
        return 0
    else
        echo "✗ $name: UNHEALTHY"
        return 1
    fi
}

# Check all services
failed=0

echo "Infrastructure Services:"
echo "-----------------------"
# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ PostgreSQL: HEALTHY"
else
    echo "✗ PostgreSQL: UNHEALTHY"
    failed=$((failed + 1))
fi

# Check NATS
if curl -f -s http://localhost:8222/healthz > /dev/null 2>&1; then
    echo "✓ NATS: HEALTHY"
else
    echo "✗ NATS: UNHEALTHY"
    failed=$((failed + 1))
fi

echo ""
echo "Application Services:"
echo "---------------------"
check_service "Gateway" "http://localhost:3001/health/ready" || failed=$((failed + 1))
check_service "Facebook Collector" "http://localhost:3002/health/ready" || failed=$((failed + 1))
check_service "TikTok Collector" "http://localhost:3003/health/ready" || failed=$((failed + 1))
check_service "Reporter" "http://localhost:3004/health/ready" || failed=$((failed + 1))

echo ""
echo "Monitoring Services:"
echo "--------------------"
check_service "Prometheus" "http://localhost:9090/-/ready" || failed=$((failed + 1))
check_service "Grafana" "http://localhost:3000/api/health" || failed=$((failed + 1))

echo ""
echo "Publisher Status:"
echo "-----------------"
if docker-compose ps publisher | grep -q "Up"; then
    echo "✓ Publisher: RUNNING"
else
    echo "✗ Publisher: NOT RUNNING"
    failed=$((failed + 1))
fi

echo ""
echo "===================================="
if [ $failed -eq 0 ]; then
    echo "✓ All services are healthy!"
else
    echo "✗ $failed service(s) are unhealthy"
    echo ""
    echo "To view logs for a specific service:"
    echo "  docker-compose logs -f [service-name]"
    echo ""
    echo "To restart a service:"
    echo "  docker-compose restart [service-name]"
fi

exit $failed