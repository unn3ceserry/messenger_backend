import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { AccountModule } from '@/src/modules/auth/account/account.module';

@Module({
  controllers: [SessionController],
  providers: [SessionService, PrismaService],
  imports: [AccountModule]
})
export class SessionModule {}
