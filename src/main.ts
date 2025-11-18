import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { RedisService } from '@/src/core/redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);
  const config = app.get(ConfigService);
  const redis = app.get(RedisService);
  app.setGlobalPrefix('/api/v1/');
  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(
    session({
      name: 'session',
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: config.getOrThrow<string>('DOMAIN'),
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      },
      store: new RedisStore({
        client: redis,
        prefix: 'sessions:',
      }),
    }),
  );
  app.enableCors({
    origin: [config.getOrThrow<string>('CLIENT_URL')],
  });
  await app.listen(config.getOrThrow<string>('APPLICATION_PORT'));
}
bootstrap();
