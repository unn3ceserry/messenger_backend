import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeNameDto {
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой.' })
  @MinLength(2, { message: 'Имя не может быть меньше 2 символa.' })
  @MaxLength(25, { message: 'Имя не может превышать 25 символов.' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой.' })
  @MinLength(2, { message: 'Имя не может быть меньше 2 символa.' })
  @MaxLength(25, { message: 'Фамилия не может превышать 25 символов.' })
  lastName: string;
}
