import { Injectable } from '@nestjs/common';
import { NatsService } from '../shared/services/nats.service';
import { MetricsService } from '../shared/services/metrics.service';
import { Logger, CorrelationIdGenerator } from '../shared/utils/logger';
import { Event } from '../shared/types/events';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger({ service: 'GatewayService' });

  constructor(
    private readonly natsService: NatsService,
    private readonly metricsService: MetricsService,
  ) {}

  async processEvent(event: Event): Promise<void> {
    const correlationId = CorrelationIdGenerator.generate();
    const contextLogger = this.logger.withCorrelationId(correlationId);

    try {
      contextLogger.info('Processing event', { eventId: event.eventId, source: event.source });

      const subject = `events.${event.source}`;
      await this.natsService.publish(subject, event, correlationId);

      this.metricsService.incrementEventsAccepted('gateway', event.source);
      
      contextLogger.info('Event published successfully', { 
        eventId: event.eventId, 
        source: event.source,
        subject 
      });
    } catch (error) {
      this.metricsService.incrementEventsFailed('gateway', event.source, error.name);
      contextLogger.error('Failed to process event', error, { 
        eventId: event.eventId, 
        source: event.source 
      });
      throw error;
    }
  }
}