import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket, Server } from 'socket.io';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: { origin: '*' } },
  transports: ['websocket'],
  namespace: 'chat',
})
export class ChatGateway {
  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}
  @WebSocketServer() server: Server;

  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.auth.userId;
    if (!userId) return client.disconnect();

    await this.chatService.setOnline(userId, true);
    client.join(`room:${userId}`);
    this.server.emit('userOnline', { userId });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.auth.userId;
    if (!userId) return client.disconnect();

    await this.chatService.setOnline(userId, false);
    this.server.emit('userOffline', {
      userId,
      lastSeen: new Date(),
    });
  }

  @SubscribeMessage('joinChat')
  public async joinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    if (!userId) return client.disconnect();

    const isMember = await this.chatService.isMember(data.chatId, userId);

    if (!isMember) {
      return client.emit('error', 'Нет доступа к чату.');
    }

    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: { chatId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    const message = await this.chatService.createMessage(
      data.chatId,
      userId,
      data.text,
    );
    this.server.to(`chat:${data.chatId}`).emit('message:created', message);
  }

  @SubscribeMessage('editMessage')
  async editMessage(
    @MessageBody() data: { messageId: string; newText: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    const message = await this.chatService.editMessage(
      data.messageId,
      userId,
      data.newText,
    );
    this.server.to(`chat:${message.chatId}`).emit('message:edited', message);
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    const message = await this.chatService.deleteMessage(
      data.messageId,
      userId,
    );
    this.server.to(`chat:${message.chatId}`).emit('message:deleted', message.id);
  }

}
