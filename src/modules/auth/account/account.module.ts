import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { AccountController } from '@/src/modules/auth/account/account.controller';
import { FilesModule } from '../../files/files.module';

@Module({
  providers: [AccountService, PrismaService],
  controllers: [AccountController],
  exports: [AccountService],
  imports: [FilesModule]
})
export class AccountModule {}
