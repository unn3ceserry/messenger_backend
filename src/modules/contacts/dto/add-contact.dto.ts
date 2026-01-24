import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class AddContactDto {
  @IsOptional()
  @IsString({ message: 'Имя пользователя должно быть строкой.' })
  @MinLength(4, {
    message: 'Имя пользователя должно содержать минимум 4 символа.',
  })
  @MaxLength(20, {
    message: 'Имя пользователя не может превышать 20 символов.',
  })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message:
      'Имя пользователя может содержать только английские буквы и цифры.',
  })
  username: string;

  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой.' })
  @MaxLength(50, { message: 'Имя не может превышать 50 символов.' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой.' })
  @MaxLength(50, { message: 'Фамилия не может превышать 50 символов.' })
  lastName: string;
}
