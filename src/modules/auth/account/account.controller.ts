import { Controller, Get} from '@nestjs/common';
import { AccountService } from '@/src/modules/auth/account/account.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { User } from '@/prisma/generated/prisma';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('/me')
  public async getMe(@GetUser() user: User) {
    return this.accountService.getMe(user);
  }


}
