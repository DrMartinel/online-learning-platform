import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, patchNestJsSwagger } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Set up global validation pipe for nestjs-zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Patch Swagger to support nestjs-zod DTOs
  patchNestJsSwagger();

  // Base Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Online Learning Platform API')
    .setDescription('The API description for the learning platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Split into Public and Admin documents
  const publicDocument = JSON.parse(JSON.stringify(document));
  const adminDocument = JSON.parse(JSON.stringify(document));

  for (const path in publicDocument.paths) {
    if (path.startsWith('/admin')) {
      delete publicDocument.paths[path];
    }
  }

  for (const path in adminDocument.paths) {
    if (!path.startsWith('/admin')) {
      delete adminDocument.paths[path];
    }
  }

  // Setup Public Swagger
  SwaggerModule.setup('docs', app, publicDocument);

  // Setup Admin Swagger
  SwaggerModule.setup('admin/docs', app, adminDocument);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
