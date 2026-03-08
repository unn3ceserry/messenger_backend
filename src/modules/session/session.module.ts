import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { AccountModule } from '@/src/modules/account/account.module';
import { RedisService } from '@/src/core/redis/redis.service';

@Module({
  controllers: [SessionController],
  providers: [SessionService, PrismaService, RedisService],
  imports: [AccountModule]
})
export class SessionModule {}
