import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { Logger } from '../shared/utils/logger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger({ service: 'Gateway' });

  try {
    const app = await NestFactory.create(GatewayModule);

    // Configure body parser with increased limit
    const bodyLimit = process.env.BODY_SIZE_LIMIT || '50mb';
    app.use(json({ limit: bodyLimit }));
    app.use(urlencoded({ limit: bodyLimit, extended: true }));

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors();

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