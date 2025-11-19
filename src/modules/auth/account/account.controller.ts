import { Body, Controller, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('/create')
  public async createAccount(@Body() dto: CreateAccountDto) {
    return this.accountService.createAccount(dto);
  }
}
