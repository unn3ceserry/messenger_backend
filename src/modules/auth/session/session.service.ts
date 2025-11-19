import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginAccountDto } from '@/src/modules/auth/session/dto/login-account.dto';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { User } from '@/prisma/generated/prisma';
import { verify } from 'argon2';
import type { Request } from 'express';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';
import { AccountService } from '@/src/modules/auth/account/account.service';

@Injectable()
export class SessionService {

  constructor(private readonly prismaService: PrismaService, private readonly accountService: AccountService) {}

  public async login(dto: LoginAccountDto, req: Request) {
    const {number, cloudPassword} = dto;
    const user = await this.existUser(number);

    if(user.cloudPassword) {
      if(!cloudPassword) {
        throw new NotFoundException('Введите облачный пароль.');
      }
      const isValidPassword = await verify(user.cloudPassword, cloudPassword);
      if(!isValidPassword) {
        throw new UnauthorizedException('Неверный облачный пароль.');
      }
    }

    return new Promise((resolve, reject) => {
      req.session.userId = user.id;
      req.session.createdAt = new Date();

      req.session.save((err) => {
        if (err) {
          console.log(err);
          return reject(new InternalServerErrorException(err));
        }

        resolve(user);
      })
    })
  }

  public async register(dto: CreateAccountDto, req: Request) {
    const user = await this.accountService.createAccount(dto);

    return new Promise((resolve, reject) => {
      req.session.userId = user.id;
      req.session.createdAt = new Date();

      req.session.save((err) => {
        if (err) {
          return reject(new InternalServerErrorException('Не удалось сохранить сессию.'));
        }
        resolve(user);
      });

    })
  }

  public async logout(req: Request) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(new InternalServerErrorException('Не удалось завершить сессию.'));
        }
        req.res?.clearCookie('session')
        resolve(true);
      })
    })
  }

  // HELPERS

  public async existUser(number: string): Promise<User> {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { number: { equals: number } },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователя с такими данными не существует.');
    }
    return user;
  }
}
