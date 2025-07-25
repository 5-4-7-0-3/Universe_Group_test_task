import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GatewayModule } from '../src/gateway/gateway.module';

describe('GatewayController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GatewayModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/events (POST) - should accept valid Facebook event', () => {
    const facebookEvent = {
      eventId: 'fb_123',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'facebook',
      funnelStage: 'top',
      eventType: 'ad.view',
      data: {
        user: {
          userId: 'user_123',
          name: 'John Doe',
          age: 25,
          gender: 'male',
          location: {
            country: 'US',
            city: 'New York'
          }
        },
        engagement: {
          actionTime: '2024-01-01T00:00:00Z',
          referrer: 'newsfeed',
          videoId: null
        }
      }
    };

    return request(app.getHttpServer())
      .post('/events')
      .send(facebookEvent)
      .expect(201)
      .expect(res => {
        expect(res.body.status).toBe('success');
      });
  });

  it('/events (POST) - should reject invalid event', () => {
    const invalidEvent = {
      eventId: 'invalid_123',
      // Missing required fields
    };

    return request(app.getHttpServer())
      .post('/events')
      .send(invalidEvent)
      .expect(400);
  });

  it('/health/live (GET) - should return healthy status', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200);
  });

  it('/metrics (GET) - should return Prometheus metrics', () => {
    return request(app.getHttpServer())
      .get('/metrics')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('events_accepted_total');
      });
  });
});