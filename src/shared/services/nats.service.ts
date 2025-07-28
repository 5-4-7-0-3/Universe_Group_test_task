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

  constructor(private configService: ConfigService) {
    this.initializationPromise = this.initialize();
  }

  async onModuleInit() {
    await this.initializationPromise;
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async initialize() {
    await this.connect();
    await this.setupStreams();
  }

  private async connect() {
    const natsUrl = this.configService.get<string>(
      'NATS_URL',
      'nats://localhost:4222'
    );

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
          retention: RetentionPolicy.Limits,
          max_age: 7 * 24 * 60 * 60 * 1_000_000_000,
          storage: StorageType.File,
        });
        this.logger.info('Stream configured', { stream: streamConfig.name });
      } catch (error) {
        if ((error as Error).message.includes('already exists')) {
          this.logger.info('Stream already exists', { stream: streamConfig.name });
        } else {
          this.logger.error('Failed to create stream', error, {
            stream: streamConfig.name,
          });
          throw error;
        }
      }
    }
  }

  async publish(
    subject: string,
    data: any,
    correlationId?: string
  ): Promise<void> {
    await this.initializationPromise;

    try {
      const payload = this.stringCodec.encode(JSON.stringify(data));

      let hdrs: MsgHdrs | undefined;
      if (correlationId) {
        const h = createHeaders();
        h.set('correlation-id', correlationId);
        hdrs = h;
      }

      await this.jetstream.publish(subject, payload, { headers: hdrs });

      this.logger.info('Message published', { subject, correlationId });
    } catch (error) {
      this.logger.error('Failed to publish message', error, { subject, correlationId });
      throw error;
    }
  }

  async getJetStream(): Promise<JetStreamClient> {
    await this.initializationPromise;
    return this.jetstream;
  }

  async getConnection(): Promise<NatsConnection> {
    await this.initializationPromise;
    return this.connection;
  }

  private isReady = false;

  async waitForReady(): Promise<void> {
    while (!this.isReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}