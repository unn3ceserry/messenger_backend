import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { CreateAccountDto } from '@/src/modules/account/dto/create-account.dto';
import { User, WhoCanSeen } from '@/prisma/generated/prisma';
import { Twilio } from 'twilio';
import { SetPasswordDto } from '@/src/modules/account/dto/set-password.dto';
import { hash, verify } from 'argon2';
import { ChangePasswordDto } from '@/src/modules/account/dto/change-password.dto';
import { ChangeEmailDto } from '@/src/modules/account/dto/chnage-email.dto';
import { CompleteAccountDto } from './dto/user-complete.dto';
import { FilesService } from '../files/files.service';
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

  public constructor(
    private readonly prismaService: PrismaService,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {
    this.twilioClient = new Twilio(
      this.configService.getOrThrow('TWILIO_ACCOUNT_SID'),
      this.configService.getOrThrow('TWILIO_AUTH_TOKEN'),
    );
  }

  public async createAccount(dto: CreateAccountDto): Promise<User> {
    const { lastName, firstName, username, number, code } = dto;

    if (!lastName || !username || !firstName) {
      throw new BadRequestException({
        message: 'Для регистрации так же нужно заполнить информацию.',
        type: 'NON_INFO',
      });
    }

    await this.assertUserDoesNotExist(username, number);
    // await this.verifyOtpCode(number, code);

    return this.prismaService.user.create({
      data: { username, firstName, lastName, number },
    });
  }

  public async getMe(user: User): Promise<User> {
    const found = await this.prismaService.user.findUnique({
      where: { id: user.id },
    });

    if (!found) {
      throw new UnauthorizedException({
        message: 'Пользователь не авторизирован.',
      });
    }

    return found;
  }

  public async featAvatar(
    user: User,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const { fileUrl } = await this.filesService.upload(file);

    await this.prismaService.user.update({
      where: { username: user.username },
      data: { avatars: { push: fileUrl } },
    });

    return { url: fileUrl };
  }

  public async removeAvatar(user: User, index: number): Promise<boolean> {
    const avatarUrl = user.avatars[index];
    const avatarKey = this.extractAvatarKey(avatarUrl);

    if (avatarKey) {
      await this.filesService.delete(avatarKey);
    }

    await this.prismaService.user.update({
      where: { username: user.username },
      data: { avatars: user.avatars.filter((_, i) => i !== index) },
    });

    return true;
  }

  public async setPassword(user: User, dto: SetPasswordDto): Promise<boolean> {
    if (user.cloudPassword) {
      throw new ConflictException({ message: 'Вы уже используете пароль.' });
    }

    this.assertPasswordsMatch(dto.password, dto.confirmPassword);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { cloudPassword: await hash(dto.password) },
    });

    return true;
  }

  public async changePassword(
    user: User,
    dto: ChangePasswordDto,
  ): Promise<boolean> {
    this.assertPasswordExists(user.cloudPassword);
    await this.assertPasswordIsValid(user.cloudPassword!, dto.password);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { cloudPassword: await hash(dto.newPassword) },
    });

    return true;
  }

  public async removePassword(user: User): Promise<boolean> {
    this.assertPasswordExists(user.cloudPassword);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { cloudPassword: null },
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
      where: { id: user.id },
      data: { email },
    });

    return true;
  }

  public async updateEmail(user: User, dto: ChangeEmailDto): Promise<boolean> {
    if (user.cloudPassword) {
      if (!dto.cloudPassword) {
        throw new NotFoundException({
          message: 'Введите облачный пароль.',
          type: 'NON_PASSWORD',
        });
      }
      await this.assertPasswordIsValid(user.cloudPassword, dto.cloudPassword);
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { email: dto.newEmail },
    });

    return true;
  }

  public async setDateBirthdate(user: User, date: string): Promise<boolean> {
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { birthday: new Date(date) },
    });
    return true;
  }

  public async removeDateBirthdate(user: User): Promise<boolean> {
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { birthday: null },
    });
    return true;
  }

  public async setBio(user: User, bio: string): Promise<boolean> {
    if (bio.length > 70) {
      throw new ConflictException({
        message: 'Максимальная длинна 70 символов.',
      });
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { bio },
    });

    return true;
  }

  public async removeBio(user: User): Promise<boolean> {
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { bio: null },
    });
    return true;
  }

  public async setNames(
    user: User,
    firstname: string,
    lastname: string,
  ): Promise<boolean> {

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { firstName: firstname, lastName: lastname },
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

    if (!/^[a-z0-9]+$/.test(username)) {
      throw new ConflictException({
        message:
          'Имя пользователя может содержать только маленькие буквы a–z и цифры 0–9.',
      });
    }

    const taken = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (taken) {
      throw new ConflictException({
        message: 'Это имя пользователя уже занято.',
      });
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { username },
    });

    return true;
  }

  public async setUserCompleteDate(
    user: User,
    dto: CompleteAccountDto,
  ): Promise<User> {
    const { birthday, email, cloudPassword } = dto;

    if (email) {
      await this.assertEmailIsAvailable(email, user.id);
    }

    const hashedPassword = cloudPassword
      ? await hash(cloudPassword)
      : undefined;

    return this.prismaService.user.update({
      where: { id: user.id },
      data: {
        birthday: birthday ?? user.birthday,
        email: email ?? user.email,
        cloudPassword: hashedPassword ?? user.cloudPassword,
      },
    });
  }

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

  public async sendOtpToMobile(phoneNumber: string): Promise<string> {
    const formatted = `+${phoneNumber.replace(/\D/g, '')}`;

    if (!/^\+\d{10,15}$/.test(formatted)) {
      throw new BadRequestException({
        message: 'Неверный формат номера телефона.',
      });
    }

    if (this.configService.get('TWILIO_PHONE_NUMBER') === phoneNumber) {
      throw new BadRequestException({
        message: 'Вы не можете отправить SMS на этот номер.',
      });
    }

    const otp = this.generateOtp();
    await this.upsertOtpCode(phoneNumber, otp);

    try {
      await this.twilioClient.messages.create({
        body: `Ваш код для підтвердження: ${otp}. Використайте його, щоб увійти.`,
        from: this.configService.getOrThrow('TWILIO_PHONE_NUMBER'),
        to: formatted,
      });
    } catch (error) {
      if (error?.code === 21211) {
        throw new BadRequestException({
          message: 'Неверный номер телефона.',
          details: error.message,
          twilioErrorCode: error.code,
        });
      }
      throw error;
    }

    return otp;
  }

  public async verifyOtpCode(number: string, code?: string): Promise<void> {
    const record = await this.prismaService.codes.findUnique({
      where: { number },
    });

    if (!record) {
      await this.dispatchOtpCode(number);
      throw new BadRequestException({
        message:
          'Код подтверждения отправлен. Пожалуйста, введите код, чтобы продолжить.',
        type: 'NON_CODE',
      });
    }

    if (!code) {
      throw new BadRequestException({
        message: 'Введите код подтверждения.',
        type: 'NON_CODE',
      });
    }

    if (record.code !== code) {
      throw new BadRequestException({ message: 'Неверный код подтверждения.' });
    }
  }

  //  helpers

  private async assertUserDoesNotExist(
    username: string,
    number: string,
  ): Promise<void> {
    const exists = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { username: { equals: username } },
          { number: { equals: number } },
        ],
      },
    });

    if (exists) {
      throw new ConflictException({
        message: 'Пользователь с такими данными уже существует.',
      });
    }
  }

  private async assertEmailIsAvailable(
    email: string,
    currentUserId: string,
  ): Promise<void> {
    const exists = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (exists && exists.id !== currentUserId) {
      throw new ConflictException({ message: 'Данная почта уже занята.' });
    }
  }

  private assertPasswordExists(
    password: string | null,
  ): asserts password is string {
    if (!password) {
      throw new ConflictException({ message: 'Вы не используете пароль.' });
    }
  }

  private assertPasswordsMatch(password: string, confirm: string): void {
    if (password !== confirm) {
      throw new ConflictException({ message: 'Пароль отличается от первого.' });
    }
  }

  private async assertPasswordIsValid(
    hashed: string,
    plain: string,
  ): Promise<void> {
    const valid = await verify(hashed, plain);
    if (!valid) {
      throw new UnauthorizedException({ message: 'Неверный облачный пароль.' });
    }
  }

  private extractAvatarKey(url: string): string | null {
    if (!url.includes('/avatars/')) return null;

    const bucket = this.configService.getOrThrow<string>('S3_BUCKET');
    const parts = url.split(bucket);

    return parts.length === 2 ? parts[1] : null;
  }

  private async upsertOtpCode(number: string, otp: string): Promise<void> {
    await this.prismaService.codes.deleteMany({ where: { number } });
    await this.prismaService.codes.create({ data: { number, code: otp } });
  }

  private async dispatchOtpCode(number: string): Promise<void> {
    await this.sendOtpToMobile(number);
  }

  private generateOtp(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    return Array.from({ length: 6 }, (_, i) =>
      i % 2 === 0
        ? digits[Math.floor(Math.random() * digits.length)]
        : letters[Math.floor(Math.random() * letters.length)],
    ).join('');
  }
}
