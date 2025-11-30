import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginAccountDto {
  @IsNotEmpty({ message: 'errors.account.number.isNotEmpty' })
  @IsString({ message: 'errors.account.number.isString' })
  number: string;

  @IsOptional()
  @IsString({ message: 'errors.password.passwordIsString' })
  cloudPassword?: string;

  @IsOptional()
  @IsString({ message: 'errors.account.code.isString' })
  @MinLength(6, { message: 'errors.account.code.minLength' })
  @MaxLength(6, { message: 'errors.account.code.maxLength' })
  code?: string;
}
