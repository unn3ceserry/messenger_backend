import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { AccountService } from '@/src/modules/auth/account/account.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { User } from '@/prisma/generated/prisma';
import { SetPasswordDto } from '@/src/modules/auth/account/dto/set-password.dto';
import { ChangePasswordDto } from '@/src/modules/auth/account/dto/change-password.dto';
import { ChangeEmailDto } from '@/src/modules/auth/account/dto/chnage-email.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('/me')
  public async getMe(@GetUser() user: User) {
    return this.accountService.getMe(user);
  }

  @Post('/set-password')
  public async setPassword(@GetUser() user: User, @Body() dto: SetPasswordDto) {
    return this.accountService.setPassword(user, dto);
  }

  @Patch('/change-password')
  public async changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.accountService.changePassword(user, dto);
  }

  @Delete('/remove-password')
  public async removePassword(@GetUser() user: User, @Body('password') password: string ) {
    return this.accountService.removePassword(user, password);
  }

  @Post('/set-email')
  public async addEmail(@GetUser() user: User, @Body('email') email: string) {
    return this.accountService.addEmail(user, email);
  }

  @Patch('/update-email')
  public async updateEmail(@GetUser() user: User, @Body() dto: ChangeEmailDto) {
    return this.accountService.updateEmail(user, dto);
  }
}
