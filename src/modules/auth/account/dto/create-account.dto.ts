import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty({message: 'Номер не может быть пустым.'})
  @IsString({message: 'Неверный формат номера.'})
  number: string;

  @IsNotEmpty({message: 'Имя пользователя не может быть пустым.'})
  @IsString({message: 'Неверный формат имени пользователя.'})
  @MinLength(4, {message: 'Минимальная длинна имени пользователя не может быть меньше 4 символов.'})
  username: string;

  @IsNotEmpty({message: 'Имя пользователя не может быть пустым.'})
  @IsString({message: 'Неверный формат имени.'})
  firstName: string;

  @IsNotEmpty({message: 'Фамилия пользователя не может быть пустой.'})
  @IsString({message: 'Неверный формат фамилии.'})
  lastName: string;

  @IsOptional()
  @IsString({message: 'Неверный формат кода подтверждения.'})
  @MinLength(6, {message: 'Длинна пароля не должна быть меньше 6 символов.'})
  @MaxLength(6, {message: 'Длинна пароля не должна быть больше 6 символов.'})
  code?: string;
}