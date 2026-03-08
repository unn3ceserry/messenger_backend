import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, MinLength, IsEmail, IsDate } from 'class-validator';

export class CompleteAccountDto {
  @IsOptional()
  @IsEmail({}, { message: 'Имя пользователя должно быть строкой.' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Пароль для облака должен быть строкой.' })
  @MinLength(6, {
    message: 'Пароль для облака должен содержать минимум 6 символов.',
  })
  cloudPassword?: string;

  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDate({ message: 'День рождения должен быть датой.' })
  birthday: Date;
}
