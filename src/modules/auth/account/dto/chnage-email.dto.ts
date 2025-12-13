import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @IsNotEmpty({ message: 'Новый адрес электронной почты обязателен для заполнения.' })
  @IsEmail({}, { message: 'Введите корректный адрес электронной почты.' })
  newEmail: string;

  @IsOptional()
  @IsString({ message: 'Пароль для облака должен быть строкой.' })
  @MinLength(6, { message: 'Пароль для облака должен содержать минимум 6 символов.' })
  cloudPassword?: string;
}
