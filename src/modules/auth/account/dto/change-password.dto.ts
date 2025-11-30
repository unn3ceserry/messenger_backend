import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({message: 'errors.password.isNotEmpty'})
  @IsString({message: 'errors.password.isString'})
  password: string;

  @IsNotEmpty({message: 'errors.password.isNotEmpty'})
  @IsString({message: 'errors.password.isString'})
  newPassword: string;
}