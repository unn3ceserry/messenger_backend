import {
  BadRequestException,
  ConflictException,
  Injectable, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';
import { User } from '@/prisma/generated/prisma';
import { Twilio } from 'twilio';
import { SetPasswordDto } from '@/src/modules/auth/account/dto/set-password.dto';
import { hash, verify } from 'argon2';
import { ChangePasswordDto } from '@/src/modules/auth/account/dto/change-password.dto';
import { ChangeEmailDto } from '@/src/modules/auth/account/dto/chnage-email.dto';

@Injectable()
export class AccountService {
  private readonly twilioClient: Twilio;

  constructor(private readonly prismaService: PrismaService) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  public async createAccount(dto: CreateAccountDto): Promise<User> {
    const { lastName, firstName, username, number, code } = dto;
    await this.verifyOtpCode(number, code);
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

  public async setPassword(user: User, dto: SetPasswordDto): Promise<boolean> {
    if (user.cloudPassword) {
      throw new ConflictException('Вы уже используете пароль.');
    }
    const { password, confirmPassword } = dto;
    if(password !== confirmPassword) {
      throw new ConflictException('Пароль отличается от первого.');
    }
    const hashPassword = await hash(password);
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        cloudPassword: hashPassword,
      }
    })
    return true;
  };

  public async changePassword(user: User, dto: ChangePasswordDto): Promise<boolean> {
    if (!user.cloudPassword) {
      throw new ConflictException('Вы не используете пароль.');
    }
    const { password, newPassword } = dto;
    const verifyPassword = await verify(user.cloudPassword, password);
    if(!verifyPassword) {
      throw new ConflictException('Неверный пароль.');
    }
    const hashPassword = await hash(newPassword);
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        cloudPassword: hashPassword,
      }
    })
    return true;
  };

  public async removePassword(user: User, password: string): Promise<boolean> {
    if (!user.cloudPassword) {
      throw new ConflictException('Вы не используете пароль.');
    }
    const verifyPassword = await verify(user.cloudPassword, password);
    if(!verifyPassword) {
      throw new ConflictException('Неверный пароль.');
    }
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        cloudPassword: null,
      }
    })
    return true;
  };

  public async addEmail(user: User, email: string): Promise<boolean> {
    if(user.email) {
      throw new ConflictException('К аккаунту уже привязана почта.')
    }
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        email
      }
    })
    return true;
  }

  public async updateEmail(user: User, dto: ChangeEmailDto): Promise<boolean>  {
    const {newEmail, cloudPassword} = dto;
    if (user.cloudPassword) {
      if (!cloudPassword) {
        throw new NotFoundException({message: 'Введите облачный пароль.', type: 'NON_PASSWORD'});
      }
      const isValidPassword = await verify(user.cloudPassword, cloudPassword);
      if (!isValidPassword) {
        throw new UnauthorizedException('Неверный облачный пароль.');
      }
    }

    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        email: newEmail,
      }
    })
    return true;
  }

  public async setDateBirthdate(user: User, date: string): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        birthday: new Date(date)
      }
    })
    return true;
  }

  public async removeDateBirthdate(user: User): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        birthday: null
      }
    })
    return true;
  }

  public async setBio(user: User, bio: string): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        bio
      }
    })
    return true;
  }

  public async removeBio(user: User): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id
      },
      data: {
        bio: null
      }
    })
    return true;
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

  async sendOtpToMobile(phoneNumber: string): Promise<string> {
    const otp = this.generateOtp();
    const formattedNumber = `+${phoneNumber.replace(/\D/g, '')}`;
    if (!/^\+\d{10,15}$/.test(formattedNumber)) {
      throw new BadRequestException('Неверный формат номера телефона.');
    }
    if (process.env.TWILIO_PHONE_NUMBER === phoneNumber) {
      throw new BadRequestException('Вы не можете отправить SMS на этот номер.');
    }
    try {

      const isExistCode = await this.prismaService.codes.findUnique({
        where: {
          number: phoneNumber,
        },
      });

      if (isExistCode) {
        await this.prismaService.codes.delete({
          where: {
            number: phoneNumber,
          },
        });
      }
      await this.prismaService.codes.create({
        data: {
          number: phoneNumber,
          code: otp,
        },
      });
      await this.twilioClient.messages.create({
        body: `Ваш код для підтвердження: ${otp}. Використайте його, щоб увійти.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${phoneNumber}`,
      });

      return otp;
    } catch (error) {
      console.error('Error sending OTP via SMS', error);
      throw new Error('Failed to send OTP via SMS');
    }
  }


  private generateOtp(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += i % 2 === 0 ? numbers.charAt(Math.floor(Math.random() * numbers.length)) : chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
  }

  private async sendCode(number: string) {
    const otp = await this.sendOtpToMobile(number);
    return { message: 'Код подтверждения успешно отправлен.', code: otp };
  }

  public async verifyOtpCode(number: string, code?: string) {
    const codeInDatabase = await this.prismaService.codes.findUnique({
      where: { number },
    });

    if (!codeInDatabase) {
      await this.sendCode(number);
      throw new BadRequestException({
        message: 'Код подтверждения отправлен. Пожалуйста, введите код, чтобы продолжить.',
        type: 'NON_CODE',
      });
    }

    if (!code) throw new BadRequestException({ message: 'Вы не ввели код подтверждения.', type: 'NON_CODE' });

    if (codeInDatabase.code !== code) throw new BadRequestException({ message: 'Неверный код подтверждения.' });

    await this.prismaService.codes.delete({ where: { number } });
  }

}
