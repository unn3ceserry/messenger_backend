import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
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

export enum VisibilityField {
  Phone = 'phoneVisible',
  Email = 'emailVisible',
  Bio = 'bioVisible',
  Avatars = 'avatarsVisible',
  Birthday = 'birthdayVisible',
}

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
    await this.existUser(username, number);
    await this.verifyOtpCode(number, code);
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

  public async removePassword(user: User, password: string): Promise<boolean> {
    if (!user.cloudPassword) {
      throw new ConflictException({ message: 'Вы не используете пароль.' });
    }
    const verifyPassword = await verify(user.cloudPassword, password);
    if (!verifyPassword) {
      throw new ConflictException({ message: 'Неверный пароль.' });
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

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: newEmail },
    });

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
    if (username.length < 4) {
      throw new ConflictException({
        message:
          'Минимальная длинна имени пользователя не может быть меньше 4 символов.',
      });
    }
    const existName = await this.prismaService.user.findUnique({
      where: {
        username,
      },
    });

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

  public async setUserCompleteDate(
    user: User,
    dto: CompleteAccountDto,
  ): Promise<User> {
    const { birthday, email, cloudPassword } = dto;
    const exists = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (exists && exists.id !== user.id) {
      throw new ConflictException({message: 'Данная почта уже занята.'});
    }

    return await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        birthday: birthday ? birthday : user.birthday,
        email: email ? email : user.email,
        cloudPassword: cloudPassword ? cloudPassword : user.cloudPassword,
      },
    });
  }

  // VISIBLE SETTINGS

  public async setVisibility(
    user: User,
    field: VisibilityField,
    whoCanSee: WhoCanSeen,
  ): Promise<boolean> {
    if (!WhoCanSeen[whoCanSee] || !VisibilityField[field]) {
      throw new ConflictException({ message: 'Неверный тип.' });
    }
    if (!Object.values(WhoCanSeen).includes(whoCanSee)) {
      throw new ConflictException({ message: 'Неверный тип WhoCanSeen.' });
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { [VisibilityField[field]]: whoCanSee },
    });

    return true;
  }

  public async getUserData(user: User, username: string) {
    if (!username) {
      throw new BadRequestException({ message: 'Введите имя пользователя.' });
    }
    const userFind = await this.prismaService.user.findUnique({
      where: { username },
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
        bio: true,
        avatars: true,
        birthday: true,
        contacts: { select: { usernameContact: true } },
      },
    });

    if (!userFind) return null;

    const isContact = userFind.contacts.some(
      (c) => c.usernameContact === user.username,
    );

    const result: Partial<User> = {
      username: userFind.username,
      firstName: userFind.firstName,
      lastName: userFind.lastName,
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
