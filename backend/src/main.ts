import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Set up global validation pipe for nestjs-zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Set up Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Online Learning Platform API')
    .setDescription('The API description for the learning platform')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
