import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Текущий пароль обязателен для заполнения.' })
  @IsString({ message: 'Текущий пароль должен быть строкой.' })
  @MinLength(6, { message: 'Текущий пароль должен содержать минимум 6 символов.' })
  password: string;

  @IsNotEmpty({ message: 'Новый пароль обязателен для заполнения.' })
  @IsString({ message: 'Новый пароль должен быть строкой.' })
  @MinLength(6, { message: 'Новый пароль должен содержать минимум 6 символов.' })
  newPassword: string;
}
