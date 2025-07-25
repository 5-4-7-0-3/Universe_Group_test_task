import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NatsService } from '../nats.service';

describe('NatsService', () => {
  let service: NatsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NatsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('nats://localhost:4222'),
          },
        },
      ],
    }).compile();

    service = module.get<NatsService>(NatsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get NATS URL from config', () => {
    expect(configService.get).toHaveBeenCalledWith('NATS_URL', 'nats://localhost:4222');
  });
});