import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, JetStreamClient, JetStreamManager, StringCodec } from 'nats';
import { Logger } from '../utils/logger';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private connection: NatsConnection;
  private jetstream: JetStreamClient;
  private jsm: JetStreamManager;
  private readonly stringCodec = StringCodec();
  private readonly logger = new Logger({ service: 'NatsService' });

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
    await this.setupStreams();
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async connect() {
    const natsUrl = this.configService.get<string>('NATS_URL', 'nats://localhost:4222');
    
    try {
      this.connection = await connect({ servers: natsUrl });
      this.jetstream = this.connection.jetstream();
      this.jsm = await this.connection.jetstreamManager();
      
      this.logger.info('Connected to NATS server', { natsUrl });
    } catch (error) {
      this.logger.error('Failed to connect to NATS server', error, { natsUrl });
      throw error;
    }
  }

  private async setupStreams() {
    const streams = [
      {
        name: 'EVENTS',
        subjects: ['events.facebook', 'events.tiktok'],
      },
    ];

    for (const streamConfig of streams) {
      try {
        await this.jsm.streams.add({
          name: streamConfig.name,
          subjects: streamConfig.subjects,
          retention: 'limits',
          max_age: 7 * 24 * 60 * 60 * 1000000000, // 7 days in nanoseconds
          storage: 'file',
        });
        this.logger.info('Stream configured', { stream: streamConfig.name });
      } catch (error) {
        if (error.message.includes('already exists')) {
          this.logger.info('Stream already exists', { stream: streamConfig.name });
        } else {
          this.logger.error('Failed to create stream', error, { stream: streamConfig.name });
          throw error;
        }
      }
    }
  }

  async publish(subject: string, data: any, correlationId?: string): Promise<void> {
    try {
      const payload = JSON.stringify(data);
      const headers = correlationId ? { 'correlation-id': correlationId } : undefined;
      
      await this.jetstream.publish(subject, this.stringCodec.encode(payload), { headers });
      
      this.logger.info('Message published', { subject, correlationId });
    } catch (error) {
      this.logger.error('Failed to publish message', error, { subject, correlationId });
      throw error;
    }
  }

  getJetStream(): JetStreamClient {
    return this.jetstream;
  }

  getConnection(): NatsConnection {
    return this.connection;
  }
}