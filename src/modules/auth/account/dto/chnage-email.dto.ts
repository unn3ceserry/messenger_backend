import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsNotEmpty({message: 'errors.email.isNotEmpty'})
  @IsEmail({}, {message: 'errors.email.isEmail'})
  newEmail: string;

  @IsOptional()
  @IsString({message: 'errors.password.passwordIsString'})
  cloudPassword?: string;
}