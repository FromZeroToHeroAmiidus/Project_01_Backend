import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  NotEquals,
} from 'class-validator';

export class AuthDto {
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
  /*
  @IsString()
  @IsNotEmpty()
  @NotEquals('password', { message: 'Passwords must match' })
  confirmPassword: string;
*/
  /* will finish this later on -first / last / avatar 
    @IsString()
    @IsOptional()
    firstName: string;
    */
}
