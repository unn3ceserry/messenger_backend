import { IsNotEmpty, IsString } from 'class-validator';

export class SetPasswordDto {
  @IsNotEmpty({message: 'Пароль не может быть пустым.'})
  @IsString({message: 'Неверный формат пароля.'})
  password: string;

  @IsNotEmpty({message: 'Пароль не может быть пустым.'})
  @IsString({message: 'Неверный формат пароля.'})
  confirmPassword: string;
}