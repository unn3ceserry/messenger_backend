import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен для заполнения.' })
  @IsString({ message: 'Номер телефона должен быть строкой.' })
  @Matches(/^\d{10,15}$/, { message: 'Номер телефона должен содержать только цифры и быть от 10 до 15 символов.' })
  number: string;

  @IsNotEmpty({ message: 'Имя пользователя обязательно для заполнения.' })
  @IsString({ message: 'Имя пользователя должно быть строкой.' })
  @MinLength(4, { message: 'Имя пользователя должно содержать минимум 4 символа.' })
  @MaxLength(20, { message: 'Имя пользователя не может превышать 20 символов.' })
  username: string;

  @IsNotEmpty({ message: 'Имя обязательно для заполнения.' })
  @IsString({ message: 'Имя должно быть строкой.' })
  @MaxLength(50, { message: 'Имя не может превышать 50 символов.' })
  firstName: string;

  @IsNotEmpty({ message: 'Фамилия обязательна для заполнения.' })
  @IsString({ message: 'Фамилия должна быть строкой.' })
  @MaxLength(50, { message: 'Фамилия не может превышать 50 символов.' })
  lastName: string;

  @IsOptional()
  @IsString({ message: 'Код должен быть строкой.' })
  @MinLength(6, { message: 'Код должен содержать ровно 6 символов.' })
  @MaxLength(6, { message: 'Код должен содержать ровно 6 символов.' })
  @Matches(/^\d{6}$/, { message: 'Код должен состоять только из цифр.' })
  code?: string;
}
