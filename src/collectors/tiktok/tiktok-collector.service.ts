import { Injectable } from '@nestjs/common';
import { BaseCollectorService } from '../base/base-collector.service';
import { NatsService } from '../../shared/services/nats.service';
import { DatabaseService } from '../../shared/services/database.service';
import { MetricsService } from '../../shared/services/metrics.service';

@Injectable()
export class TiktokCollectorService extends BaseCollectorService {
  constructor(
    natsService: NatsService,
    databaseService: DatabaseService,
    metricsService: MetricsService,
  ) {
    super('tiktok-collector', 'events.tiktok', natsService, databaseService, metricsService);
  }
}