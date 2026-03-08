import { Chat, Message, Prisma, User } from '@/prisma/generated/prisma';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

type ChatWithUsers = Prisma.ChatGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
    messages: {
      include: {
        attachments: true;
        chat: true;
      };
    };
  };
}>;

@Injectable()
export class ChatService {
  public constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  public async getDm(user: User, userB: string): Promise<Chat> {
    let chat = await this.prismaService.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: userB } } },
        ],
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            attachments: true,
            chat: true,
          },
        },
      },
    });

    if (!chat) {
      chat = await this.prismaService.chat.create({
        data: {
          isGroup: false,
          members: { create: [{ userId: user.id }, { userId: userB }] },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          messages: {
            include: {
              attachments: true,
              chat: true,
            },
          },
        },
      });
    }

    const newChat = await this.isContactReturnNames(user, chat);
    newChat.members.forEach((usr) => {
      this.chatGateway.server.to(`room:${usr.userId}`).emit('newDm', chat);
    });

    return newChat;
  }

  public async getMyDms(user: User): Promise<Chat[]> {
    const chats = await this.prismaService.chat.findMany({
      where: {
        isGroup: false,
        members: { some: { userId: user.id } },
      },
      include: {
        members: { include: { user: true } },
        messages: {
          include: {
            attachments: true,
            chat: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
    const result = await Promise.all(
      chats.map(async (chat) => {
        return await this.isContactReturnNames(user, chat);
      }),
    );

    return result;
  }

  public async getMessages(chatId: string, userId: string) {
    await this.isMember(chatId, userId);

    return this.prismaService.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true, attachments: true },
    });
  }

  public async createMessage(
    chatId: string,
    senderId: string,
    text: string,
  ): Promise<Message> {
    await this.isMember(chatId, senderId);

    return this.prismaService.message.create({
      data: { chatId, senderId, text },
      include: { sender: true },
    });
  }

  public async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (message.senderId !== userId)
      throw new ForbiddenException({
        message: 'Вы не являетесь отправителем.',
      });

    return this.prismaService.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  public async editMessage(
    messageId: string,
    userId: string,
    newText: string,
  ): Promise<Message> {
    const message = await this.prismaService.message.findUnique({
      where: { id: messageId },
    });
    if (!message)
      throw new ForbiddenException({ message: 'Сообщение не найдено.' });
    if (message.senderId !== userId)
      throw new ForbiddenException({
        message: 'Вы не являетесь отправителем.',
      });

    return this.prismaService.message.update({
      where: { id: messageId },
      data: { text: newText, editedAt: new Date() },
    });
  }
  public async deleteChat(user: User, chatId: string) {
    await this.isMember(chatId, user.id);

    const chatWithMembers = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      include: { members: { include: { user: true } } },
    });

    if (!chatWithMembers)
      throw new NotFoundException({ message: 'Чат не найден.' });

    await this.prismaService.message.deleteMany({ where: { chatId } });
    await this.prismaService.chatMember.deleteMany({ where: { chatId } });

    await this.prismaService.chat.delete({ where: { id: chatId } });

    chatWithMembers.members.forEach((m) => {
      this.chatGateway.server
        .to(`room:${m.user.id}`)
        .emit('chatDeleted', chatId);
    });

    return true;
  }

  public async setMessagesIsRead(
    userId: string,
    chatId: string,
    messageIds: Array<string>,
  ) {
    await this.isMember(chatId, userId);
    const messages = await Promise.all(
      messageIds.map((messageId) => this.getMessage(messageId)),
    );

    for (const message of messages) {
      if (message.sender.id !== userId) {
        await this.prismaService.message.update({
          where: { id: message.id },
          data: { isRead: true },
        });
      }
    }
  }

  // HELPERS

  public async getMessage(messageId: string) {
    const message = await this.prismaService.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        chat: true,
        sender: true,
      },
    });
    if (!message) {
      throw new NotFoundException({ message: 'Сообщение не найдено' });
    }
    return message;
  }

  public getUserChats = async (id: string) => {
    const chats = await this.prismaService.chat.findMany({
      where: { members: { some: { userId: id } } },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            chat: true,
            sender: true,
          },
        },
      },
    });

    if (!chats) throw new NotFoundException({ message: 'Чаты не найдены.' });

    return chats;
  };

  public isContactReturnNames = async (user: User, chat: ChatWithUsers) => {
    const otherMember = chat.members.find((m) => m.userId !== user.id);
    if (!otherMember) return chat;

    const contact = await this.prismaService.userContacts.findFirst({
      where: {
        username: user.username,
        usernameContact: otherMember.user.username,
      },
    });

    if (contact) {
      otherMember.user.firstName = contact.firstNameContact;
      otherMember.user.lastName = contact.lastNameContact;
    }

    return chat;
  };

  public async getOnlineStatus(chatId: string): Promise<
    {
      userId: string;
      isOnline: boolean;
      lastSeen: Date | null;
    }[]
  > {
    const members = await this.prismaService.chatMember.findMany({
      where: { chatId },
      include: { user: true },
    });

    return members.map((m) => ({
      userId: m.userId,
      isOnline: m.user.isOnline,
      lastSeen: m.user.lastSeen,
    }));
  }

  public async setOnline(userId: string, online: boolean) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isOnline: online,
        lastSeen: online ? null : new Date(),
      },
    });
  }

  public async isMember(chatId: string, userId: string): Promise<boolean> {
    return !!(await this.prismaService.chatMember.findFirst({
      where: { chatId, userId },
    }));
  }
}
