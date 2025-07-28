import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { Logger } from '../shared/utils/logger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger({ service: 'Gateway' });

  try {
    const app = await NestFactory.create(GatewayModule, {
      bodyParser: false, // Disable default body parser
    });

    // Configure body parser with increased limit
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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