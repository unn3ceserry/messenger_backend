import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisModule } from './redis/redis.module';
import { AccountModule } from '@/src/modules/auth/account/account.module';
import { SessionModule } from '@/src/modules/auth/session/session.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RedisModule, SessionModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class CoreModule {
}
