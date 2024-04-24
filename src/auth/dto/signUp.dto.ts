import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  NotEquals,
} from 'class-validator';

export class signUpDto {
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

  @IsString()
  @IsNotEmpty()
  @NotEquals('password', { message: 'Passwords must match' })
  confirmPassword: string;

  constructor(password: string, confirmPassword: string) {
    this.password = password;
    this.confirmPassword = confirmPassword;
  }

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsOptional()
  avatar: string;
}
