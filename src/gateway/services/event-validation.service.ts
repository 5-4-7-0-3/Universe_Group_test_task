import { Injectable, BadRequestException } from '@nestjs/common';
import { EventSchema } from '../../shared/schemas/event.schema';
import { Event } from '../../shared/types/events';
import { Logger } from '../../shared/utils/logger';

@Injectable()
export class EventValidationService {
  private readonly logger = new Logger({ service: 'EventValidationService' });

  validateEvent(data: any): Event {
    try {
      const validatedEvent = EventSchema.parse(data);
      this.logger.debug('Event validation successful', { eventId: validatedEvent.eventId });
      return validatedEvent;
    } catch (error) {
      this.logger.error('Event validation failed', error, { data });
      throw new BadRequestException('Invalid event data', error.message);
    }
  }
}