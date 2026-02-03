import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search/user')
  public async searchUser(@Query('searchText') searchText: string) {
    return this.usersService.searchUser(searchText)
  }
}
