import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { securityHeaders } from './common/security/security-headers.middleware';
import { sanitizeRequestBody } from './common/security/sanitize.middleware';
import { requestContext } from './common/audit/request-context';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(securityHeaders);
  app.use(sanitizeRequestBody);
  // Per-request context for the audit trail (ip/user-agent; actor added by JwtStrategy).
  app.use((req: Request, _res: Response, next: NextFunction) =>
    requestContext.run(
      { ip: req.ip, userAgent: req.headers['user-agent'] },
      next,
    ),
  );

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('LawMitran API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
