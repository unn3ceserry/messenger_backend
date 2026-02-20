import type { User } from '@/prisma/generated/prisma';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  public async getUserData(user: User, id?: string, username?: string) {
    if (!id && !username) {
      throw new BadRequestException({ message: 'Введите айди пользователя.' });
    }
    if (user.username === username || user.id === id) {
      throw new ForbiddenException({
        message: 'Вы не можете получить свои данные.',
      });
    }
    const whereClause = id ? { id } : { username };
    const userFind = await this.prismaService.user.findUnique({
      where: whereClause,
      select: {
        id: true,
        username: true,
        phoneVisible: true,
        emailVisible: true,
        bioVisible: true,
        avatarsVisible: true,
        birthdayVisible: true,
        firstName: true,
        lastName: true,
        number: true,
        email: true,
        isOnline: true,
        lastSeen: true,
        bio: true,
        avatars: true,
        birthday: true,
        contacts: { select: { usernameContact: true } },
      },
    });

    if (!userFind) return null;

    const contact = await this.prismaService.userContacts.findFirst({
      where: {
        username: user.username,
        usernameContact: userFind.username,
      },
    });
    const isContact = !!contact;

    const result: Partial<User> = {
      id: userFind.id,
      username: userFind.username,
      firstName: isContact ? contact.firstNameContact : userFind.firstName,
      lastName: isContact ? contact.lastNameContact : userFind.lastName,
      isOnline: userFind.isOnline,
      lastSeen: userFind.lastSeen,
    };

    if (
      userFind.phoneVisible === 'ALL' ||
      (userFind.phoneVisible === 'CONTACTS' && isContact) ||
      (userFind.phoneVisible === 'I' && userFind.id === user.id)
    ) {
      result.number = userFind.number;
    }

    if (
      userFind.emailVisible === 'ALL' ||
      (userFind.emailVisible === 'CONTACTS' && isContact) ||
      (userFind.emailVisible === 'I' && userFind.id === user.id)
    ) {
      result.email = userFind.email;
    }

    if (
      userFind.bioVisible === 'ALL' ||
      (userFind.bioVisible === 'CONTACTS' && isContact) ||
      (userFind.bioVisible === 'I' && userFind.id === user.id)
    ) {
      result.bio = userFind.bio;
    }

    if (
      userFind.avatarsVisible === 'ALL' ||
      (userFind.avatarsVisible === 'CONTACTS' && isContact) ||
      (userFind.avatarsVisible === 'I' && userFind.id === user.id)
    ) {
      result.avatars = userFind.avatars;
    }

    if (
      userFind.birthdayVisible === 'ALL' ||
      (userFind.birthdayVisible === 'CONTACTS' && isContact) ||
      (userFind.birthdayVisible === 'I' && userFind.id === user.id)
    ) {
      result.birthday = userFind.birthday;
    }

    return result;
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
