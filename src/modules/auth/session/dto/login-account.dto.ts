import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginAccountDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен для заполнения.' })
  @IsString({ message: 'Номер телефона должен быть строкой.' })
  @Matches(/^\d{10,15}$/, { message: 'Номер телефона должен содержать только цифры и быть от 10 до 15 символов.' })
  number: string;

  @IsOptional()
  @IsString({ message: 'Пароль для облака должен быть строкой.' })
  @MinLength(6, { message: 'Пароль для облака должен содержать минимум 6 символов.' })
  cloudPassword?: string;

  @IsOptional()
  @IsString({ message: 'Код должен быть строкой.' })
  @MinLength(6, { message: 'Код должен содержать ровно 6 символов.' })
  @MaxLength(6, { message: 'Код должен содержать ровно 6 символов.' })
  code?: string;
}
