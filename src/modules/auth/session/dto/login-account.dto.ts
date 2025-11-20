import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAccountDto {
  @IsNotEmpty({message: 'Номер не может быть пустым.'})
  @IsString({message: 'Неверный формат номера.'})
  number: string;

  @IsOptional()
  @IsString({message: 'Неверный формат облачного пароля.'})
  cloudPassword?: string;

  @IsOptional()
  @IsString({message: 'Неверный формат кода подтверждения.'})
  @MinLength(6, {message: 'Длинна пароля не должна быть меньше 6 символов.'})
  @MaxLength(6, {message: 'Длинна пароля не должна быть больше 6 символов.'})
  code?: string;
}