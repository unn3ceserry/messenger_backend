import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SessionService } from './session.service';
import { LoginAccountDto } from '@/src/modules/auth/session/dto/login-account.dto';
import type { Request } from 'express';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';
import { Public } from '@/src/shared/decorators/public.decorator';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Public()
  @Post('/login')
  public async login(@Body() dto: LoginAccountDto, @Req() req: Request) {
    return this.sessionService.login(dto, req);
  }

  @Public()
  @Post('/register')
  public async register(@Body() dto: CreateAccountDto, @Req() req: Request) {
    return this.sessionService.register(dto, req);
  }

  @Get('/logout')
  public async logout(@Req() req: Request) {
    return this.sessionService.logout(req);
  }
}
