import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ReporterModule } from '../src/reporter/reporter.module';

describe('ReporterController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ReporterModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/reports/events (GET) - should return event statistics', () => {
    return request(app.getHttpServer())
      .get('/reports/events')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/reports/events (GET) - should filter by source', () => {
    return request(app.getHttpServer())
      .get('/reports/events?source=facebook')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/reports/revenue (GET) - should return revenue data', () => {
    return request(app.getHttpServer())
      .get('/reports/revenue')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/reports/demographics (GET) - should return demographics data', () => {
    return request(app.getHttpServer())
      .get('/reports/demographics')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('facebook');
        expect(res.body).toHaveProperty('tiktok');
      });
  });
});