import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsNotEmpty({message: 'Почта не может быть пустой.'})
  @IsString({message: 'Неверный формат почты.'})
  newEmail: string;

  @IsOptional()
  @IsString({message: 'Неверный формат облачного пароля.'})
  cloudPassword?: string;
}