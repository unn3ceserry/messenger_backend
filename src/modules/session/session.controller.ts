import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { SessionService } from './session.service';
import type { Request } from 'express';
import { CreateAccountDto } from '@/src/modules/account/dto/create-account.dto';
import { Public } from '@/src/shared/decorators/public.decorator';
import { UserAgent } from '@/src/shared/decorators/user-agent.decorator';
import { LoginAccountDto } from './dto/login-account.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Public()
  @Post('/login')
  public async login(@Body() dto: LoginAccountDto, @Req() req: Request, @UserAgent() agent: string) {
    return this.sessionService.login(dto, req, agent);
  }

  @Public()
  @Post('/register')
  public async register(@Body() dto: CreateAccountDto, @Req() req: Request, @UserAgent() agent: string) {
    return this.sessionService.register(dto, req, agent);
  }

  @Get('/logout')
  public async logout(@Req() req: Request) {
    return this.sessionService.logout(req);
  }

  @Get('/get/all')
  public async findByUser(@Req() req: Request) {
    return this.sessionService.findByUser(req);
  }

  @Get('/get/current')
  public async findCurrent(@Req() req: Request) {
    return this.sessionService.findCurrent(req);
  }

  @Delete('/remove')
  public async remove(@Req() req: Request, @Body('id') id: string) {
    return this.sessionService.remove(req, id);
  }

  @Delete('/clear/all')
  public async removeAll(@Req() req: Request) {
    return this.sessionService.removeAll(req);
  }

  @Get('/coockie/clear')
  public async clearCookie(@Req() req: Request) {
    return this.sessionService.clearCookie(req);
  }

  @Public()
  @Post('/resend/code')
  public async resendCode(@Body('number') number: string) {
    return this.sessionService.sendOtpToMobile(number);
  }
}
