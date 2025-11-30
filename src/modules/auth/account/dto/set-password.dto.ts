import { IsNotEmpty, IsString } from 'class-validator';

export class SetPasswordDto {
  @IsNotEmpty({message: 'errors.password.isNotEmpty'})
  @IsString({message: 'errors.password.isString'})
  password: string;

  @IsNotEmpty({message: 'errors.password.isNotEmpty'})
  @IsString({message: 'errors.password.isString'})
  confirmPassword: string;
}