import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { EventValidationService } from './services/event-validation.service';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { NatsService } from '../shared/services/nats.service';
import { MetricsService } from '../shared/services/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
  ],
  controllers: [GatewayController, HealthController, MetricsController],
  providers: [GatewayService, EventValidationService, NatsService, MetricsService],
})
export class GatewayModule {}