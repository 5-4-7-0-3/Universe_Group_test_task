import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { FacebookCollectorService } from './facebook-collector.service';
import { HealthController } from '../shared/controllers/health.controller';
import { MetricsController } from '../shared/controllers/metrics.controller';
import { NatsService } from '../../shared/services/nats.service';
import { DatabaseService } from '../../shared/services/database.service';
import { MetricsService } from '../../shared/services/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [FacebookCollectorService, NatsService, DatabaseService, MetricsService],
})
export class FacebookCollectorModule {}