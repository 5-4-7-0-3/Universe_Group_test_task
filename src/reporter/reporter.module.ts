import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ReporterController } from './reporter.controller';
import { ReporterService } from './reporter.service';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { DatabaseService } from '../shared/services/database.service';
import { MetricsService } from '../shared/services/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
  ],
  controllers: [ReporterController, HealthController, MetricsController],
  providers: [ReporterService, DatabaseService, MetricsService],
})
export class ReporterModule {}