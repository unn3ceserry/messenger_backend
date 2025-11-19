import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginAccountDto {
  @IsNotEmpty({message: 'Номер не может быть пустым.'})
  @IsString({message: 'Неверный формат номера.'})
  number: string;

  @IsOptional()
  @IsString({message: 'Неверный формат облачного пароля.'})
  cloudPassword?: string;
}