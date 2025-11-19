import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisModule } from './redis/redis.module';
import { AccountModule } from '@/src/modules/auth/account/account.module';
import { SessionModule } from '@/src/modules/auth/session/session.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@/src/shared/guards/auth.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RedisModule, SessionModule],
  providers: [PrismaService, {
    provide: APP_GUARD,
    useClass: AuthGuard,
  }],
  exports: [PrismaService],
})
export class CoreModule {
}
