import { IsEmail, IsOptional, IsString } from 'class-validator';
// DEV IN PROGRESS - TESTING STAGE
export class EditUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
