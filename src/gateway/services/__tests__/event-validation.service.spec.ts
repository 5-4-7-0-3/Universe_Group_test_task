import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventValidationService } from '../event-validation.service';

describe('EventValidationService', () => {
  let service: EventValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventValidationService],
    }).compile();

    service = module.get<EventValidationService>(EventValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate valid Facebook event', () => {
    const validEvent = {
      eventId: 'fb_123',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'facebook',
      funnelStage: 'top',
      eventType: 'ad.view',
      data: {
        user: {
          userId: 'user_123',
          name: 'John Doe',
          age: 25,
          gender: 'male',
          location: {
            country: 'US',
            city: 'New York'
          }
        },
        engagement: {
          actionTime: '2024-01-01T00:00:00Z',
          referrer: 'newsfeed',
          videoId: null
        }
      }
    };

    expect(() => service.validateEvent(validEvent)).not.toThrow();
  });

  it('should throw BadRequestException for invalid event', () => {
    const invalidEvent = {
      eventId: 'invalid_123',
      // Missing required fields
    };

    expect(() => service.validateEvent(invalidEvent)).toThrow(BadRequestException);
  });

  it('should validate valid TikTok event', () => {
    const validEvent = {
      eventId: 'tt_123',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'tiktok',
      funnelStage: 'bottom',
      eventType: 'purchase',
      data: {
        user: {
          userId: 'user_456',
          username: 'johndoe',
          followers: 1000
        },
        engagement: {
          actionTime: '2024-01-01T00:00:00Z',
          profileId: 'profile_123',
          purchasedItem: 'Product A',
          purchaseAmount: '29.99'
        }
      }
    };

    expect(() => service.validateEvent(validEvent)).not.toThrow();
  });
});