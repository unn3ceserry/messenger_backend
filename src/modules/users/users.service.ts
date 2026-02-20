import type { User } from '@/prisma/generated/prisma';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class UsersService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async searchUser(searchText: string): Promise<User[]> {
    const normalized = searchText.trim();

    const where: any = {
      AND: [
        {
          OR: [
            { username: { contains: normalized, mode: 'insensitive' } },
            { firstName: { contains: normalized, mode: 'insensitive' } },
            { lastName: { contains: normalized, mode: 'insensitive' } },
          ],
        },
      ],
    };

    const users = await this.prismaService.user.findMany({
      where,
      take: 10,
    });
    console.log(searchText, users);
    return users;
  }

  public async blockUser(user: User, id: string): Promise<boolean> {
    const userFind = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!userFind) {
      throw new NotFoundException({ message: 'Пользователь не найден.' });
    }

    if (user.blockedUsers.includes(id)) {
      throw new ConflictException({
        message: 'Пользователь уже заблокирован.',
      });
    }
    if (user.id === id) {
      throw new ConflictException({
        message: 'Вы не можете заблокировать себя.',
      });
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        blockedUsers: [...user.blockedUsers, id],
      },
    });
    return true;
  }

  public async unblockUser(user: User, id: string): Promise<boolean> {
    const userFind = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!userFind) {
      throw new NotFoundException({ message: 'Пользователь не найден.' });
    }
    if (!user.blockedUsers.includes(id)) {
      throw new ConflictException({ message: 'Пользователь не заблокирован.' });
    }
    if (user.id === id) {
      throw new ConflictException({
        message: 'Вы не можете заблокировать себя.',
      });
    }
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        blockedUsers: [...user.blockedUsers.filter((userId) => userId !== id)],
      },
    });
    return true;
  }

  public async isMyContact(user: User, username: string): Promise<boolean> {
    const contact = await this.prismaService.userContacts.findFirst({
      where: {
        username: user.username,
        usernameContact: username,
      },
    });

    return !!contact;
  }
}
