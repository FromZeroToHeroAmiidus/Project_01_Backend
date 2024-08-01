import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Query,
  Res,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, LoginDto } from './dto';
import { Response } from 'express';
import { PasswordResetService } from '../auth/password-reset.services';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      await this.authService.signin(loginDto, res);
    } catch (error) {
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('signout')
  async logout(@Res({ passthrough: true }) res: Response) {
    try {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(HttpStatus.OK).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout failed:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Logout failed', error });
    }
  }

  @Get('check')
  async checkAuth(@Request() req): Promise<any> {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('User not authenticated');
      }
      return { user };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('refresh-token')
  async refreshToken(@Request() req: Request, @Res() res: Response) {
    const refreshToken = (req as any).cookies['refresh_token'];
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token not found' });
    }
    try {
      await this.authService.refreshToken(refreshToken, res);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Post('request-password-reset')
  async requestPasswordReset(
    @Body('email') email: string,
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.passwordResetService.requestPasswordReset(email);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('reset-password')
  async resetPassword(
    // @Query('token') token: string,
    @Body('token') token: string,
    @Res() res: Response,
  ) {
    console.log('Received token:', token); // Debugging: Log the received token

    if (!token) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Token is required.' });
    }

    try {
      const result = await this.passwordResetService.resetPassword(token);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Reset password error:', error.message); // Debugging: Log the error message
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
