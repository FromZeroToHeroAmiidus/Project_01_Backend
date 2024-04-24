import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { signUpDto } from './dto';
import { loginDto } from './dto';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

  // :port/signup
  @Post('signup')
  signup(@Body() dto: signUpDto) {
    return this.authService.signup(dto);
  }

  // :port/login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signin(@Body() dto: loginDto) {
    return this.authService.signin(dto);
  }
}
