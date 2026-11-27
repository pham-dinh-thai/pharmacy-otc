import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DomainExceptionFilter } from './shared/domain/exceptions/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.useSecurityHeaders({
    contentSecurityPolicy: {
      directives: {
        'form-action': [
          "'self'",
          'https://pay-sandbox.sepay.vn',
          'https://pay.sepay.vn',
        ],
      },
    },
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());

  await app.listen(3000);
}
void bootstrap();
