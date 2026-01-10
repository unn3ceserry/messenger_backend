import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  AccountService,
  type VisibilityField,
} from '@/src/modules/auth/account/account.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { User, WhoCanSeen } from '@/prisma/generated/prisma';
import { SetPasswordDto } from '@/src/modules/auth/account/dto/set-password.dto';
import { ChangePasswordDto } from '@/src/modules/auth/account/dto/change-password.dto';
import { ChangeEmailDto } from '@/src/modules/auth/account/dto/chnage-email.dto';
import { CompleteAccountDto } from './dto/user-complete.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  public async changePassword(
    @GetUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.accountService.changePassword(user, dto);
  }

  @Delete('/remove-password')
  public async removePassword(
    @GetUser() user: User,
    @Body('password') password: string,
  ) {
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

  @Post('/set-birthday')
  public async setDateBirthdate(
    @GetUser() user: User,
    @Body('date') date: string,
  ) {
    return this.accountService.setDateBirthdate(user, date);
  }

  @Delete('/remove-birthday')
  public async removeDateBirthdate(@GetUser() user: User) {
    return this.accountService.removeDateBirthdate(user);
  }

  @Post('/set-bio')
  public async setBio(@GetUser() user: User, @Body('bio') bio: string) {
    return this.accountService.setBio(user, bio);
  }

  @Delete('/remove-bio')
  public async removeBio(@GetUser() user: User) {
    return this.accountService.removeBio(user);
  }

  @Post('/set-name')
  public async setNames(
    @GetUser() user: User,
    @Body('firstname') firstname: string,
    @Body('lastname') lastname: string,
  ) {
    return this.accountService.setNames(user, firstname, lastname);
  }

  @Patch('/change-username')
  public async updateUsername(
    @GetUser() user: User,
    @Body('username') username: string,
  ) {
    return this.accountService.updateUsername(user, username);
  }

  @Post('/block-user')
  public async blockUser(@GetUser() user: User, @Body('id') id: string) {
    return this.accountService.blockUser(user, id);
  }

  @Post('/unblock-user')
  public async unblockUser(@GetUser() user: User, @Body('id') id: string) {
    return this.accountService.unblockUser(user, id);
  }

  @Post('/set-visibility')
  public async setVisibility(
    @Body('field') field: VisibilityField,
    @GetUser() user: User,
    @Body('whoCanSee') whoCanSee: WhoCanSeen,
  ) {
    return this.accountService.setVisibility(user, field, whoCanSee);
  }

  @Get('/get-user-data')
  public async getUserData(
    @GetUser() user: User,
    @Query('username') username: string,
  ) {
    return this.accountService.getUserData(user, username);
  }

  @Post('/set-complete-data')
  public async setUserCompleteDate(
    @Body() dto: CompleteAccountDto,
    @GetUser() user: User,
  ) {
    return this.accountService.setUserCompleteDate(user, dto);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/feat-avatar')
  public async featAvatar(@GetUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.accountService.featAvatar(user, file)
  }
}
