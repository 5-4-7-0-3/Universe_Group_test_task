import { NestFactory } from '@nestjs/core';
import { FacebookCollectorModule } from './facebook-collector.module';
import { Logger } from '../../shared/utils/logger';

async function bootstrap() {
  const logger = new Logger({ service: 'FacebookCollector' });
  
  try {
    const app = await NestFactory.create(FacebookCollectorModule);
    
    const port = process.env.PORT || 3002;
    await app.listen(port);
    
    logger.info(`Facebook collector service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start Facebook collector service', error);
    process.exit(1);
  }
}

bootstrap();