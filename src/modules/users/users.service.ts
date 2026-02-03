import type { User } from '@/prisma/generated/prisma';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

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
}
