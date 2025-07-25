import { Injectable } from '@nestjs/common';
import { BaseCollectorService } from '../base/base-collector.service';
import { NatsService } from '../../shared/services/nats.service';
import { DatabaseService } from '../../shared/services/database.service';
import { MetricsService } from '../../shared/services/metrics.service';

@Injectable()
export class FacebookCollectorService extends BaseCollectorService {
  constructor(
    natsService: NatsService,
    databaseService: DatabaseService,
    metricsService: MetricsService,
  ) {
    super('facebook-collector', 'events.facebook', natsService, databaseService, metricsService);
  }
}