import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { PrismaService } from '@/src/core/prisma/prisma.service';

@Module({
  providers: [ChatGateway, ChatService, PrismaService],
  controllers: [ChatController],
})
export class ChatModule {}
