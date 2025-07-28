import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  NatsConnection,
  JetStreamClient,
  JetStreamManager,
  StringCodec,
  RetentionPolicy,
  StorageType,
  headers as createHeaders,
  MsgHdrs,
  DiscardPolicy,
} from 'nats';
import { Logger } from '../utils/logger';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private connection: NatsConnection;
  private jetstream: JetStreamClient;
  private jsm: JetStreamManager;
  private readonly stringCodec = StringCodec();
  private readonly logger = new Logger({ service: 'NatsService' });
  private initializationPromise: Promise<void>;
  private isReady = false;

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
      this.logger.info('NATS connection closed');
    }
  }

  private async initialize() {
    try {
      await this.connect();
      await this.setupStreams();
      this.isReady = true;
      this.logger.info('NATS service fully initialized');
    } catch (error) {
      this.logger.error('Failed to initialize NATS service', error);
      throw error;
    }
  }

  private async connect() {
    const natsUrl = this.configService.get<string>(
      'NATS_URL',
      'nats://localhost:4222'
    );

    const maxRetries = 10;
    const retryDelay = 5000; // 5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`Attempting to connect to NATS (attempt ${attempt}/${maxRetries})`, { natsUrl });

        this.connection = await connect({
          servers: natsUrl,
          reconnect: true,
          maxReconnectAttempts: -1,
          waitOnFirstConnect: true,
        });

        this.jetstream = this.connection.jetstream();
        this.jsm = await this.connection.jetstreamManager();

        this.logger.info('Connected to NATS server', { natsUrl });
        return;
      } catch (error) {
        this.logger.error(`Failed to connect to NATS (attempt ${attempt}/${maxRetries})`, error, { natsUrl });

        if (attempt === maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
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
        // Check if stream exists
        try {
          const existingStream = await this.jsm.streams.info(streamConfig.name);
          this.logger.info('Stream already exists', {
            stream: streamConfig.name,
            state: existingStream.state
          });
          continue;
        } catch (error) {
          // Stream doesn't exist, create it
        }

        // Create new stream
        await this.jsm.streams.add({
          name: streamConfig.name,
          subjects: streamConfig.subjects,
          retention: RetentionPolicy.Limits,
          max_age: 7 * 24 * 60 * 60 * 1_000_000_000, // 7 days in nanoseconds
          storage: StorageType.File,
          num_replicas: 1,
          discard: DiscardPolicy.Old,
        });

        this.logger.info('Stream created', { stream: streamConfig.name });
      } catch (error) {
        this.logger.error('Failed to setup stream', error, {
          stream: streamConfig.name,
        });
        throw error;
      }
    }
  }

  async publish(
    subject: string,
    data: any,
    correlationId?: string
  ): Promise<void> {
    await this.waitForReady();

    try {
      const payload = this.stringCodec.encode(JSON.stringify(data));

      let hdrs: MsgHdrs | undefined;
      if (correlationId) {
        const h = createHeaders();
        h.set('correlation-id', correlationId);
        hdrs = h;
      }

      await this.jetstream.publish(subject, payload, { headers: hdrs });

      this.logger.debug('Message published', { subject, correlationId });
    } catch (error) {
      this.logger.error('Failed to publish message', error, { subject, correlationId });
      throw error;
    }
  }

  async getJetStream(): Promise<JetStreamClient> {
    await this.waitForReady();
    return this.jetstream;
  }

  async getConnection(): Promise<NatsConnection> {
    await this.waitForReady();
    return this.connection;
  }

  async waitForReady(): Promise<void> {
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 100;
    const startTime = Date.now();

    while (!this.isReady) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('NATS service initialization timeout');
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
}