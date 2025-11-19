import { IsNotEmpty, IsString, MinLength } from 'class-validator';

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
}