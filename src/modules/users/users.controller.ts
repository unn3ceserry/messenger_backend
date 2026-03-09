import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TypeUserData, UsersService } from './users.service';
import type { User } from '@/prisma/generated/prisma';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  public async searchUser(
    @Query('searchText') searchText: string,
  ): Promise<Array<User>> {
    return this.usersService.searchUser(searchText);
  }

  @Post('/block')
  public async blockUser(
    @GetUser() user: User,
    @Body('id') id: string,
  ): Promise<boolean> {
    return this.usersService.blockUser(user, id);
  }

  @Post('/unblock')
  public async unblockUser(
    @GetUser() user: User,
    @Body('id') id: string,
  ): Promise<boolean> {
    return this.usersService.unblockUser(user, id);
  }

  @Get('/contact')
  public async isMyContact(
    @GetUser() user: User,
    @Query('username') username: string,
  ): Promise<boolean> {
    return this.usersService.isContact(user, username);
  }

  @Get('/user')
  public async getUserData(
    @GetUser() user: User,
    @Query('id') id?: string,
    @Query('username') username?: string,
  ): Promise<TypeUserData> {
    return this.usersService.getUserData(user, id, username);
  }
}
