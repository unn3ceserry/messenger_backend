import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountModule } from './account/account.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [AccountModule],
})
export class AuthModule {}
