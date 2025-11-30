import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty({ message: 'errors.account.number.isNotEmpty' })
  @IsString({ message: 'errors.account.number.isString' })
  number: string;

  @IsNotEmpty({ message: 'errors.account.username.isNotEmpty' })
  @IsString({ message: 'errors.account.username.isString' })
  @MinLength(4, { message: 'errors.account.username.minLength' })
  username: string;

  @IsNotEmpty({ message: 'errors.account.firstName.isNotEmpty' })
  @IsString({ message: 'errors.account.firstName.isString' })
  firstName: string;

  @IsNotEmpty({ message: 'errors.account.lastName.isNotEmpty' })
  @IsString({ message: 'errors.account.lastName.isString' })
  lastName: string;

  @IsOptional()
  @IsString({ message: 'errors.account.code.isString' })
  @MinLength(6, { message: 'errors.account.code.minLength' })
  @MaxLength(6, { message: 'errors.account.code.maxLength' })
  code?: string;
}