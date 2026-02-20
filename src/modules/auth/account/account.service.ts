import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { CreateAccountDto } from '@/src/modules/auth/account/dto/create-account.dto';
import { User, WhoCanSeen } from '@/prisma/generated/prisma';
import { Twilio } from 'twilio';
import { SetPasswordDto } from '@/src/modules/auth/account/dto/set-password.dto';
import { hash, verify } from 'argon2';
import { ChangePasswordDto } from '@/src/modules/auth/account/dto/change-password.dto';
import { ChangeEmailDto } from '@/src/modules/auth/account/dto/chnage-email.dto';
import { CompleteAccountDto } from './dto/user-complete.dto';
import { FilesService } from '../../files/files.service';
import { ConfigService } from '@nestjs/config';

export enum VisibilityField {
  Phone = 'phoneVisible',
  Email = 'emailVisible',
  Bio = 'bioVisible',
  Birthday = 'birthdayVisible',
}

@Injectable()
export class AccountService {
  private readonly twilioClient: Twilio;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  public async createAccount(dto: CreateAccountDto): Promise<User> {
    const { lastName, firstName, username, number, code } = dto;
    await this.existUser(username, number);
    // await this.verifyOtpCode(number, code);
    if (!lastName || !username || !firstName) {
      throw new BadRequestException({
        message: 'Для регистрации так же нужно заполнить информацию.',
        type: 'NON_INFO',
      });
    }
    const user = await this.prismaService.user.create({
      data: {
        username,
        firstName,
        lastName,
        number,
      },
    });

    return user;
  }

  public async featAvatar(
    user: User,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const avatar = await this.filesService.upload(file);
    await this.prismaService.user.update({
      where: { username: user.username },
      data: {
        avatars: {
          push: avatar.url,
        },
      },
    });
    return { url: avatar.url };
  }

  public async removeAvatar(user: User, index: number): Promise<boolean> {
    const oldAvatarUrl = user.avatars[index];
    let oldAvatarKey: string | null = null;

    if (oldAvatarUrl.includes('/avatars/')) {
      const split = oldAvatarUrl.split(`${this.configService.getOrThrow<string>('S3_BUCKET')}`);
      if (split.length === 2) {
        oldAvatarKey = split[1];
      }
    }

    if (oldAvatarKey) {
      await this.filesService.delete(oldAvatarKey);
    }

    await this.prismaService.user.update({
      where: { username: user.username },
      data: {
        avatars: user.avatars.filter((_, i) => i !== index),
      },
    });

    return true;
  }

