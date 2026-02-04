import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisModule } from './redis/redis.module';
import { SessionModule } from '@/src/modules/auth/session/session.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@/src/shared/guards/auth.guard';
import { AccountModule } from '@/src/modules/auth/account/account.module';
import { ContactsModule } from '@/src/modules/contacts/contacts.module';
import { ChatModule } from '../modules/chat/chat.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    SessionModule,
    AccountModule,
    ContactsModule,
    ChatModule,
    UsersModule
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [PrismaService],
})
export class CoreModule {}
