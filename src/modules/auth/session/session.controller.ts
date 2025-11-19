import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SessionService } from './session.service';
import { LoginAccountDto } from '@/src/modules/auth/session/dto/login-account.dto';
import type { Request } from 'express';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/login')
  public async login(@Body() dto: LoginAccountDto, @Req() req: Request) {
    return this.sessionService.login(dto, req);
  }

  @Post('/register')
  public async register(@Body() dto: CreateAccountDto, @Req() req: Request) {
    return this.sessionService.register(dto, req);
  }

  @Get('/logout')
  public async logout(@Req() req: Request) {
    return this.sessionService.logout(req);
  }
}
