import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prismaService: PrismaService) {
  }

  public async createAccount(dto: CreateAccountDto): Promise<CreateAccountDto> {
    const { lastName, firstName, username, number } = dto;
    await this.existUser(username, number);
    await this.prismaService.user.create(({
      data: {
        username,
        firstName,
        lastName,
        number,
      },
    }));

    return { lastName, firstName, username, number };
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
