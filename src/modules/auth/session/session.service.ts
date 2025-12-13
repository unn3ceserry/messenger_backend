import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginAccountDto } from '@/src/modules/auth/session/dto/login-account.dto';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { User } from '@/prisma/generated/prisma';
import { verify } from 'argon2';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';
import { AccountService } from '@/src/modules/auth/account/account.service';
import { getSessionMetadata } from '@/src/shared/utils/session-metadata';
import { RedisService } from '@/src/core/redis/redis.service';
import type { Request } from 'express';

@Injectable()
export class SessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountService: AccountService,
    private readonly redisService: RedisService,
  ) {}

  public async login(dto: LoginAccountDto, req: Request, userAgent: string) {
    const { number, cloudPassword, code } = dto;
    const user = await this.existUser(number);

    await this.accountService.verifyOtpCode(number, code);

    if (user.cloudPassword) {
      if (!cloudPassword) {
        throw new NotFoundException({
          message: 'Введите облачный пароль.',
          type: 'NON_PASSWORD',
        });
      }
      const isValidPassword = await verify(user.cloudPassword, cloudPassword);
      if (!isValidPassword) {
        throw new UnauthorizedException('Неверный облачный пароль.');
      }
    }
    const codes = await this.prismaService.codes.findMany({
      where: { number },
    });
    if (codes) {
      await this.prismaService.codes.deleteMany({
        where: { number },
      });
    }

    const metadata = getSessionMetadata(req, userAgent);
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;
      req.session.createdAt = new Date();
      req.session.metadata = metadata;

      req.session.save((err) => {
        if (err) {
          console.log(err);
          return reject(new InternalServerErrorException(err));
        }

        resolve(user);
      });
    });
  }

  public async register(
    dto: CreateAccountDto,
    req: Request,
    userAgent: string,
  ) {
    try {
      const user = await this.accountService.createAccount(dto);

      const metadata = getSessionMetadata(req, userAgent);
      const codes = await this.prismaService.codes.findMany({
        where: { number: dto.number },
      });
      if (codes) {
        await this.prismaService.codes.deleteMany({
          where: { number: dto.number },
        });
      }
      return new Promise((resolve, reject) => {
        req.session.userId = user.id;
        req.session.createdAt = new Date();
        req.session.metadata = metadata;

        req.session.save((err) => {
          if (err) {
            return reject(
              new InternalServerErrorException('Не удалось сохранить сессию.'),
            );
          }
          resolve(user);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  public async logout(req: Request) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Не удалось завершить сессию.'),
          );
        }
        req.res?.clearCookie('session');
        resolve(true);
      });
    });
  }

  public async findByUser(req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new NotFoundException('Пользователь не обнаружен в сессии.');
    }

    const keys = await this.redisService.keys('session:*');

    const userSessions: Array<{
      id: string;
      userId: string;
      createdAt: Date;
      cookie?: any;
    }> = [];

    for (const key of keys) {
      const sessionData = await this.redisService.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);

        if (session && session.userId === userId) {
          userSessions.push({
            ...session,
            id: key.split(':')[1] || key,
          });
        }
      }
    }

    userSessions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return userSessions.filter((session) => session.id !== req.session.id);
  }

  public async findCurrent(req: Request) {
    const sessionId = req.session.id;
    const sessionData = await this.redisService.get(`session:${sessionId}`);
    if (!sessionData) {
      throw new NotFoundException('Сессия не найдена.');
    }
    const session = JSON.parse(sessionData);
    return {
      ...session,
      id: session.id,
    };
  }

  public async clearCookie(req: Request) {
    req.res?.clearCookie('session');
    return true;
  }

  public async remove(req: Request, id: string) {
    if (req.session.id === id) {
      throw new ConflictException('Текущую сессию удалить нельзя.');
    }

    await this.redisService.del(`session:${id}`);
    return true;
  }

  public async removeAll(req: Request) {
    const keys = await this.redisService.keys('session:*');
    const userId = req.session.userId;
    const userSessions: Array<{
      id: string;
      userId: string;
      createdAt: Date;
      cookie?: any;
    }> = [];

    for (const key of keys) {
      const sessionData = await this.redisService.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);

        if (session && session.userId === userId) {
          userSessions.push({
            ...session,
            id: key.split(':')[1] || key,
          });
        }
      }
    }

    userSessions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    for (let key of userSessions) {
      if (req.session.id === key.id) continue;
      await this.redisService.del(`session:${key.id}`);
    }
    return true;
  }

  public async sendOtpToMobile(number: string) {
    const codes = await this.prismaService.codes.findMany({
      where: { number },
    });
    if (codes) {
      await this.prismaService.codes.deleteMany({
        where: { number },
      });
    }
    return this.accountService.sendOtpToMobile(number);
  }

  // HELPERS

  public async existUser(number: string): Promise<User> {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ number: { equals: number } }],
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Пользователя с такими данными не существует.',
      );
    }
    return user;
  }
}