  public async getMe(user: User): Promise<User> {
    const foundUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
    });
    if (!foundUser) {
      throw new UnauthorizedException({
        message: 'Пользователь не авторизирован.',
      });
    }
    return foundUser;
  }

  public async setPassword(user: User, dto: SetPasswordDto): Promise<boolean> {
    if (user.cloudPassword) {
      throw new ConflictException({ message: 'Вы уже используете пароль.' });
    }
    const { password, confirmPassword } = dto;
    if (password !== confirmPassword) {
      throw new ConflictException({ message: 'Пароль отличается от первого.' });
    }
    const hashPassword = await hash(password);
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        cloudPassword: hashPassword,
      },
    });
    return true;
  }

  public async changePassword(
    user: User,
    dto: ChangePasswordDto,
  ): Promise<boolean> {
    if (!user.cloudPassword) {
      throw new ConflictException({ message: 'Вы не используете пароль.' });
    }
    const { password, newPassword } = dto;
    const verifyPassword = await verify(user.cloudPassword, password);
    if (!verifyPassword) {
      throw new ConflictException({ message: 'Неверный пароль.' });
    }
    const hashPassword = await hash(newPassword);
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        cloudPassword: hashPassword,
      },
    });
    return true;
  }

  public async removePassword(user: User): Promise<boolean> {
    if (!user.cloudPassword) {
      throw new ConflictException({ message: 'Вы не используете пароль.' });
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        cloudPassword: null,
      },
    });
    return true;
  }

  public async addEmail(user: User, email: string): Promise<boolean> {
    if (user.email) {
      throw new ConflictException({
        message: 'К аккаунту уже привязана почта.',
      });
    }
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
      },
    });
    return true;
  }

  public async updateEmail(user: User, dto: ChangeEmailDto): Promise<boolean> {
    const { newEmail, cloudPassword } = dto;
    if (user.cloudPassword) {
      if (!cloudPassword) {
        throw new NotFoundException({
          message: 'Введите облачный пароль.',
          type: 'NON_PASSWORD',
        });
      }
      const isValidPassword = await verify(user.cloudPassword, cloudPassword);
      if (!isValidPassword) {
        throw new UnauthorizedException({
          message: 'Неверный облачный пароль.',
        });
      }
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        email: newEmail,
      },
    });
    return true;
  }

  public async setDateBirthdate(user: User, date: string): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        birthday: new Date(date),
      },
    });
    return true;
  }

  public async removeDateBirthdate(user: User): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        birthday: null,
      },
    });
    return true;
  }

  public async setBio(user: User, bio: string): Promise<boolean> {
    if (bio.length > 70) {
      throw new ConflictException({
        message: 'Максимаьная длинна 70 символов.',
      });
    }
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        bio,
      },
    });
    return true;
  }

  public async removeBio(user: User): Promise<boolean> {
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        bio: null,
      },
    });
    return true;
  }

  public async setNames(
    user: User,
    firstname: string,
    lastname: string,
  ): Promise<boolean> {
    if (lastname.length < 2 || firstname.length < 2) {
      throw new ConflictException({ message: 'Минимальная длинна 2.' });
    }
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        firstName: firstname,
        lastName: lastname,
      },
    });
    return true;
  }

  public async updateUsername(user: User, username: string): Promise<boolean> {
    if (username.length < 5) {
      throw new ConflictException({
        message:
          'Минимальная длинна имени пользователя не может быть меньше 5 символов.',
      });
    }
    const existName = await this.prismaService.user.findUnique({
      where: {
        username,
      },
    });

    if (!/^[a-z0-9]+$/.test(username)) {
      throw new ConflictException({
        message:
          'Имя пользователя может содержать только маленькие буквы a–z и цифры 0–9.',
      });
    }

    if (existName) {
      throw new ConflictException({
        message: 'Это имя пользователя уже занято.',
      });
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        username,
      },
    });
    return true;
  }

  public async setUserCompleteDate(
    user: User,
    dto: CompleteAccountDto,
  ): Promise<User> {
    const { birthday, email, cloudPassword } = dto;
    const exists = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (exists && exists.id !== user.id) {
      throw new ConflictException({ message: 'Данная почта уже занята.' });
    }
    let hashPassword;
    if (cloudPassword) {
      hashPassword = await hash(cloudPassword);
    }
    return await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        birthday: birthday ? birthday : user.birthday,
        email: email ? email : user.email,
        cloudPassword: cloudPassword ? hashPassword : user.cloudPassword,
      },
    });
  }

  // VISIBLE SETTINGS

  public async setVisibility(
    user: User,
    field: string,
    whoCanSee: string,
  ): Promise<boolean> {
    if (!Object.values(WhoCanSeen).includes(whoCanSee as WhoCanSeen)) {
      throw new ConflictException({ message: 'Неверный тип WhoCanSeen.' });
    }

    if (!Object.values(VisibilityField).includes(field as VisibilityField)) {
      throw new ConflictException({ message: 'Неверный тип field.' });
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { [field]: whoCanSee },
    });

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
      throw new ConflictException({
        message: 'Пользователь с такими данными уже существует.',
      });
    }
    return true;
  }

  async sendOtpToMobile(phoneNumber: string) {
    const otp = this.generateOtp();
    const formattedNumber = `+${phoneNumber.replace(/\D/g, '')}`;
    if (!/^\+\d{10,15}$/.test(formattedNumber)) {
      throw new BadRequestException({
        message: 'Неверный формат номера телефона.',
      });
    }
    if (process.env.TWILIO_PHONE_NUMBER === phoneNumber) {
      throw new BadRequestException({
        message: 'Вы не можете отправить SMS на этот номер.',
      });
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
      if (error?.code === 21211) {
        throw new BadRequestException({
          message: 'Неверный номер телефона.',
          details: error.message,
          twilioErrorCode: error.code,
        });
      }
    }
  }

  private generateOtp(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp +=
        i % 2 === 0
          ? numbers.charAt(Math.floor(Math.random() * numbers.length))
          : chars.charAt(Math.floor(Math.random() * chars.length));
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
        message:
          'Код подтверждения отправлен. Пожалуйста, введите код, чтобы продолжить.',
        type: 'NON_CODE',
      });
    }

    if (!code)
      throw new BadRequestException({
        message: 'Введите код подтверждения.',
        type: 'NON_CODE',
      });

    if (codeInDatabase.code !== code)
      throw new BadRequestException({ message: 'Неверный код подтверждения.' });
  }
}
