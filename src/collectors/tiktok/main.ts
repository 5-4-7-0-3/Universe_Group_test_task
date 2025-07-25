import { NestFactory } from '@nestjs/core';
import { TiktokCollectorModule } from './tiktok-collector.module';
import { Logger } from '../../shared/utils/logger';

async function bootstrap() {
  const logger = new Logger({ service: 'TiktokCollector' });
  
  try {
    const app = await NestFactory.create(TiktokCollectorModule);
    
    const port = process.env.PORT || 3003;
    await app.listen(port);
    
    logger.info(`Tiktok collector service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start Tiktok collector service', error);
    process.exit(1);
  }
}

bootstrap();