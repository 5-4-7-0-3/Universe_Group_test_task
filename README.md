# Event Processing System

A comprehensive event processing system built with NestJS, NATS JetStream, and PostgreSQL that handles webhook events from multiple sources (Facebook and TikTok), processes them through collectors, and provides detailed reporting capabilities.

## Architecture

The system consists of the following services:

- **Gateway**: Receives webhook events and publishes them to NATS JetStream
- **Facebook Collector**: Processes Facebook events and stores them in the database
- **TikTok Collector**: Processes TikTok events and stores them in the database
- **Reporter**: Provides API endpoints for generating various reports
- **Publisher**: Docker image that generates sample events (provided)

## Infrastructure

- **NATS JetStream**: Message broker for event streaming
- **PostgreSQL**: Database for storing events and user data
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## Features

### Core Functionality
- ✅ OOP and SOLID principles implementation
- ✅ Event validation with Zod schemas
- ✅ Structured logging with correlation IDs
- ✅ Comprehensive metrics collection
- ✅ Health checks for all services
- ✅ Graceful shutdown handling
- ✅ Automatic database migrations
- ✅ Multi-environment configuration

### API Endpoints

#### Gateway
- `POST /events` - Receive webhook events
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

#### Reporter
- `GET /reports/events` - Event statistics with filters
- `GET /reports/revenue` - Revenue data from transactional events
- `GET /reports/demographics` - User demographic information
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

### Monitoring Dashboards

Grafana provides real-time monitoring with:
- Gateway metrics (accepted, processed, failed events)
- Collector processing rates (stacked time series)
- Reporter latency by category
- System health indicators

## Quick Start

1. **Clone and setup**:
```bash
git clone <repository>
cd event-processing-system
```

2. **Start the entire system**:
```bash
docker-compose up -d
```

3. **Access services**:
- Gateway API: http://localhost:3001/api
- Reporter API: http://localhost:3004/api
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

## Environment Variables

Key environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NATS_URL`: NATS server URL
- `EVENT_ENDPOINT`: Gateway endpoint for the publisher
- `LOG_LEVEL`: Logging level (info, debug, error)
- `NODE_ENV`: Environment (development, staging, production)

## Data Persistence

- Database data persists across restarts via Docker volumes
- NATS JetStream data persists for 7 days
- Grafana dashboards and data sources are provisioned automatically

## Development

### Running Tests
```bash
npm test                # Unit tests
npm run test:e2e       # Integration tests
npm run test:cov       # Coverage report
```

### Local Development
```bash
npm install
npm run start:dev      # Development mode with hot reload
```

### Database Operations
```bash
npm run migrate        # Run migrations
npm run db:generate    # Generate Prisma client
```

## Scaling

The system is designed for horizontal scaling:
- Gateway instances can be load-balanced
- Collector services can run multiple instances
- NATS JetStream handles message distribution
- Database connections are managed efficiently

## Monitoring

### Health Checks
All services expose:
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

### Metrics
Prometheus metrics include:
- `events_accepted_total` - Events received by gateway
- `events_processed_total` - Events processed by collectors
- `events_failed_total` - Failed event processing attempts
- `report_duration_seconds` - Report generation latency

### Logging
Structured JSON logs with:
- Correlation IDs for request tracing
- Service identification
- Error stack traces
- Contextual metadata

## Production Considerations

- All services include graceful shutdown handling
- Database migrations run automatically on startup
- Health checks ensure service readiness
- Comprehensive error handling and recovery
- Resource limits and monitoring in place
- Security best practices implemented