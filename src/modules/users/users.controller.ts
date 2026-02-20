import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import type { User } from '@/prisma/generated/prisma';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search/user')
  public async searchUser(@Query('searchText') searchText: string) {
    return this.usersService.searchUser(searchText);
  }

  @Post('/block-user')
  public async blockUser(@GetUser() user: User, @Body('id') id: string) {
    return this.usersService.blockUser(user, id);
  }

  @Post('/unblock-user')
  public async unblockUser(@GetUser() user: User, @Body('id') id: string) {
    return this.usersService.unblockUser(user, id);
  }

  @Get('/is-my-contact')
  public async isMyContact(
    @GetUser() user: User,
    @Query('username') username: string,
  ) {
    return this.usersService.isMyContact(user, username);
  }
}
