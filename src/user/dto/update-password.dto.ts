import { IsNotEmpty, IsString, Matches, NotEquals } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()])(?=.*[0-9]).{8,}$/, {
    message:
      'Password must contain at least one capital letter, one lowercase letter, one symbol, one number, and be at least 8 characters long',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @NotEquals('newPassword', { message: 'Passwords must match' })
  confirmNewPassword: string;
}
