import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Validation pipe for DTOs
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('DeepFinance API')
    .setDescription('Deep-Stack Financial Management Module API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('accounts', 'Chart of Accounts management')
    .addTag('journals', 'General Ledger & Journal entries')
    .addTag('contacts', 'Customer & Supplier management')
    .addTag('invoices', 'Accounts Receivable')
    .addTag('bills', 'Accounts Payable')
    .addTag('bank', 'Bank reconciliation & banking')
    .addTag('tax', 'VAT & tax management')
    .addTag('reports', 'Financial reporting')
    .addTag('entities', 'Entity management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`DeepFinance API running on port ${port}`);
  console.log(`API docs: http://localhost:${port}/api/docs`);
}

bootstrap();
