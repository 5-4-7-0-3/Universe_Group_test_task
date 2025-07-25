import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { Logger } from '../shared/utils/logger';

async function bootstrap() {
  const logger = new Logger({ service: 'Gateway' });
  
  try {
    const app = await NestFactory.create(GatewayModule);
    
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors();

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Event Gateway API')
      .setDescription('API for receiving webhook events')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    logger.info(`Gateway service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start gateway service', error);
    process.exit(1);
  }
}

bootstrap();