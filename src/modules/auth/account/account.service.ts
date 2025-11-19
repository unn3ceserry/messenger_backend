import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';
import { User } from '@/prisma/generated/prisma';

@Injectable()
export class AccountService {
  constructor(private readonly prismaService: PrismaService) {
  }

  public async createAccount(dto: CreateAccountDto): Promise<User> {
    const { lastName, firstName, username, number } = dto;
    await this.existUser(username, number);
    const user = await this.prismaService.user.create(({
      data: {
        username,
        firstName,
        lastName,
        number,
      },
    }));

    return user;
  }

  public async getMe(user: User): Promise<User> {
    const foundUser = await this.prismaService.user.findUnique(({
      where: { id: user.id },
    }));
    if (!foundUser) {
      throw new UnauthorizedException('Пользователь не авторизирован.');
    }
    return foundUser;
  }

  // HELPERS

  public async existUser(username: string, number: string): Promise<boolean> {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { username: { equals: username } },
          { number: { equals: number } },
        ],
      },
    });

    if (user) {
      throw new ConflictException('Пользователь с такими данными уже существует.');
    }
    return true;
  }
}
