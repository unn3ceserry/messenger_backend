import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUser } from '@/src/shared/decorators/get-user.decorator';
import type { Chat, Message, User } from '@/prisma/generated/prisma';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('/get/dm')
  public async getDm(
    @GetUser() user: User,
    @Query('userId') userId: string,
  ): Promise<Chat> {
    return this.chatService.getDm(user, userId);
  }

  @Get('/get/my-dms')
  public async getMyDms(@GetUser() user: User): Promise<Array<Chat>> {
    return this.chatService.getMyDms(user);
  }

  @Get('/get/messages')
  public async getMessages(
    @GetUser() user: User,
    @Query('chatId') chatId: string,
  ): Promise<Array<Message>> {
    return this.chatService.getMessages(chatId, user.id);
  }

  @Delete('/delete')
  public async deleteChat(
    @GetUser() user: User,
    @Body('chatId') chatId: string,
  ): Promise<boolean> {
    return this.chatService.deleteChat(user, chatId);
  }
}
