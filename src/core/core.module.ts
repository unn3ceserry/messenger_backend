import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), RedisModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class CoreModule {}
