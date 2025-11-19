import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { AccountController } from '@/src/modules/auth/account/account.controller';

@Module({
  providers: [AccountService, PrismaService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
