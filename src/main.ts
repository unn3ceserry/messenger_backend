import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import {createClient} from "redis"

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);
  const config = app.get(ConfigService);
  let redisClient = createClient({
    url: config.getOrThrow<string>('REDIS_URI')
  })
  redisClient.connect().catch(console.error)
  let redisStore = new RedisStore({
    client: redisClient,
    prefix: "session:",
  })
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
        secure: config.getOrThrow<string>('NODE_ENV') === 'prod',
        sameSite: 'lax',
      },
      store: redisStore
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.listen(config.getOrThrow<string>('APPLICATION_PORT'));
}
bootstrap();
