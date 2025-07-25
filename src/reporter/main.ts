import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ReporterModule } from './reporter.module';
import { Logger } from '../shared/utils/logger';

async function bootstrap() {
  const logger = new Logger({ service: 'Reporter' });
  
  try {
    const app = await NestFactory.create(ReporterModule);
    
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors();

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Reporter API')
      .setDescription('API for generating reports')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3004;
    await app.listen(port);
    
    logger.info(`Reporter service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start reporter service', error);
    process.exit(1);
  }
}

bootstrap();