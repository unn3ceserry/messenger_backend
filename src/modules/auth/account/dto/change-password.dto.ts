import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({message: 'Пароль не может быть пустым.'})
  @IsString({message: 'Неверный формат пароля.'})
  password: string;

  @IsNotEmpty({message: 'Пароль не может быть пустым.'})
  @IsString({message: 'Неверный формат пароля.'})
  newPassword: string;
}