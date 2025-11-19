import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisModule } from './redis/redis.module';
import { AccountModule } from '@/src/modules/auth/account/account.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), RedisModule, AccountModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class CoreModule {}
