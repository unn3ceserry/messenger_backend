import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { User } from '@/prisma/generated/prisma';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('/get/dm')
  public async getDm(@GetUser() user: User, @Query('userId') userId: string) {
    return this.chatService.getDm(user.id, userId);
  }

  @Get('/get/my-dms')
  public async getMyDms(@GetUser() user: User) {
    return this.chatService.getMyDms(user);
  }
}
