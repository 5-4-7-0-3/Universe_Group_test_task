import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GatewayService } from './gateway.service';
import { EventValidationService } from './services/event-validation.service';
import { Logger, CorrelationIdGenerator } from '../shared/utils/logger';

@ApiTags('gateway')
@Controller('events')
export class GatewayController {
  private readonly logger = new Logger({ service: 'GatewayController' });

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly eventValidationService: EventValidationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Receive webhook events' })
  @ApiResponse({ status: 200, description: 'Event processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async receiveEvent(@Body() eventData: any) {
    const correlationId = CorrelationIdGenerator.generate();
    const contextLogger = this.logger.withCorrelationId(correlationId);

    try {
      contextLogger.info('Received webhook event', { eventData });

      const validatedEvent = this.eventValidationService.validateEvent(eventData);
      await this.gatewayService.processEvent(validatedEvent);

      return { status: 'success', message: 'Event processed successfully' };
    } catch (error) {
      contextLogger.error('Failed to process webhook event', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}