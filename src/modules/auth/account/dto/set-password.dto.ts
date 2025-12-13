import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsNotEmpty({ message: 'Пароль обязателен для заполнения.' })
  @IsString({ message: 'Пароль должен быть строкой.' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов.' })
  password: string;

  @IsNotEmpty({ message: 'Подтверждение пароля обязательно для заполнения.' })
  @IsString({ message: 'Подтверждение пароля должно быть строкой.' })
  @MinLength(6, { message: 'Подтверждение пароля должно содержать минимум 6 символов.' })
  confirmPassword: string;
}
