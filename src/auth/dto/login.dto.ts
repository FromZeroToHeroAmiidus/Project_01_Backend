import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  NotEquals,
} from 'class-validator';

export class loginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()])(?=.*[0-9]).{8,}$/, {
    message:
      'Password must contain at least one capital letter, one lowercase letter, one symbol, one number, and be at least 8 characters long',
  })
  password: string;
}
