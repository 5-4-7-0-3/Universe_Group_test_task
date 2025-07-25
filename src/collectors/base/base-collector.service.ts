import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subscription } from 'nats';
import { NatsService } from '../../shared/services/nats.service';
import { DatabaseService } from '../../shared/services/database.service';
import { MetricsService } from '../../shared/services/metrics.service';
import { Logger } from '../../shared/utils/logger';
import { Event } from '../../shared/types/events';

@Injectable()
export abstract class BaseCollectorService implements OnModuleInit, OnModuleDestroy {
  protected subscription: Subscription;
  protected readonly logger: Logger;
  
  constructor(
    protected readonly serviceName: string,
    protected readonly subject: string,
    protected readonly natsService: NatsService,
    protected readonly databaseService: DatabaseService,
    protected readonly metricsService: MetricsService,
  ) {
    this.logger = new Logger({ service: serviceName });
  }

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  async onModuleDestroy() {
    if (this.subscription) {
      await this.subscription.drain();
    }
  }

  private async subscribeToEvents() {
    try {
      const jetstream = this.natsService.getJetStream();
      const consumer = await jetstream.consumers.get('EVENTS', {
        durable_name: `${this.serviceName}-consumer`,
        filter_subject: this.subject,
        ack_policy: 'explicit',
      });

      const messages = await consumer.consume();
      
      this.logger.info(`Subscribed to ${this.subject}`);

      for await (const msg of messages) {
        const correlationId = msg.headers?.get('correlation-id');
        const contextLogger = this.logger.withCorrelationId(correlationId);
        
        try {
          const eventData = JSON.parse(msg.data.toString());
          contextLogger.info('Processing event', { eventId: eventData.eventId });
          
          await this.processEvent(eventData, correlationId);
          
          this.metricsService.incrementEventsProcessed(this.serviceName, eventData.source);
          msg.ack();
          
          contextLogger.info('Event processed successfully', { eventId: eventData.eventId });
        } catch (error) {
          const eventData = JSON.parse(msg.data.toString());
          this.metricsService.incrementEventsFailed(this.serviceName, eventData.source, error.name);
          contextLogger.error('Failed to process event', error, { eventId: eventData.eventId });
          msg.nak();
        }
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to events', error);
      throw error;
    }
  }

  protected async processEvent(event: Event, correlationId?: string): Promise<void> {
    const contextLogger = this.logger.withCorrelationId(correlationId);
    
    try {
      // Store event
      await this.databaseService.event.create({
        data: {
          eventId: event.eventId,
          timestamp: new Date(event.timestamp),
          source: event.source,
          funnelStage: event.funnelStage,
          eventType: event.eventType,
          data: event.data,
        },
      });

      // Store or update user
      const existingUser = await this.databaseService.user.findUnique({
        where: { userId: event.data.user.userId },
      });

      if (!existingUser) {
        await this.databaseService.user.create({
          data: {
            userId: event.data.user.userId,
            source: event.source,
            userData: event.data.user,
          },
        });
      } else {
        await this.databaseService.user.update({
          where: { userId: event.data.user.userId },
          data: { userData: event.data.user },
        });
      }

      contextLogger.info('Event stored successfully', { eventId: event.eventId });
    } catch (error) {
      contextLogger.error('Failed to store event', error, { eventId: event.eventId });
      throw error;
    }
  }
}